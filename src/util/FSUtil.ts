/**
 * 统一文件操作, 避免导包的繁琐
 */
import childProcess from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import stream from 'stream'
import { isNonEmptyArray, joinNoEmpty } from './ArrayUtil'
import { nowForFilename } from './DateUtil'
import {
	extnameOf,
	filenameContainsOf,
	getFullFileName,
	getFileName,
	getFolderName,
    safenPath,
} from './PathUtil'
import { isContainsOf, replaceStringsByMap } from './StringUtil'

const fsPromises = fs.promises

const { exec } = childProcess

/**
 * 文件夹类型
 * 为了遍历而设计的
 */
export type Directory = {
	// 文件名数组, 可为空数组
	files: Array<string>,
	// 文件夹名 Map, 可为空 Map. 为什么不使用对象? 文件夹名可能很奇怪, 对象的属性名怪怪的不舒适. 在其它语言也是不友好的.
	// [lyne] 不同语言语法不同, 支持的功能不同. 为 "跨语言的函数设计", 无关紧要时, 仅可能使用 "通用的语法支持". 如 JavaScript 别写函数内的函数
	directoryMap: Map<string, Directory>
	path: string
}

/**
 * 是否存在
 * @param {string} path
 * @return {Promise<boolean>}
 */
export async function isExist (path: string): Promise<boolean> {
	return fsPromises.access(path, fs.constants.R_OK)
		.then(() => {
			return true
		})
		// 出错就是不存在, node 是这样设计的
		.catch((err) => {
			return false
		})
}

/**
 * determine the given absolute path is file
 * @param {string} path 绝对路径
 * @param {boolean} isCheckExistence
 * @return {Promise<boolean>}
 */
export async function isFile (path: string, isCheckExistence: boolean = true): Promise<boolean> {
	if (isCheckExistence) {
		if (!await isExist(path)) {
			return false
		} else {
			const state = await fsPromises.stat(path)
			return state.isFile()
		}
	} else {
		const state = await fsPromises.stat(path)
		return state.isFile()
	}
}

/*
 [lyne]
不同函数, 特别功能性函数(可单独运行的函数), 可能存在冗余的逻辑代码, 直接套用其它方法可能丢失性能
如: createDirectory(string) 与 isDirectory(string) 都会判断是否存在,
	如果 createDirectory(string) 用到了 isDirectory(string) 则会进行两次相同的 IO

方案一: 若要存储其它方法运行的信息, 只能使用 OOP.
  比如添加一个内部对象, 用于存储信息, 每次使用某些函数都是初始化该函数, 使用完就销毁

方案二: 写额外的内部函数
  比如已经有函数 isDirectory(string), 判断优先是否存在, 则可再写个内部函数 isDirectoryNotCheckExist(string)
  代码冗余了.

方案三: 添加额外参数, [推荐] 的方案
  比如添加 isCheckExist 参数, isDirectory (path: string, isCheckExist: boolean = true)
  多加几个判断, 对性能的影响忽略不计
*/

/**
 * determine the given absolute path is directory
 * @param {string} pathArg 绝对路径
 * @param {boolean} isCheckExistence 是否检测存在性
 * @return {Promise<boolean>}
 *
 * isCheckExistence 参数是为了性能设计的, 避免有些时候, 进行多次 IO. 比如避免多次检测某个路径是否存在对于的文件
 */
export async function isDirectory (pathArg: string, isCheckExistence: boolean = true): Promise<boolean> {
	if (isCheckExistence) {
		if (!await isExist(pathArg)) {
			return false
		} else {
			const state = await fsPromises.stat(pathArg)
			return state.isDirectory()
		}
	} else {
		const state = await fsPromises.stat(pathArg)
		return state.isDirectory()
	}
}

/**
 * <functionalParameterType function="isEmptyDirectory" />
 */
export type IsEmptyDirectoryParameter = {
	path: string
	// 性能相关的选项
	isCheckExistence?: boolean
	// 性能相关的选项
	isCheckIsDirectory?: boolean
}

/**
 *
 * @param {string} pathArg
 * @param {boolean | undefined} isCheckExistence
 * @param {boolean | undefined} isCheckIsDirectory
 * @return {Promise<boolean>}
 */
