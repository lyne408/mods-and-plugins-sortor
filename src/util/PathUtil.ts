import path from 'path'
import fs from 'fs'
const fsPromises = fs.promises
import { isNonEmptyArray } from './ArrayUtil'
import { isExist } from './FSUtil'
import { replaceStringsByMap, isNonEmptyString, hasSubstrings, containsOf } from './StringUtil'

/**
 * 获取不包含扩展名的文件名
 * @param fileUrlOrName 文件路径/文件名
 *

 [warning] 不应该用于处理文件夹

 设 D:\\Cache\\123.bat_dir_bak 是一个文件夹
 则 console.log(getFileName('D:\\Cache\\123.bat_dir_bak')) 输出 123, 显然不是输出文件夹名
 */
export function getFileNameWithoutExtension (fileUrlOrName: string): string {
	return path.basename(fileUrlOrName, path.extname(fileUrlOrName))
}

/**
 * [lyne] file name meaning solution
 *
 * - 不使用 filename 变量, 而是 fileName
 * 		OOP 里 file 应是一个实例, 实例的标识名字
 * 		filename 与 directoryName 不匹配
 *
 * 	- fileName 意为不包含扩展名的文件名
 *
 * 	- fullFileName 意为完整的文件名, 即包含扩展名的文件名
 *
 * @type {(fileUrlOrName: string) => string}
 *
 * <recommendName />
 */
export const getFileName = getFileNameWithoutExtension
/**
 * 获取包含扩展名的文件名
 * @param fileUrl 文件路径
 */
export function getFileNameWithExtension (fileUrl: string): string {
	return path.basename(fileUrl)
}

/**
 * <recommendName />
 * @type {(fileUrl: string) => string}
 */
export const getFullFileName = getFileNameWithExtension

/**
 * 获取文件或文件夹所在的文件夹名
 * @param fsPath path
 */
export function getParentFolderName (fsPath: string): string {

	let dirname = path.dirname(fsPath)
	let folderArray = dirname.split(path.sep)
	return folderArray[folderArray.length - 1]
}

/**
 *
 * @type {(fsPath: string) => string}
 */
export const getParentDirectoryName = getParentFolderName

/**
 * 文件/目录路径的 parent 都是目录
 * @type {(fsPath: string) => string}
 *
 * <recommendName />
 */
export const getParentName = getParentFolderName

/**
 *
 * console.log(getFileName('D:\\Cache\\123.bat_dir_bak')) 输出 123.bat_dir_bak
 * @param {string} dirname 文件目录
 * @return {string}
 */
export function getFolderName (dirname: string): string {
	let folderArray = dirname.split(path.sep)
	return folderArray[folderArray.length - 1]
}

/**
 * <recommendName />
 * @type {(dirname: string) => string}
 */
export const getDirectoryName = getFolderName
/**
 * export path.extname
 * [Lyne] 可以这样直接重导出, 但没有任何封装的, 也不是为了可读性和维护性的, 确实没必要
 */

export const extname = path.extname

/**
 *
 * @param {string} fullFilename
 * @param {Array<string>} inclusions
 * @param {boolean} isCaseSensitive
 * @return {boolean}
 */
export function filenameHas (fullFilename: string, inclusions: Array<string>, isCaseSensitive: boolean = false): boolean {
	if (!isNonEmptyString(fullFilename) || !isNonEmptyArray(inclusions)) {
		return false
	}
	let fileName = getFileName(fullFilename)

	return hasSubstrings({
		string: fileName,
		inclusions,
		isCaseSensitive
	})
}

/**
 *
 * @param {string} fullFilename
 * @param {Array<string>} inclusions
 * @param {boolean} isCaseSensitive 默认 false, 因 Windows 路径忽略大小写
 * @return {boolean}
 */
export function fileNameContainsOf (fullFilename: string, inclusions: Array<string>, isCaseSensitive: boolean = false): boolean {
	if (!isNonEmptyString(fullFilename) || !isNonEmptyArray(inclusions)) {
		return false
	}
	let fileName = getFileName(fullFilename)

	return containsOf({
		string: fileName,
		inclusions,
		isCaseSensitive
	})
}

/**

 * @type {(fullFilename: string, inclusions: Array<string>) => boolean}
 *
 * <recommendName language="JavaScript">
 *     因为 JavaScript 里判断字符串包含子串用 String.prototype.includes()
 * </recommendName>
 */
export const fileNameIncludesOf = fileNameContainsOf

/**
 *
 * @param {string} fullFilename
 * @param {Array<string>} inclusions
 * @param {boolean} isCaseSensitive
 * @return {boolean}
 */
export function fileNameHasSubstrings (fullFilename: string, inclusions: Array<string>, isCaseSensitive: boolean = false): boolean {
	if (!isNonEmptyString(fullFilename) || !isNonEmptyArray(inclusions)) {
		return false
	}
	let fileName = getFileName(fullFilename)

	return hasSubstrings({
		string: fileName,
		inclusions,
		isCaseSensitive
	})
}

/**
 *
 * 符合一个就返回 true
 * @param {string} fullFilename
 * @param {Array<string>} extnames
 * @param {boolean} isCaseSensitive 默认 false, 因 Windows 路径忽略大小写
 * @return {boolean}
 */
export function extnameOf (fullFilename: string, extnames: Array<string>, isCaseSensitive: boolean = false): boolean {
	if (!isNonEmptyString(fullFilename) || !isNonEmptyArray(extnames)) {
		return false
	}
	let fileExtname = path.extname(fullFilename)
	if (isCaseSensitive) {
		for (let extname of extnames) {
			if (fileExtname === extname) {
				return true
			}
		}
	} else {
		fileExtname = fileExtname.toLowerCase()
		for (let extname of extnames) {
			extname = extname.toLowerCase()
			if (fileExtname === extname) {
				return true
			}
		}
	}
	return false
}


/**
 * 对于一个文件路径, 若 dirname 不存在, 则创建.
 *  如使用 stream 操作文件时, 要求其所在文件夹必须存在.
 *
 * @param {string} pathArg
 * @return {Promise<boolean>}
 *
 * <design>
 *     解决 path 相关的问题, 应归为 path 功能模块, 所以不放在 FSUtil 里.
 * </design>
 */
export async function safenPath (pathArg: string): Promise<void> {
	let dirname = path.dirname(pathArg)
	if (!await isExist(dirname)) {
		await fsPromises.mkdir(pathArg, {recursive: true})
	}
}


/**
 *
 * @param {string} fileName
 * @return {string}
 */
export function safenFileName (fileName: string): string {
	// 为了清除两边的空格
	fileName = fileName.trim()
	// Windows系统中文件名, 不能含有以下9种字符 ? * : " < > \ / |, 不能以空格开头
	let replaceStringMap = new Map<string, string>()
	replaceStringMap.set('?', '[QUESTION MARK]')
	replaceStringMap.set('*', '[ASTERISK]')
	replaceStringMap.set(':', '[COLON]')
	replaceStringMap.set('<', '[LEFT ANGLE BRACKET]')
	replaceStringMap.set('>', '[RIGHT ANGLE BRACKET]')
	replaceStringMap.set('"', '[QUOTE]')
	replaceStringMap.set('/', '[SLASH]')
	replaceStringMap.set('\\', '[BACKSLASH]')
	replaceStringMap.set('|', '[VERTICAL BAR]')
	return replaceStringsByMap(fileName, replaceStringMap)
}



 