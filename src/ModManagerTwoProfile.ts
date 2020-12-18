import path from 'path'
import ModManagerTwo from './ModManagerTwo'

import Skyrim from './Skyrim'
import { removeStringArrayDuplication } from './util/ArrayUtil'
import { filterFiles, isExist, writeArrayToFile } from './util/FSUtil'
import { readlineToArray } from './util/ReadlineUtil'
import { arrayToSet } from './util/SetUtil'
/*

type ArrayLikeInterface<T> = {
  [key: number]: T
  length: number
}

class ArrayLike<T>: ArrayLikeInterface = {
	
  length: 0
	
	add (arg: T) {
		this[this.length] = arg
	}
}
 */

export type InitParameter = {
	/**
	 *
	 */
	modDirectory: string
	/**
	 * 用于获得已启用的 mod 们 和  plugin 们
	 */
	profileDirectory: string

	/**
	 * 已按名称排序的且存在的全部 mods
	 *
	 * 即便不排序 mods, 也需要该数组检测 mods 的存在性.
	 * 如果不传递, 则调用 ModManagerTwo.generateAllModsSorted(this.modDirectory) 获取.
	 *
	 * 排序多个 profiles 时, 推荐在 ModManagerTwo instance 里传递过来, 用于多 profiles 共享, 减少 IO 次数
	 *
	 * <necessity optional />
	 */
	allModsSorted?: Array<string>
}

export type SortParameter = {

	/**
	 * determine whether to backup files
	 *
	 * <necessity optional />
	 */
	isBackup?:boolean

	/**
	 * determine whether to sort mods by name
	 *
	 * <necessity optional />
	 */
	isSortModsByName?: boolean

	/**
	 * determine whether to sort plugins
	 *
	 * Sort plugins by those mods' priority.
	 * A mod's priority determines is's plugins load order.
	 *
	 * <necessity optional />
	 */
	isSortPlugins?: boolean

	/**
	 * callback after finishing
	 *
	 * @param {string} profileDirectory
	 *
	 * <necessity optional />
	 */
	onFinish?: (profileDirectory: string) => void
}

/**
 * MO2 与 MO1 处理方式有些不同.
 *
 * plugins.txt
 *  未激活的 plugin 开头没有 *, plugins.txt
 *  没有那五个 vanilla ESM, 因为 MO2 强制启用五个官方 esm
 * ```text
 * # This file was automatically generated by Mod Organizer.
 * Unofficial Skyrim Special Edition Patch.esp
 * *Skyrim Project Optimization - No Homes - Full Version.esm
 * ```
 *
 *
 * loadorder.txt
 * 包含那五个 vanilla ESM, 不存储是否勾选
 *
 *
 * modlist.txt
 * 有三个官方 DLC mod, 这三个都以 * 开头
 */

/**
 * 类 ModManagerTwoProfile
 *
 *  表示一个具体的 profile, 而非全部 profiles.
 *  全部 profiles 交由 ModManagerTwo instance 控制.
 */
export default class ModManagerTwoProfile {

	/**
	 * MO profile 内文本文件的首行一般是这个
	 * @type {string}
	 */
	static fileTip = `# This file was automatically generated by Mod Organizer.`

	/**
	 * fileTip 所占行数
	 * @type {number}
	 */
	static fileTipLineCount = 1

	/**
	 * loadorder.txt 第一行是提示, 之后五行是五个官方 esm
	 * @type {number}
	 */
	static vanillaEsmCount = 5

	/**
	 * MO2 定义的三个官方 mod
	 * 倒序排好了, modlist.txt 直接添加到文件最末尾即可
	 *
	 * MO2 里可以手动改变其优先级
	 * @type {string[]}
	 */
	static vanillaDlcModsReversed: Array<string> = [
		`*DLC: Dragonborn`,
		`*DLC: HearthFires`,
		`*DLC: Dawnguard`
	]
	/**
	 * MO2 里是不能手动改变这五个 ESM 的排序的
	 * @type {string[]}
	 */
	static vanillaEsmLoadorders: Array<string> = [
		'Skyrim.esm',
		'Update.esm',
		'Dawnguard.esm',
		'HearthFires.esm',
		'Dragonborn.esm'
	]

	static pluginsFileMame = 'plugins.txt'
	static loadorderFileName = 'loadorder.txt'
	static modlistFileName = 'modlist.txt'


