export default class SkyrimSpecialEdition {
    /**
     * 原生 ESM
     * 已经按载入顺序排序
     * @type {string[]}
     */
    static readonly Vanilla_Data_Files: Array<string> = [
        'Skyrim.esm',
        'Update.esm',
        'Dawnguard.esm',
        'HearthFires.esm',
        'Dragonborn.esm'
    ]

    /**
     * 插件文件类型的扩展名数组
     * @type {string[]}
     */
    static readonly Data_File_Extnames: Array<string> = [
        '.esm',
        '.esp',
        '.esl'
    ]

    /**
     * loadorder.txt 第一行是提示, 之后五行是五个官方 esm
     * @type {number}
     */
    static readonly Vanilla_Data_Files_Count: number = 5
}