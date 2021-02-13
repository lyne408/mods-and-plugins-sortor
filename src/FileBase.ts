import {Empty_String} from "./util/ValueUtil";

export default class FileBase {
    /**
     * DataFile instance 所在路径
     */
    protected path: string = Empty_String

    /**
     * DataFile instance 的 filename
     */
    protected fileName: string = Empty_String

    protected isSymbolicLink: boolean =  false

    protected isHardLink: boolean =  false
}