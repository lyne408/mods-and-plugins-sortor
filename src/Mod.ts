import DirectoryBase from "./DirectoryBase";
import {Empty_Array, Empty_String} from "./util/ValueUtil";

export default class Mod extends DirectoryBase {
    name: string = Empty_String
    dataFiles: Array<string> = Empty_Array
}