	/**
	 * mod 目录
	 * 绝对路径
	 *
	 * @type {string}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[InitParameter]"/>
	 * </dependencies>
	 */
	modDirectory: string = ``

	/**
	 * 当前 profile 目录
	 * 绝对路径
	 *
	 * @type {string}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[InitParameter]"/>
	 * </dependencies>
	 */
	profileDirectory: string = ``

	/**
	 * mod 目录的 mod 名数组, 按当前 locale 文件名升序
	 *
	 * @type {string}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[InitParameter]"/>
	 * </dependencies>
	 */
	allModsSorted: Array<string> = []


	/**
	 * 存在与 mod 目录下, 并且启用的第三方 mod 的集合
	 *
	 * 因为初始化 mod 相关的, plugin 相关的属性都会用到.
	 * 但可能无须初始化 plugins 相关的, 所以不写成 initModsRelativeProperty() 的局部变量, 而是提取出来写成单独一个属性.
	 *
	 * @type {Set<string>}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[InitParameter]"/>
	 * </dependencies>
	 */
	enabledThirdPartyModSet: Set<string> = new Set<string>()

	/**
	 * 启用的 mods
	 * 	从 modlist.txt 读取的, 且 mod directory 存在的
	 * 	虽然 modlist.txt 里的 mods 排序是倒序的, 但初始化该属性时, 给搬正了
	 * @type {string[]}
	 */
	enabledThirdPartyModsOrdered: Array<string> = []


	/**
	 * 第三方 plugin 数组, 且跟据 enabledSortedThirdPartyMods 排序的
	 * @type {string[]}
	 */
	thirdPartyPluginsSorted: Array<string> = []


	/**
	 * 第三方 plugin 们中的, 且已经启用
	 * @type {Set<string>}
	 */
	enabledThirdPartyPluginsSet: Set<string> = new Set<string>()

	/**
	 * 如果不排序 plugin 的话, 不必初始化某些资源, 不必执行某些操作
	 *
	 * 默认排序插件
	 *
	 * @type {boolean}
	 */
	isSortPlugins = true

	/**
	 * 是否按照 mods 名排序 mods
	 *
	 * 默认不排序
	 *
	 * @type {boolean}
	 */
	isSortModsByName = false

	/**
	 * If don't exist modlist.txt, should not backup it
	 * @type {boolean}
	 */
	hasModlistFile = true

	/**
	 * If don't have plugins.txt, should not backup it
	 * @type {boolean}
	 */
	hasPluginsFile = true


	/**
	 * If don't have loadorder.txt, should not backup it
	 * @type {boolean}
	 */
	hasLoadorderFile = true



	/**
	 * constructor 无法用 async 修饰
	 *
	 * 初始化一些 modlist.txt, plugins.txt 相关的属性, loadorder.txt 基于 plugins.txt, 不用单独初始化
	 * @param {string} modDirectory
	 * @param {string} profileDirectory
	 * @param allModsSorted
	 * @param isSortPlugins
	 * @return {Promise<void>}
	 */
	async init ({
		modDirectory,
		profileDirectory,
		allModsSorted
	}: InitParameter): Promise<void> {
		this.modDirectory = modDirectory
		this.profileDirectory = profileDirectory
		console.info(`[Info]`, `Handle profile directory: ${this.profileDirectory}`)

		if (Array.isArray(allModsSorted)) {
			this.allModsSorted = allModsSorted
		} else {
			this.allModsSorted = await ModManagerTwo.generateAllModsSorted(this.modDirectory)
		}
	}


	/**
	 * 排序 plugins.txt
	 *
	 * @param {boolean} isBackup 是否备份原文件
	 * @return {Promise<void>}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[InitParameter]"/>
	 * </dependencies>
	 */
	async sortPlugins (isBackup: boolean = true): Promise<void> {
		const pluginsFilePath = path.resolve(this.profileDirectory, ModManagerTwoProfile.pluginsFileMame)
		let pluginsFileLines = [ModManagerTwoProfile.fileTip]

		for await (const plugin of this.thirdPartyPluginsSorted) {
			if (this.enabledThirdPartyPluginsSet.has(plugin)) {
				pluginsFileLines.push('*' + plugin)
			} else {
				pluginsFileLines.push(plugin)
			}
		}
		if (!this.hasPluginsFile) {
			isBackup = false
		}
		return writeArrayToFile({
			filePath: pluginsFilePath,
			array: pluginsFileLines,
			isBackup,
			onFinish: () => {
				console.log('[Info]', `This ${ModManagerTwoProfile.pluginsFileMame} has been sorted!`)
			}
		})
	}