export async function isEmptyDirectory ({
	path: pathArg,
	isCheckExistence = true,
	isCheckIsDirectory = true
}:IsEmptyDirectoryParameter ): Promise<boolean>  {
	async function isEmptyDirectoryLocal (): Promise<boolean> {
		const files = await fsPromises.readdir(pathArg)
		return files.length > 0
	}
	if (isCheckIsDirectory) {
		if(isDirectory(pathArg, isCheckExistence)) {
			return isEmptyDirectoryLocal()
		} else {
			return false
		}
	} else {
		return isEmptyDirectoryLocal()
	}

}

/**
 * <functionalParameterType function="createDirectory" />
 */
export type CreateDirectoryParameter = {

	path: string

	/**
	 * 是否检测 ${path} 的存在性
	 *
	 * <design>
	 *     为了性能而设置的, 如果之前已经判断是否存在了, 就设为 false, 就不用再次 IO
	 * </design>
	 */
	isCheckExistence?: boolean

	/**
	 * 意为 isOverwiteNotEmptyDirectory
	 *
	 * <necessity optional />
	 */
	isClear?: boolean

	/**
	 * 意为 isOverwriteSamePathFile
	 *
	 * <necessity optional />
	 */
	isOverwiteFile?: boolean
}


/**
 * 创建目录, 会 recursive 创建
 * @param {string} path 绝对路径, 或相对路径
 * @param {boolean |undefined} isCheckExistence
 * @param {boolean |undefined} isClear
 * @param {boolean |undefined} isOverwiteFile
 * @return {Promise<boolean>}
 * 	如果不存在, 新建成功返回 true, 新建失败抛异常
 * 	如果存在, 但为文件, 返回 false. 不会删除文件, 显然也不会新建文件夹.
 */
export async function createDirectory ({
	// [lyne] JavaScript 解构重命名使用 ":", 因为 "=" 被赋值符占用, 为什么不能用 as, 模块占用.
	path: pathArg,
	isCheckExistence = true,
	isClear = false,
	isOverwiteFile = false
}: CreateDirectoryParameter): Promise<boolean> {



	const isFileVar = await isFile(pathArg, false)
	const isDrectoryVar = await isDirectory(pathArg, false)

	async function mkdirLocal (): Promise<boolean> {
		return fsPromises.mkdir(pathArg, { recursive: true })
			.then(() => {
				return true
			})
			.catch((err: any) => {
				throw new Error(`Error: Create directory ${pathArg} failed!`)
			})
	}

	async function doIfExistFileLocal (): Promise<boolean> {
		if (isOverwiteFile) {
			await deleteFile(pathArg, false)
			return mkdirLocal()
		} else {
			return false
		}
	}

	async function doIfExistDirectoryLocal (): Promise<boolean> {
		const isEmpty = await isEmptyDirectory({
			path: pathArg,
			isCheckExistence: false,
			isCheckIsDirectory: false
		})
		if (isEmpty){
			return true
		}else if (isClear) {
			await deleteDirectory(pathArg, false)
			return mkdirLocal()
		} else {
			return false
		}
	}


	// 若检测存在性
	if (isCheckExistence) {
		const isExistVar = await isExist(pathArg)
		// 若不存在直接创建
		if (!isExistVar) {
			return mkdirLocal()
		}
		// 若路径存在且为文件
		else if (isFileVar) {
			return doIfExistFileLocal()
		}
		// 若存在且为文件夹
		else if (isDrectoryVar) {
			return doIfExistDirectoryLocal()
		}
		// 其它情况
		else {
			return false
		}
	}
	// 若不检测存在性
	else {
		if (isFileVar) {
			return doIfExistFileLocal()
		}
		// 若存在且为文件夹
		else if (isDrectoryVar) {
			return doIfExistDirectoryLocal()
		}
		// 其它情况, 备用的
		else {
			return false
		}
	}
}




/**
 * <functionalParameterType function="createFile" />
 */
