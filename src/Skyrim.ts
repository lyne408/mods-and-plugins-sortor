export default class Skyrim {
	/**
	 * 原生 ESM
	 * 已经按载入顺序排序
	 * @type {string[]}
	 */
	static vanillaESMs: Array<string> = [
		`Skyrim.esm`,
		`Update.esm`,
		`Dawnguard.esm`,
		`HearthFires.esm`,
		`Dragonborn.esm`
	]

	/**
	 * 插件文件类型的扩展名数组
	 * @type {string[]}
	 */
	static pluginExtnames: Array<string> = [
		`.esm`,
		`.esp`,
		`.esl`
	]
}