	/**
	 * 排序 loadorder.txt
	 *
	 * @param {boolean} isBackup 是否备份原文件
	 * @return {Promise<void>}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[InitParameter]"/>
	 * </dependencies>
	 */
	async sortLoadorder (isBackup: boolean = true): Promise<void> {
		const loadorderFilePath = path.resolve(this.profileDirectory, ModManagerTwoProfile.loadorderFileName)
		if (!await isExist(loadorderFilePath)) {
			console.log('[Warning] Could not found the plugin.txt!')
			this.hasLoadorderFile = false
			isBackup = false
		}

		let loadorderFileLines = [ModManagerTwoProfile.fileTip, ...ModManagerTwoProfile.vanillaEsmLoadorders]
		loadorderFileLines = loadorderFileLines.concat(this.thirdPartyPluginsSorted)
		return writeArrayToFile({
			filePath: loadorderFilePath,
			array: loadorderFileLines,
			isBackup,
			onFinish: () => {
				console.log('[Info]', `This ${ModManagerTwoProfile.loadorderFileName} has been sorted!`)
			}
		})
	}


	/**
	 * 排序 modlist.txt
	 *
	 * @param {boolean} isBackup 是否备份原文件
	 * @return {Promise<void>}
	 *
	 * 注意: modlist.txt 里的 mod 排序是 MO2 里 mod 优先级的倒序
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[InitParameter]"/>
	 * </dependencies>
	 */
	async sortModlist (isBackup: boolean = true): Promise<void> {
		const modlistFilePath = path.resolve(this.profileDirectory, ModManagerTwoProfile.modlistFileName)
		let modlistFileLines: Array<string> = [ModManagerTwoProfile.fileTip]

		// 倒序遍历全部 mods, modlist.txt 里的 mods 是倒序的
		for (let i = this.allModsSorted.length - 1; i >= 0; i--) {
			const modName = this.allModsSorted[i]
			if (this.enabledThirdPartyModSet.has(modName)) {
				modlistFileLines.push('+' + modName)
			} else {
				modlistFileLines.push('-' + modName)
			}
		}
		// MO 的 modlist.txt 是倒序的, ModManagerTwoProfile.vanillaDlcModsReversed 放在最后面
		modlistFileLines.push(...ModManagerTwoProfile.vanillaDlcModsReversed)

		if (!this.hasModlistFile) {
			isBackup = false
		}
		return writeArrayToFile({
			filePath: modlistFilePath,
			array: modlistFileLines,
			isBackup,
			onFinish: () => {
				console.log('[Info]', `This ${ModManagerTwoProfile.modlistFileName} has been sorted!`)
			}
		})

	}


	/**
	 * 排序 profile
	 *
	 * @param {boolean | undefined} isBackup 是否备份原文件
	 * @param {boolean | undefined} isSortModsByName 是否按照 mods 名排序 mods
	 * @param {boolean | undefined} isSortPlugins 是否按照 mods 优先级排序 plugins
	 * @param {((profileDirectory: string) => void) | undefined} onFinish
	 * @return {Promise<void>}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[InitParameter]"/>
	 * </dependencies>
	 */
	async sort ({
		isBackup = true,
		isSortModsByName = false,
		isSortPlugins = true,
		onFinish
	}: SortParameter) {

		// 不管是否排序 mods, 都需要初始化 mods 相关的属性, 即运行 initModsRelativeProperty()
		await this.initModsRelativeProperty()

		if (isSortModsByName){
			console.info(`[Info]`, `Sort mods by name!`)
		}
		if (isSortPlugins) {
			console.info(`[Info]`, `Sort plugins by mods' priorities!`)
			await this.initPluginsRelativeProperty(isSortModsByName)
		}

		let promiseArray: Array<Promise<void>> = []
		if (isSortModsByName) {
			promiseArray.push(this.sortModlist(isBackup))
		}
		if (isSortPlugins) {
			promiseArray.push(this.sortPlugins(isBackup))
			promiseArray.push(this.sortLoadorder(isBackup))
		}
		await Promise.all(promiseArray)

		if (typeof onFinish === 'function') {
			onFinish(this.profileDirectory)
		}

	}