export type CreateFileParameter = {

	path: string

	/**
	 * 是否检测 ${path} 的存在性
	 *
	 * <design>
	 *     为了性能而设置的, 如果之前已经判断是否存在了, 就设为 false, 就不用再次 IO
	 * </design>
	 */
	isCheckExistence?: boolean

	/**
	 * 是否覆盖文件
	 *
	 * <necessity optional />
	 */
	isOverwiteFile?: boolean

	/**
	 * 意为 isOverwriteSamePathEmptyDirectory
	 *
	 * <necessity optional />
	 */
	isOverwriteEmptyDirectory?: boolean

	/**
	 * 意为 isOverwriteSamePathNotEmptyDirectory
	 *
	 * <necessity optional />
	 */
	isOverwriteNotEmptyDirectory?: boolean
}
export async function createFile ({
	path: pathArg,
	// 为了性能, 如果之前已经判断是否存在了, 就不用再次 IO
	isCheckExistence = true,
	// 虽然这是不完全的, 但 Node 默认是这样.
	isOverwiteFile = true,
	// 一般情况下, 空文件夹无用, 直接删除即可
	isOverwriteEmptyDirectory = true,
	// 默认删除有文件的文件夹显然是不推荐的, 所以默认 false
	isOverwriteNotEmptyDirectory = false
}: CreateFileParameter): Promise<boolean> {


	const isFileVar = await isFile(pathArg, false)
	const isDrectoryVar = await isDirectory(pathArg, false)

	async function createFileLocal (): Promise<boolean> {
		return fsPromises.writeFile(pathArg, '')
			.then(() => {
				return true
			})
			.catch((err: any) => {
				console.log(err)
				throw new Error(`Error: Create file ${pathArg} failed!`)
			})
	}


	async function doIfExistFileLocal (): Promise<boolean> {
		if (isOverwiteFile) {
			// NOde 默认覆盖文件
			return createFileLocal()
		} else {
			return false
		}
	}

	async function doIfExistDirectoryLocal (): Promise<boolean> {
		const isEmpty = await isEmptyDirectory({
			path: pathArg,
			isCheckExistence: false,
			isCheckIsDirectory: false
		})
		if ((isEmpty && isOverwriteEmptyDirectory) || (!isEmpty && isOverwriteEmptyDirectory)){
			await deleteDirectory(pathArg, false)
			return createFileLocal()
		}else {
			return false
		}
	}
	// 若检测存在性
	if (isCheckExistence) {
		const isExistVar = await isExist(pathArg)
		// 若不存在直接创建
		if (!isExistVar) {
			return createFileLocal()
		}
		// 若路径存在且为文件
		else if (isFileVar) {
			return doIfExistFileLocal()
		}
		// 若存在且为文件夹
		else if (isDrectoryVar) {
			return doIfExistDirectoryLocal()
		}
		// 其它情况, 备用的
		else {
			return false
		}
	}
	// 若不检测存在性
	else {
		if (isFileVar) {
			return doIfExistFileLocal()
		}
		// 若存在且为文件夹
		else if (isDrectoryVar) {
			return doIfExistDirectoryLocal()
		}
		// 其它情况, 备用的
		else {
			return false
		}
	}

}

/**
 * delete a file
 * @param {string} filePath
 * @param {boolean} isCheckExistence
 * @return {Promise<void>}
 */
export async function deleteFile (filePath: string, isCheckExistence: boolean = true): Promise<void> {
	if (isCheckExistence && await isExist(filePath)) {
		return fsPromises.unlink(filePath)
	} else {
		return fsPromises.unlink(filePath)
	}
}

/**
 *
 * @param {string} dirPath
 * @param {boolean} isCheckExistence
 * @return {Promise<void>}
 */
export async function deleteDirectory (dirPath: string, isCheckExistence: boolean = true): Promise<void> {
	if (isCheckExistence && await isExist(dirPath)) {
		return fsPromises.rmdir(dirPath, {recursive: true})
	} else {
		return fsPromises.rmdir(dirPath, {recursive: true})
	}

}

/**
 * 从 url 中获取文件名名称, 显然不是所有 url 都能使用
 * @param url
 */
export function getFileNameOfURL (url: string): string {
	let lastSlashIndex = url.lastIndexOf('/')
	let filename = url.substring(lastSlashIndex + 1)
	if (filename.indexOf('.') < 0) {
		console.warn('[Warn]', `filename.indexOf('.') < 0 !`)
	}
	return filename
}

export function getMD5FromBuffer (buffer: ArrayBuffer): Promise<string> {
	return new Promise((resolve, reject) => {
		const output = crypto.createHash('md5')
		// 创建一个bufferstream
		let bufferStream = new stream.PassThrough()

		bufferStream.on('error', err => {
			reject(err)
		})
		bufferStream.end(buffer)

		output.once('readable', () => {
			resolve(output.read().toString('hex'))
		})

		bufferStream.pipe(output)
	})
}

/**
 * 为了备份 重命名文件/目录
 * @param {string} filePath 文件/目录的绝对路径
 * @return {Promise<string>} 若路径存在返回备份后的文件名/文件夹名，不存在则返回空串
 */
