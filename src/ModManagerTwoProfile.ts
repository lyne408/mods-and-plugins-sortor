import fs from 'fs'
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
	allModsSorted?: Array<string>
	isSortPlugins?: boolean
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
	 * 按文件名正序的第三方 mod 数组
	 *
	 * 排除 Skyrim 自带的 4 个 .esm.
	 * @type {string[]}
	 */
	enabledSortedThirdPartyMods: Array<string> = []

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
		allModsSorted,
		isSortPlugins
	}: InitParameter): Promise<void> {
		this.modDirectory = modDirectory
		this.profileDirectory = profileDirectory
		console.info(`[Info]`, `Handle profile directory: ${this.profileDirectory}`)

		if (Array.isArray(allModsSorted)) {
			this.allModsSorted = allModsSorted
		} else {
			this.allModsSorted = await ModManagerTwo.generateAllModsSorted(this.modDirectory)
		}

		if (typeof isSortPlugins === 'boolean') {
			this.isSortPlugins = isSortPlugins
		}

		if (this.isSortPlugins) {
			await this.initModsRelativeProperty()
			return this.initPluginsRelativeProperty()
		} else {
			console.info(`[Info]`, `Set options to not sort plugins!`)
			return this.initModsRelativeProperty()
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

		// 倒序遍历
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
	 * @param {boolean} isBackup 是否备份原文件
	 * @param {(profileDirectory: string) => void} onFilish     完成时回调
	 * @return {Promise<void>}
	 *
	 * <dependencies>
	 *    <method name="init" parameterQueue="[InitParameter]"/>
	 * </dependencies>
	 */
	async sort (isBackup: boolean = true, onFilish: (profileDirectory: string) => void) {
		let promiseArray: Array<Promise<void>> = []
		promiseArray.push(this.sortModlist(isBackup))
		if (this.isSortPlugins) {
			promiseArray.push(this.sortPlugins(isBackup))
			promiseArray.push(this.sortLoadorder(isBackup))
		}
		return Promise.all(promiseArray).then(() => {
			if (typeof onFilish === 'function') {
				onFilish(this.profileDirectory)
			}
		})

	}

	/**
	 * 初始化 plugin 相关属性
	 *
	 * init() 里会调用此反方, 在调用之前先得到或执行依赖项
	 *
	 * @return {Promise<void>}
	 *
	 * <dependencies>
	 *    <method name="initModsRelativeProperty" >
	 *      需要先初始化 mod 相关的属性, 即 initModsRelativeProperty() 执行过后
	 *    </method>
	 * </dependencies>
	 */
	private async initPluginsRelativeProperty () {
		let pluginsOfEnableMods: Array<string> = []
		for await (const modName of this.enabledSortedThirdPartyMods) {
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
			const plugins = await readlineToArray(pluginsFilePath)
			// 若有第三方 plugin
			if (plugins.length > ModManagerTwoProfile.fileTipLineCount) {
				for (let i = ModManagerTwoProfile.fileTipLineCount; i < plugins.length; i++) {
					const plugin = plugins[i]
					if (plugin.startsWith('*')) {
						// 启用的 plugins 最开头是 "*", 应去掉 "*"
						const pluginName = plugin.substring(1)
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
				for (let i = ModManagerTwoProfile.fileTipLineCount; i < modsInModlistFile.length; i++) {
					const mod = modsInModlistFile[i]
					const modName = mod.substring(1)
					// [warning] modsInModlisFile 可能存在已经删除的但却启用的 mod, 所以其与 modDirectory 的 mod 列表可能不同.
					// 如果 mod 启用, 且 存在于 mod directory
					if (mod.startsWith('+') && allModsSortedSet.has(modName)) {
						this.enabledSortedThirdPartyMods.push(modName)
						// 用于之后写 modlist.txt 时检索启用的
						this.enabledThirdPartyModSet.add(modName)
					}
				}
				// 等价于使用当前 locale, 按文件名排序
				this.enabledSortedThirdPartyMods.sort((a, b) => a.localeCompare(b))
			}
		}

	}
}