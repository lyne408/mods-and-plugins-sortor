import fs from 'fs'
import ini from 'ini'
import path from 'path'
import ModManagerTwoProfile from './ModManagerTwoProfile'
import { getSubdirectories } from './util/FSUtil'
import { getMiddle } from './util/RegExpUtil'

/**
 * the only one parameter of sortProfilesByConfig()
 */
type SortProfilesByConfigParameter = {
	/**
	 * MO2 Portable installation directory
	 * <necessity required />
	 */
	moTwoInstallationDirectory: string
	/**
	 * determine whether to sort all profiles
	 *
	 * <necessity optional />
	 *
	 * <ignoreProperties>
	 *		<condition value="true" />
	 *		<property name="isOnlySortSelectedProfile" />
	 * </ignoreProperties>
	 */
	isSortAllProfiles?: boolean
	/**
	 * determine whether to only sort selected profile
	 *
	 * <necessity optional />
	 *
	 * <propertyDependencies>
	 *     <condition value="true" />
	 *     <property name="isSortAllProfiles" value="false" />
	 * </propertyDependencies>
	 *
	 */
	isOnlySortSelectedProfile?: boolean,
	/**
	 * determine whether to backup files
	 * <necessity optional />
	 */
	isBackup?:boolean
	/**
	 * determine whether to sort plugins
	 * <necessity optional />
	 */
	isSortPlugins?: boolean
}

export type ExecutionConfig = SortProfilesByConfigParameter

/**
 * sort profiles by given config object
 *
 * user-friendly
 *
 * @param {string} moTwoInstallationDirectory
 * @param {boolean | undefined} isSortAllProfiles
 * @param {boolean | undefined} isOnlySortSelectedProfile
 * @param {boolean | undefined} isBackup
 * @param {boolean | undefined} isSortPlugins
 * @return {Promise<void>}
 */
export async function sortProfilesByConfig ({
	moTwoInstallationDirectory,
	isSortAllProfiles = false,
	isOnlySortSelectedProfile = true,
	isBackup = true,
	isSortPlugins = true
}:SortProfilesByConfigParameter) {
	let mo2 = new ModManagerTwo()
	mo2.init(moTwoInstallationDirectory).then(() => {
		if (isSortAllProfiles) {
			return mo2.sortAllProfiles(isBackup, isSortPlugins)
		} else if (isOnlySortSelectedProfile) {
			return mo2.sortSelectedProfile(isBackup, isSortPlugins)
		}
	})
}
/**
 * 类 ModManager
 * 暂时只支持 Portable 模式的排序
 * 如需排序 mods 和 plugins, 应先指定 modsPath, 再指定 currentProfilePath
 */
export default class ModManagerTwo {

	static configFileName = 'ModOrganizer.ini'

	static settingsOptionName = 'Settings'
	static modDirectoryPropertyName = 'mod_directory'
	static profilesDirectoryPropertyName = 'profiles_directory'
	static generalOptionName = 'General'
	static selectedProfilePropertyName = 'selected_profile'
	/**
	 * 暂不使用
	 * @type {boolean}
	 */
	isPortableMode = true

	/**
	 * MO 2 portable 的安装目录
	 * 绝对路径
	 * @type {string}
	 *
	 * 安装目录\ModOrganizer.ini 包含许多信息
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[string]"/>
	 * </dependencies>
	 *
	 * @see  ModManagerTwo.init
	 * <see>
	 *     <method name="init" parameterQueue="[string]"/>
	 * </see>
	 */
	installationDirectory = ``

	/**
	 * nod 的存放目录
	 * 绝对路径
	 * @type {string}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[string]"/>
	 * </dependencies>
	 */
	modDirectory = ``

	/**
	 * profiles 目录
	 * 绝对路径
	 * @type {string}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[string]"/>
	 * </dependencies>
	 */
	profilesDirectory = ``


	/**
	 * 存储全部 profile 名字的数组
	 * @type {string}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[string]"/>
	 * </dependencies>
	 */
	profileNames: Array<string> = []

	/**
	 * 当前启用的(选择的) profile
	 *
	 * @type {string}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[string]"/>
	 * </dependencies>
	 */
	selectedProfileName = ``

	/**
	 * mod 目录的 mod 名数组, 按当前 locale 文件名升序
	 *
	 * 便于传给多个 ModManagerTwoProfile 实例的属性 allModsSorted, 避免让每个 ModManagerTwoProfile 实例再进行 IO 操作初始化其属性 allModsSorted
	 * @type {string[]}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[string]"/>
	 * </dependencies>
	 */
	allModsSorted: Array<string> = []


	static sortProfilesByConfig  = sortProfilesByConfig