export async function renameForBackup (filePath: string): Promise<string> {
	if (await isExist(filePath)) {
		const state = await fsPromises.stat(filePath)
		let backupName: string = ''
		if (state.isFile()) {
			backupName = path.basename(filePath) + '_backup_' + nowForFilename()
		} else if (state.isDirectory()) {
			backupName = getFolderName(filePath) + '_backup_' + nowForFilename()
		}
		return fsPromises.rename(filePath, path.resolve(path.dirname(filePath), backupName)).then(() => {
			return backupName
		})
	} else {
		return ''
	}

}






/**
 * 打开文件, 只在 Windows 上运行.
 * [lyne] Absolute path is better for open a file.
 * [lyne] Win10上, explorer 指令的路径参数有格式要求, 双 "\\" 等非标准 Windows 路径会解析出错, 所以用 path.resolve() 处理下.
 * [lyne] Win10, 在 cmd.exe, 打开文件的话, 仅需执行 "文件路径" 这个指令. 但是在 Node 里 exec("文件路径")不行. 所以在 Node 里还是要用 exec(`explore "${fileURL}"`)
 */
export function openFileOnWindows (fileURL: string): void {
	let script = `explorer "${fileURL}"`
	exec(script)
}

export let openFile = openFileOnWindows

/*
[lyne]
TypeScript 里, class 内部是不能导出类型的, namespace 里可以
如果单独定义函数参数类型, 函数返回值类型, 只能放在 class 代码外部, 对眼睛不友好.
*/

/**
 * <functionalParameterType function="filterFilesAndDirectories" />
 */
export type FilterFilesAndDirectoriesParameter = {

	/**
	 * 被筛选的目录, 可为 绝对路径 或 相对路径
	 *
	 * <necessity required />
	 */
	dir: string

	/**
	 * 是否获取文件
	 *
	 * 为 false 表示不获得任何文件, 显然也不会进行筛选
	 *
	 * <necessity optional />
	 */
	isGetFiles?: boolean

	/**
	 * 是否获取文件夹
	 *
	 * <necessity optional />
	 */
	isGetDirectories?: boolean

	/**
	 * 文件名/文件夹名 含有 inclusions 中任意一个则认为符合筛选条件
	 *
	 * <necessity optional />
	 *
	 * <propertyDependencies mode="anyOf">
	 *  <propertyDependency name="isGetFiles" value="true" />
	 *  <propertyDependency name="isGetDirectories" value="true" />
	 * </propertyDependencies>
	 */
	inclusions?: Array<string>

	/**
	 * 筛选文件扩展名的数组
	 *
	 * 如果 ${inclusions} 和 ${extnames} 都为非空数组, 则形成类似矩阵的条件.
	 *
	 * <necessity optional />
	 *
	 * <propertyDependency name="isGetFiles" value="true" />
	 */
	extnames?: Array<string>

	/**
	 * whether to get absolute path
	 *
	 * <necessity optional />
	 *
	 * <if value="true">
	 * 	these returned files or directories or both is the absolute path not these names
	 * </if>
	 *
	 * <propertyDependencies mode="anyOf">
	 *  <condition value="true" />
	 *  <propertyDependency name="isGetFiles" value="true" />
	 *  <propertyDependency name="isGetDirectories" value="true" />
	 * </propertyDependencies>
	 *
	 * <design>
	 * 	absolute path is better for CLI program arguments
	 * </design>
	 */
	isGetAbsolutePath?: boolean
}

/**
 * <functionalReturnValueType function="filterFilesAndDirectories" />
 *
 * <design>
 * 	已经区分出了文件与文件夹, 就不用再次 IO 判断是否文件夹了, 提升性能
 * </design>
 */
export type FilterFilesAndDirectoriesReturnValue = {

	/**
	 * 文件名数组
	 */
	files: Array<string>

	/**
	 * 文件夹名数组
	 */
	directories: Array<string>
}

