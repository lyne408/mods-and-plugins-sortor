import {Empty_Array, Empty_String} from "./util/ValueUtil";

export default class DirectoryBase {
    protected path: string = Empty_String

    protected files: Array<string> = Empty_Array
    protected directories: Array<string> = Empty_Array

    protected symbolicLinks: Array<string> = Empty_Array
    protected hardLinks: Array<string> = Empty_Array
    protected junctions: Array<string> = Empty_Array

    /**
     * 目录 Junction 在 Linux 中也是 symbolic link?
     * @protected
     */
    protected isJunction: boolean =  false

}