	/**
	 * 初始化 plugin 相关属性
	 *
	 * @param {boolean | undefined} isSortsModsByName 是否排序 mods
	 * @return {Promise<void>}
	 *
	 * <dependencies>
	 *    <method name="initModsRelativeProperty" >
	 *      需要先初始化 mod 相关的属性, 即 initModsRelativeProperty() 执行过后
	 *    </method>
	 * </dependencies>
	 */
	private async initPluginsRelativeProperty (isSortsModsByName: boolean = false) {
		let pluginsOfEnableMods: Array<string> = []
		// 如果排序 mods(按名称), 则对启用的 mods 按名称排序
		if (isSortsModsByName) {
			this.enabledThirdPartyModsOrdered.sort((a, b) => a.localeCompare(b))
		}
		for await (const modName of this.enabledThirdPartyModsOrdered) {
			const plugins = (await filterFiles({
				dir: path.resolve(this.modDirectory, modName),
				extnames: Skyrim.pluginExtnames
			}))
			pluginsOfEnableMods.push(...plugins)
		}
		// 去除重复, 保留最后位置, 大小写不敏感
		this.thirdPartyPluginsSorted = removeStringArrayDuplication(pluginsOfEnableMods, 'last', false)
		const pluginsFilePath = path.join(this.profileDirectory, ModManagerTwoProfile.pluginsFileMame)


		// 不存在 plugin.txt 则判断为没有启用的第三方 plugin
		if (!await isExist(pluginsFilePath)) {
			console.log('[Warning] Could not found the plugin.txt!')
			this.hasPluginsFile = false
		}
		// 存在 plugins.txt
		else {
			const pluginLines = await readlineToArray(pluginsFilePath)
			// 若有第三方 plugin
			if (pluginLines.length > ModManagerTwoProfile.fileTipLineCount) {
				for (let i = ModManagerTwoProfile.fileTipLineCount; i < pluginLines.length; i++) {
					const pluginLine = pluginLines[i]
					if (pluginLine.startsWith('*')) {
						// 启用的 plugins 最开头是 "*", 应去掉 "*"
						const pluginName = pluginLine.substring(1)
						this.enabledThirdPartyPluginsSet.add(pluginName)
					}
				}
			}
		}
	}


	/**
	 * 初始化 mods 相关的属相
	 *
	 * init() 里会调用此反方, 在调用之前先得到或执行依赖项
	 *
	 * @return {Promise<void>}
	 *
	 * <dependencies>
	 *    <property name="profileDirectory" />
	 *    <property name="allModsSorted" />
	 * </dependencies>
	 *
	 */
	private async initModsRelativeProperty () {

		const modlistFilePath = path.resolve(this.profileDirectory, ModManagerTwoProfile.modlistFileName)

		// 不存在 modlist.txt 则判断为 没有启用的 第三方 mod
		if (!await isExist(modlistFilePath)) {
			console.log('[Warning] Could not found the modlist.txt!')
			this.hasModlistFile = false
		}
		// 存在 modlist.txt
		else {
			const modsInModlistFile = await readlineToArray(modlistFilePath)
			// 可能存在启用的第三方 mod 们
			if (modsInModlistFile.length > ModManagerTwoProfile.fileTipLineCount) {
				const allModsSortedSet = arrayToSet(this.allModsSorted)
				// modlist.txt 里的是 mod 倒序的, 这里倒序遍历, 得到就是正序的
				// [lyne] for 倒序遍历, 初始值: i = array.length -1, 循环继续: i >= 最小值, 每次遍历: i--. 别粗心漏掉了, 3个步骤
				for (let i = modsInModlistFile.length - 1; i >= ModManagerTwoProfile.fileTipLineCount; i--) {
					const modInModlist = modsInModlistFile[i]
					const modName = modInModlist.substring(1)
					// [warning] modsInModlisFile 可能存在已经删除的但却启用的 mod, 所以其与 modDirectory 的 mod 列表可能不同.
					// 如果 mod 启用, 且 存在于 mod directory
					if (modInModlist.startsWith('+') && allModsSortedSet.has(modName)) {
						this.enabledThirdPartyModsOrdered.push(modName)
						// 用于之后写 modlist.txt 时检索启用的
						this.enabledThirdPartyModSet.add(modName)
					}
				}
			}
		}

	}
}