/**
 * 筛选一个目录下的文件/文件夹
 *
 * 虽然函数冗长了些, 但功能强些.
 * 同一个函数里筛选出文件和文件夹, 不单独筛选文件或文件夹, 减少 IO 操作.
 *
 * 取名:
 * 为什么名为 filterFilesAndDirectories, 而不是 searchFilesAndDirectories?
 * 习惯上, 在 Windows 资源管理器里搜索, 都是检索的完成文件名或目录名, 不能同时检索 无扩展名的文件名 和 文件扩展名
 *
 * [lyne] 有必要要使用函数嵌套定义, 否则显得代码冗长冗余. 创建函数对象虽然耗能, 对于 JS 额外的解析也耗能吧
 *
 * @param {string} dir
 * @param {boolean | undefined} isGetFiles
 * @param {boolean | undefined} isGetDirectories
 * @param {Array<string> | undefined} inclusions
 * @param {Array<string> | undefined} extnames
 * @param {boolean | undefined} isGetAbsolutePath
 * @return {Promise<FilterFilesAndDirectoriesReturnValue>}
 */
export async function filterFilesAndDirectories ({
	dir,
	isGetFiles = true,
	isGetDirectories = true,
	inclusions,
	extnames,
	isGetAbsolutePath = false
}: FilterFilesAndDirectoriesParameter): Promise<FilterFilesAndDirectoriesReturnValue> {

	let returnValue: FilterFilesAndDirectoriesReturnValue = {
		files: [],
		directories: []
	}

	let isExistent = await isExist(dir)

	if (!isExistent) {
		return returnValue
	}
	let files: Array<string> = await fsPromises.readdir(dir)
	// 文件夹名数组
	let fileArray: typeof files = []

	let folderArray: typeof files = []

	let hasInclusionsArg = isNonEmptyArray(inclusions)
	let hasExtnamesArg = isNonEmptyArray(extnames)

	async function getAllFiles () {
		for await (const file of files) {
			let stat = await fsPromises.stat(path.resolve(dir, file))
			if (stat.isFile()) {
				fileArray.push(file)
			}
		}
	}

	async function filterFileNames () {
		fileArray.forEach((fullName) => {
			if (Array.isArray(inclusions) && filenameContainsOf(fullName, inclusions)) {
				returnValue.files.push(fullName)
			}
		})
	}

	async function filterExtames () {
		fileArray.forEach((fullName) => {
			if (Array.isArray(extnames) && extnameOf(fullName, extnames)) {
				returnValue.files.push(fullName)
			}
		})
	}

	async function filterFileNamesAndExtames () {
		fileArray.forEach((fullName) => {
			if (Array.isArray(inclusions) && Array.isArray(extnames) && filenameContainsOf(fullName, inclusions) && extnameOf(fullName, extnames)) {
				returnValue.files.push(fullName)
			}
		})
	}

	async function getAllDirectories () {
		for await (const file of files) {
			let stat = await fsPromises.stat(path.resolve(dir, file))
			if (stat.isDirectory()) {
				folderArray.push(file)
			}
		}
	}

	async function filterDirectoryNames () {
		folderArray.forEach((dirName) => {
			if (Array.isArray(inclusions) && isContainsOf(dirName, inclusions)) {
				returnValue.directories.push(dirName)
			}
		})
	}

	// 1. 仅获取文件
	if (isGetFiles && !isGetDirectories) {
		// 获取文件们
		await getAllFiles()

		if (fileArray.length === 0) {
			return Promise.resolve(returnValue)
		}
		// 仅有文件名筛选
		if (hasInclusionsArg && !hasExtnamesArg) {
			await filterFileNames()
		}
		// 仅有扩展名筛选
		else if (!hasInclusionsArg && hasExtnamesArg) {
			await filterExtames()
		}
		// 筛选扩展名和文件名
		else if (hasInclusionsArg && hasExtnamesArg) {
			await filterFileNamesAndExtames()
		}
		// 无筛选
		else {
			returnValue.files = fileArray
		}
	}

	// 2. 仅获取目录
	else if (!isGetFiles && isGetDirectories) {
		// 获取目录列表
		await getAllDirectories()

		if (folderArray.length === 0) {
			return Promise.resolve(returnValue)
		}
		// 筛选文件夹名
		if (hasInclusionsArg) {
			await filterDirectoryNames()
		}
		// 不筛选
		else {
			returnValue.directories = folderArray
		}
	}

	// 3. 获取文件和目录
	else if (isGetFiles && isGetDirectories) {
		for await (const file of files) {
			let stat = await fsPromises.stat(path.resolve(dir, file))
			if (stat.isDirectory()) {
				folderArray.push(file)
			} else if (stat.isFile()) {
				fileArray.push(file)
			}
		}
		if (folderArray.length === 0 && fileArray.length === 0) {
			return Promise.resolve(returnValue)
		}
		// 筛选文件名, 文件夹名
		if (hasInclusionsArg && !hasExtnamesArg) {
			await filterFileNames()
			await filterDirectoryNames()
		}
		// 仅筛选文件的扩展名
		else if (!hasInclusionsArg && hasExtnamesArg) {
			await filterExtames()
			returnValue.directories = folderArray
		}
		// 筛选文件名和扩展名, 文件夹名,
		else if (hasInclusionsArg && hasExtnamesArg) {
			await filterFileNamesAndExtames()
			await filterDirectoryNames()
		}
		// 不筛选
		else {
			returnValue.files = fileArray
			returnValue.directories = folderArray
		}
	}
	if (isGetAbsolutePath) {
		returnValue.files = returnValue.files.map((subfileName) => path.resolve(dir, subfileName))
		returnValue.directories = returnValue.directories.map((subdirName) => path.resolve(dir, subdirName))
	}
	return returnValue
}