	/**
	 * 获取 mod 目录的 mod 名数组, 按当前 locale 文件名升序
	 *
	 * MO2 应该提供这个静态方法
	 *
	 * ModManagerTwoProfile 必须要得到 mod directory, 才能获取有哪些 esp.
	 *
	 * [lyne]
	 * 取名
	 * getAllModsSorted(string)     OOP 里 getter 名, setter 名 不应被占用
	 * generateAllModsSorted(string)
	 * buildAllModsSorted(string)
	 *
	 * @param {string} modDirectory mod 目录
	 * @return {Promise<Array<string>>}
	 */
	static async generateAllModsSorted (modDirectory: string): Promise<Array<string>> {
		// 等价于使用当前 locale, 按文件名排序
		return (await getSubdirectories(modDirectory)).sort((a, b) => a.localeCompare(b))
	}

	/**
	 * 初始化一些属性
	 *
	 * 如果是 portable模式, 安装目录\ModOrganizer.ini:
	 *  ```ini
	 *  [Settings]
	 *  mod_directory=D:/TES/SE_mods
	 *  profiles_directory=D:/TES/SE_Data/profiles
	 *
	 *   [General]
	 *   selected_profile=@ByteArray(Z_ECE_CBBE_for_ASO_Pixar)
	 *  ```
	 * 可据此获取所需信息.
	 *
	 * @type {string}
	 */
	async init (installationDirectory: string) {
		this.installationDirectory = installationDirectory
		const configFilePath = path.resolve(this.installationDirectory, ModManagerTwo.configFileName)
		const ancestorNode = ini.parse(fs.readFileSync(configFilePath, 'utf-8'))

		this.modDirectory = ancestorNode[ModManagerTwo.settingsOptionName][ModManagerTwo.modDirectoryPropertyName]
		console.info(`[Info]`, `Mod directory: ${this.modDirectory}`)

		this.profilesDirectory = ancestorNode[ModManagerTwo.settingsOptionName][ModManagerTwo.profilesDirectoryPropertyName]
		console.info(`[Info]`, `Profiles directory: ${this.profilesDirectory}`)

		// selectedProfileValue 值为 @ByteArray(当前profile名)
		const selectedProfileValue = ancestorNode[ModManagerTwo.generalOptionName][ModManagerTwo.selectedProfilePropertyName]
		this.selectedProfileName = getMiddle({
			string: selectedProfileValue,
			left: '@ByteArray(',
			right: ')'
		})
		console.info(`[Info]`, `Select profile: ${this.selectedProfileName}`)

		this.allModsSorted = await ModManagerTwo.generateAllModsSorted(this.modDirectory)

		this.profileNames = await getSubdirectories(this.profilesDirectory)
	}


	/**
	 * sort selected profile
	 *
	 * @param {boolean} isBackup  whether to backup original files
	 * @param {boolean} isSortPlugins whether to sort plugins
	 * @param {() => void} onFinish callback after finishing
	 * @return {Promise<void>}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[string]"/>
	 * </dependencies>
	 */
	async sortSelectedProfile (isBackup: boolean, isSortPlugins: boolean, onFinish: () => void = () => {
		console.info(`[Info]`, `Profile [${this.selectedProfileName}] sorted!`)
	}) {
		let selectedProfile = new ModManagerTwoProfile()

		return selectedProfile.init({
			modDirectory: this.modDirectory,
			allModsSorted: this.allModsSorted,
			profileDirectory: path.resolve(this.profilesDirectory, this.selectedProfileName),
			isSortPlugins
		}).then(() => {
			selectedProfile.sort(isBackup, onFinish)
		})
	}

	/**
	 * sort all profiles
	 *
	 * @param {boolean} isBackup
	 * @param {boolean} isSortPlugins
	 * @param {() => void} onFinish
	 * @return {Promise<void>}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[string]"/>
	 * </dependencies>
	 */
	async sortAllProfiles (isBackup: boolean, isSortPlugins: boolean, onFinish: () => void = () => {
		console.info(`[Info]`, `All profiles sorted!`)
	}) {
		return Promise.all(this.profileNames.map((profileName) => {
			let profile = new ModManagerTwoProfile()
			return profile.init({
				modDirectory: this.modDirectory,
				allModsSorted: this.allModsSorted,
				profileDirectory: path.resolve(this.profilesDirectory, profileName),
				isSortPlugins
			}).then(() => {
				profile.sort(isBackup, () => {
					console.info(`[Info]`, `Profile [${profileName}] sorted!`)
				})
			})
		})).then(() => {
			if (typeof onFinish === 'function') {
				onFinish()
			}
		})

	}
}

