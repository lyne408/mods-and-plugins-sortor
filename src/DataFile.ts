import fs from 'fs'
import FileBase from "./FileBase";

const {promises: fsPromises} = fs


/**
 * class DataFile
 *
 * 表示 SkyrimSpecialEdition SE 的 Data File
 *
 */
export default class DataFile extends FileBase {

    /**
     * 目前 SSE 有三种 DataFile, 其扩展名为:
     *    - `.esm`
     *    - `.esp`
     *    - `.esl`
     */
    static readonly Extnames = {
        ESM: '.esm',
        ESP: '.esp',
        ESL: '.esl'
    }

    /**
     * Record Flags
     */
    static readonly Record_Flags = {
        ESMValue: 0x00000001,
        // 十进制为 512
        ESLValue: 0x00000200,
        // 还有其它的, 暂不使用
        Others: -1,
    }

    /**
     * 不同类型 DataFile 的优先级
     * 参照 Load Order 的设计, 数值越小, 则优先级越高
     */
    static readonly Priority = {
        TreatedAsMaster: 110,
        TreatedAsPlugin: 120,
        TreatedAsESLMaster: 130,
        TreatedAsESLPlugin: 140
    }

    /**
     * Record Flags 位于 第 3 个 Uint32
     */
    static readonly Record_Flags_Size: number = 4

    /**
     * Record Flags 位于 第 3 个 Uint32
     */
    static readonly Record_Flags_Position: number = 8


    /**
     * 为 {职责类} API
     * get Record Flags Value
     * @param dataFilePath
     * @return number
     */
    static async getRecordFlagsValue(dataFilePath: string): Promise<number> {
        const fileHandle = await fsPromises.open(dataFilePath, fs.constants.O_RDONLY)
        const {buffer: bufferUInt8Array} = await fileHandle.read({
            buffer: Buffer.alloc(DataFile.Record_Flags_Size),
            // TS 未知错误, 只能注释了
            // @ts-ignore
            offset: 0,
            length: DataFile.Record_Flags_Size,
            position: DataFile.Record_Flags_Position
        })
        // TODO TS, 返回值必须是 Record_Flags 的 keys 之一
        // const unit32Value = bufferValue.swap32().readUInt32BE()
        // if (unit32Value === RecordFlagsHexadecimalValue.ESM) {
        // return RecordFlagsHexadecimalValue.ESM
        // } else if (unit32Value === RecordFlagsHexadecimalValue.ESL){
        // return RecordFlagsHexadecimalValue.ESL
        // } else {
        // return RecordFlagsHexadecimalValue.Others
        // }
        const buffer = Buffer.from(bufferUInt8Array)
        return buffer.swap32().readUInt32BE()
    }

    /**
     * 为 {业务类} API
     * @param extname
     * @param recordFlagsValue
     */
    static checkIfTreatedAsMaster(extname: string, recordFlagsValue: number): boolean {
        return (extname === DataFile.Extnames.ESM && recordFlagsValue !== DataFile.Record_Flags.ESLValue)
            || (extname === DataFile.Extnames.ESP && recordFlagsValue === DataFile.Record_Flags.ESMValue)
    }

    /**
     *
     * @param extname
     * @param recordFlagsValue
     */
    static checkIfTreatedAsPlugin(extname: string, recordFlagsValue: number): boolean {
        return extname === DataFile.Extnames.ESP
            && recordFlagsValue !== DataFile.Record_Flags.ESMValue
            && recordFlagsValue !== DataFile.Record_Flags.ESLValue
    }

    /**
     *
     * @param extname
     * @param recordFlagsValue
     */
    static checkIfTreatedAsESLMaster(extname: string, recordFlagsValue: number): boolean {
        return (extname === DataFile.Extnames.ESM && recordFlagsValue === DataFile.Record_Flags.ESLValue)
            || (extname === DataFile.Extnames.ESL && recordFlagsValue === DataFile.Record_Flags.ESMValue)
    }

    /**
     *
     * @param extname
     * @param recordFlagsValue
     */
    static checkIfTreatedAsESLPlugin(extname: string, recordFlagsValue: number): boolean {
        return (extname === DataFile.Extnames.ESP && recordFlagsValue === DataFile.Record_Flags.ESLValue)
            || (extname === DataFile.Extnames.ESL && recordFlagsValue === DataFile.Record_Flags.ESMValue)
    }
}



 