/*
[lyne]
一个函数, 使用不同的参数可以实现不同的功能, 则可以把这些常用功能写成函数

filterFilesAndDirectories(), filterFiles(), filterDirectories() 就是三个常用的功能
它们对应着参数的属性 isGetFiles, isGetDirectories 的可能值集

*/

/**
 * <functionalParameterType function="filterFiles" />
 */
export type FilterFilesParameter = Omit<FilterFilesAndDirectoriesParameter, 'isGetFiles' | 'isGetDirectories'>

/**
 * filter files
 *
 * @param {FilterFilesParameter} argObj
 * @return {Promise<Array<string>>}
 */
export async function filterFiles (argObj: FilterFilesParameter): Promise<Array<string>> {
	return filterFilesAndDirectories(Object.assign(argObj, {
		isGetFiles: true,
		isGetDirectories: false
	})).then((filesDirsObj) => {
		return filesDirsObj.files
	})
}

/**
 * <functionalParameterType function="filterDirectories" />
 */
export type FilterDirectoriesParameter = Omit<FilterFilesAndDirectoriesParameter, 'isGetFiles' | 'isGetDirectories' | 'extnames'>

/**
 * filter directories
 *
 * @return {Promise<<Array<string>>}
 * @param argObj
 */
export async function filterDirectories (argObj: FilterDirectoriesParameter): Promise<Array<string>> {
	return filterFilesAndDirectories(Object.assign(argObj, {
		isGetFiles: false,
		isGetDirectories: true
	})).then((filesDirsObj) => {
		return filesDirsObj.directories
	})
}

/**
 * 仅返回子文件们, 不返回子目录
 * @param {string} dirPath
* @param {boolean | undefined} isGetAbsolutePath
 * @return {Promise<Array<string>>}
 */
export async function getSubfiles (dirPath: string, isGetAbsolutePath: boolean = false): Promise<Array<string>> {
	return filterFiles({dir: dirPath, isGetAbsolutePath})
}

/**
 * 仅返回子目录
 * @param {string} dirPath
 * @param {boolean | undefined} isGetAbsolutePath
 * @return {Promise<Array<string>>}
 */
export async function getSubdirectories (dirPath: string, isGetAbsolutePath: boolean = false): Promise<Array<string>> {
	return filterDirectories({dir: dirPath, isGetAbsolutePath})
}

/**
 *
 *
 * [lyne]
 *  败作: 原本打算实现复杂的业务, 可是发现太难维护了
 *  正解: 不要设计过于复杂的函数, 如果业务复杂, 应写成多个函数分别处理
 */

/**
 * 读取一层目录
 * [lyne] 由于变量名问题, 可在变量名添加后缀以区分. 如 dirArg 可标识这是来自参数的 dirArg, 而不是函数内部新建的.
 */
export async function readDirectoryOneHierarchy (dirArg: string): Promise<Directory> {
	// 读取到的文件列表, 包含文件名/文件夹名
	let files: Array<string> = await fsPromises.readdir(dirArg)

	// 文件名数组
	let folderArray: typeof files = []
	// 文件夹名数组
	let fileArray: typeof files = []

	// 遍历以分出文件夹与文件
	for await (const file of files) {
		let stat = await fsPromises.stat(path.resolve(dirArg, file))
		if (stat.isFile()) {
			fileArray.push(file)
		} else if (stat.isDirectory()) {
			folderArray.push(file)
		}
	}

	let directoryReturned: Directory = {
		path: dirArg,
		directoryMap: new Map<string, Directory>(),
		files: []
	}

	// 设置 {返回的 Directory 对象} 的 {files 属性}
	directoryReturned.files = fileArray

	// 设置 {返回的 Directory 对象} 的 {directoryMap 属性}
	if (folderArray.length > 0) {
		directoryReturned.directoryMap = new Map<string, Directory>()
		for await (const folder of folderArray) {
			directoryReturned.directoryMap.set(folder, {
				path: path.resolve(dirArg, folder),
				directoryMap: new Map<string, Directory>(),
				files: []
			})
		}
	}
	return Promise.resolve(directoryReturned)
}

/**
 * TODO
 * 获取一个目录下的文件/文件夹列表, 遍历
 * @param {string} dirArg
 * @return {Promise<Directory>}
 */

/*export async function readDirectoryRecursively (dirArg: string): Promise<Directory> {

	let ancestorDirectory = readDirectoryOneHierarchy(dirArg)


}*/

/**
 * <functionalParameterType function="reserveSmallerFile" />
 */
export type ReserveSmallerFileParameter = {

	/**
	 * 原文件目录
	 * 保留小文件目录
	 *
	 * <design>
	 *     为什么不命名为 sourceDir?
	 *     只需知道保留小文件的目录, reservedDir 更具功能描述性
	 * </design>
	 */
	reservedDir: string

	/**
	 * 被比较的目录
	 */
	comparedDir: string

	/**
	 * 是否比较扩展名
	 *
	 * <necessity optional />
	 *
	 * <warning>
	 *     <condition value="true" />
	 *     <description>
	 *          如果保留目录或比较的目录存在几个文件同一个文件名, 但不同扩展名时, 暂时不处理这种情况.
	 *          以后可能考虑使用 Map 映射, 暂时没有这种需求
	 *     </description>
	 * </warning>
	 */
	isSameExtname?: boolean
}

/**
 * 比较两个文件夹内的同名文件的大小, 默认会比较文件扩展名, 会删除目标文件夹相应较大的文件, 并将文件较小的复制到目标文件夹.
 *
 * 只比较文件, 不处理文件夹
 *
 * 前置: 源文件夹, 目标文件夹都不含有子文件夹
 * 目的: 如为了降低某个资源的图库大小, 会转换图片格式, 但转换后有的图片可能更大.
 * TODO 暂不支持遍历, 暂时没有这种需求
 * @param {string} sourceDir
 * @param {string} targetDir
 * @param {boolean} isSameExtname 是否比较扩展名
 */
export async function reserveSmallerFile ({ reservedDir, comparedDir, isSameExtname = true }: ReserveSmallerFileParameter): Promise<void> {


	/*
	<design>
	为何命名为 sourceFileArray, 而非 reservedFileArray?
	避免歧义, 尚未知原文件的是否大于被比较的文件
	</design>
	*/
	// 使用 getSubfiles(), 只比较文件, 不处理文件夹
	const sourceFileArray = await getSubfiles(reservedDir)
	const comparedFileSet = new Set(await getSubfiles(comparedDir))

	async function handleLocal (sourceFilePath: string, comparedFilePath: string, fileName: string) {
		const sourceFileSize = await fsPromises.stat(sourceFilePath).then((stats) => {
			return stats.size
		})
		const comparedFileSize = await fsPromises.stat(comparedFilePath).then((stats) => {
			return stats.size
		})

		if (sourceFileSize > comparedFileSize) {
			await fsPromises.unlink(sourceFilePath)
			fsPromises.copyFile(comparedFilePath, sourceFilePath)
			console.info(`[Info]`, `Copy smaller file "${fileName}"  to reserved directory!`)
		}
	}

	// 若比较扩展名
	if (isSameExtname) {
		for await (const sourceFile of sourceFileArray) {
			if (comparedFileSet.has(sourceFile)) {
				const sourceFilePath = path.resolve(reservedDir, sourceFile)
				const comparedFilePath  = path.resolve(comparedDir, sourceFile)

				await handleLocal(sourceFilePath, comparedFilePath, sourceFile)
			}
		}

	} else {
		// 存在几个文件同一个文件名, 但不同扩展名
		let sourceFileNameExtnameMap: Map<string, Array<string>> = new Map<string, Array<string>>()
		let comparedFileNameExtnameMap: Map<string, Array<string>> = new Map<string, Array<string>>()

		async function initMapLocal (map: Map<string, Array<string>>, iterable: Iterable<any>) {
			for await (const file of iterable ) {
				const fileName = getFileName(file)
				const extname = path.extname(file)
				if (map.has(fileName)) {
					// @ts-ignore
					map.get(fileName).push(extname)
				} else {
					map.set(fileName, [extname])
				}
			}
		}
		// 似乎没有必要?
		await Promise.all([initMapLocal(sourceFileNameExtnameMap, sourceFileArray), initMapLocal(comparedFileNameExtnameMap, comparedFileSet)])

		for await (const sourceFileName of sourceFileNameExtnameMap.keys()) {
			if (comparedFileNameExtnameMap.has(sourceFileName)) {
				const sourceFileExtnames = sourceFileNameExtnameMap.get(sourceFileName)
				const comparedFileExtnames = comparedFileNameExtnameMap.get(sourceFileName)
				// [lyne] 2020年, TypeScript 类型检测存在缺陷. @ts-ignore 可用于提高性能, 也可以使用其它 API 来保证类型安全
				// @ts-ignore
				if (sourceFileExtnames.length === 1 && comparedFileExtnames === 1) {
					// @ts-ignore
					for await (const extname of extnames) {
						const sourceFile = sourceFileName + extname
						const sourceFilePath = path.resolve(reservedDir, sourceFile)
						const comparedFilePath  = path.resolve(comparedDir, sourceFile)

						await handleLocal(sourceFilePath, comparedFilePath, sourceFile)
					}
				}


			}
		}

	}



}

/**
 * writeArrayToFile() 的参数类型
 */
export type WriteArrayToFileParameter = {
	/**
	 * [required]
	 * 文件路径
	 *
	 * 不存在自动新建文件
	 * 存在则采用 Node 的默认措施--覆盖
	 */
	filePath: string
	/**
	 * [required]
	 * 要写入到文件的数组
	 *
	 * 其元素可为任意类型, 自动调用元素的 toString() 转为字符串
	 */
	array: Array<any>
	/**
	 * [optional]
	 * 如果文件存在, 是否备份原文件
	 */
	isBackup?: boolean
	/**
	 * [optional]
	 * 分割符
	 */
	separateString?: string
	/**
	 * [optional]
	 * 是否写入空位元素
	 *
	 * 如果 [param] separateString 不为空(比如 separateString 为换行符), 此时若 [parameter] isWriteEmptyElement 为 true, 则会留下空行
	 */
	isWriteEmptyElement?: boolean
	/**
	 * [optional]
	 * 写入完成时的 callback
	 */
	onFinish?: () => void
}

/**
 * 把 array 写到文件
 * @param {string} filePath
 * @param {Array<any>} array
 * @param {boolean | undefined} isBackup
 * @param {string | undefined} separateString
 * @param {boolean | undefined} isWriteEmptyElement
 * @param {(() => void) | undefined} onFinish
 * @return {Promise<void>}
 */
export async function writeArrayToFile ({
	filePath,
	array,
	/* 默认备份 */
	isBackup = true,
	/* 默认分隔符为 Windows 换行符 */
	separateString = '\r\n',
	/* 默认不写入空位元素 */
	isWriteEmptyElement = false,
	onFinish
}: WriteArrayToFileParameter): Promise<void> {

	if (isBackup) {
		let backupName = await renameForBackup(filePath)
		console.log('[Info] Backup file:', path.basename(backupName))
		// let backupName = await renameForBackup(filePath)
		// 备份文件很多时, 确实难看. console.log('[Info] Backup file:', path.basename(backupName))
	}

	const stringArray: Array<string> = array.map((element) => element.toString())
	let str: string
	if (isWriteEmptyElement) {
		// 比如 separateString 为换行符, 末尾加个换行符换行
		str = stringArray.join(separateString) + separateString
	} else {
		str = joinNoEmpty(stringArray, separateString) + separateString
	}
	await safenPath(filePath)
	return new Promise((resolve) => {
		let writeStream = fs.createWriteStream(filePath)
		writeStream.end(str)
		writeStream.on('error', (err) => {
			console.log(err)
		})
		if (typeof onFinish === 'function') {
			writeStream.on('finish', () => {
				// 注意: 应在 writeStream.on('finish', callback) 中 callback 里执行 onFinish() 和 resolve()
				onFinish()
				resolve()
			})
		} else {
			writeStream.on('finish', () => {
				resolve()
			})
		}
	})
}

