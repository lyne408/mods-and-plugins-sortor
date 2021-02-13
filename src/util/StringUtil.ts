/***
 * Note: 许多字符串功能函数都要设置 大小写敏感与否 的参数
 */
import {isNonEmptyArray} from './ArrayUtil'
import {Empty_String, Hyphen_String, Space_String} from "./ValueUtil";

const ACode = 'A'.charCodeAt(0)
const ZCode = ACode + 25
const aCode = 'a'.charCodeAt(0)
const zCode = aCode + 25
const spaceCode = Space_String.charCodeAt(0)

/**
 * 向一个字符串里插入字符串
 * @param sourceStr
 * @param startIndex
 * @param insertStr
 */
export function insertString(sourceStr: string, startIndex: number, insertStr: string): string {
    return sourceStr.slice(0, startIndex) + insertStr + sourceStr.slice(startIndex)
}

/**
 * 几个单词们转为一个小驼峰
 * 如 Four figures -> fourFigures
 * 测试: console.log(wordsToLowerCamel('Four figures'))
 * @param {String} str
 *
 * ### 实现思路
 *  先把所有单词转成小写, 然后第一个字母转成大写
 *  再把第一个单词首字母转为小写
 *  TODO 大小写不敏感
 */
export function wordsToLowerCamel(str: string): string {
    let words = str.split(Space_String)
    // 1. 先把所有单词转成小写, 然后第一个字母转成大写
    words = words.map((word) => {
        word = word.toLowerCase()
        // [Lyne] 字符串变量[数字], 这种形式只读
        // word[0] = 'h'
        word = word[0].toUpperCase() + word.substring(1)
        return word
    })
    // 2. 再把第一个单词首字母转为小写
    words[0] = words[0][0].toLowerCase() + words[0].substring(1)
    return words.join(Empty_String)
}

/**
 * 从一个字符串里删除某个字符串
 *   delete 是关键字, 只好命名为 deleteString
 *    TODO 大小写不敏感
 * @param sourceStr
 * @param deleteStr
 */
export function deleteString(sourceStr: string, deleteStr: string): string {
    // replace 可以
    // sourceStr = sourceStr.replace('-', '')

    // split 也可以
    // sourceStr = sourceStr.split('-').join('')

    // slice 也可以, hyphen 译为分隔符
    // sourceStr = sourceStr.slice(0, hyphenIndex - 1) + sourceStr.slice(hyphenIndex + 1)
    if (sourceStr.includes(deleteStr)) {
        return sourceStr.replace(deleteStr, Empty_String)
    } else {
        return sourceStr
    }
}

/**
 * 删除多个字符串
 *  TODO 大小写不敏感
 * @param sourceStr
 * @param deleteStringArray
 */
export function deleteStrings(sourceStr: string, deleteStringArray: Array<string>): string {
    for (const delStr of deleteStringArray) {
        sourceStr = deleteString(sourceStr, delStr)
    }
    return sourceStr
}

/**
 * 替换多个字符串为某一个字符串
 *
 *  TODO 大小写不敏感
 * @param {string} sourceStr
 * @param {Array<string>} replaceStringArray
 * @param {string} targetString
 * @return {string}
 */
export function replaceStrings(sourceStr: string, replaceStringArray: Array<string>, targetString: string): string {
    for (const replaceStr of replaceStringArray) {
        sourceStr = sourceStr.replace(replaceStr, targetString)
    }
    return sourceStr
}

/**
 * 如果要支持 isCaseSensitive: boolean 参数, 则应使用正则表达式
 *
 * @param {string} sourceString
 * @param {Map<string, string>} map Map<oldStrKey, newStrValue>
 * @return {string}
 *  TODO 大小写不敏感
 */
export function replaceStringsByMap(sourceString: string, map: Map<string, string>): string {
    map.forEach((newStrValue, oldStrKey) => {
        // [Lyne] replace(oldStr, newStr),  若 oldStr 只是个字符串, 只会替换一次.
        // 如需全局替换, 使用正则表达式, 也可采用其它的方式
        /*******不使用正则全局匹配****/
        // sourceString = sourceString.replace(key, value)

        /***** [Lyne] Map 里的 key 作为 RegExp 第一个参数始终报错, 原因未知 ****/
        /***** SyntaxError: Invalid regular expression: /?/: Nothing to repeat ***/
        // console.log(typeof key === 'string')  // true
        // let regExp = new RegExp(key, "g"); // 报错
        // let regExp = new RegExp(`${key}`,'g') // 报错

        /******************* 不报错 *********************/
        // var str = "variate"; //定义变量
        // var reg = new RegExp(str, "g"); //定义正则表达式;
        // var myStr = "this is variate";
        // myStr = myStr.replace(reg, 'changing now!');
        // console.log(myStr);
        /****************************************/

        /*** 采用 split(), join() 方案 ***/
        /* 这样也不用每次创建正则对象了 */
        // 每遍历一次就替换一次
        let noOldStrArray: Array<string> = sourceString.split(oldStrKey)
        sourceString = noOldStrArray.join(newStrValue)

    })

    return sourceString
}

/**
 * 仅保留字母和空格
 * @param {string} str
 * @return {string}
 */
export function reserveLettersAndSpace(str: string): string {
    let charArray = str.split(Empty_String)
    for (let i = 0; i < charArray.length - 1; i++) {
        let charCode = charArray[i].charCodeAt(0)
        if (charCode < spaceCode || charCode > spaceCode && charCode < ACode || charCode > ZCode && charCode < aCode || charCode > zCode) {
            delete charArray[i]
        }
    }

    return charArray.join(Empty_String)
}

/**
 *
 * @param {string} str
 * @return {string}
 */
export function wordsToHyphenLowercase(str: string): string {
    let words: Array<string> = str.trim().split(Space_String)
    words = words.map(word => {
        return word.toLowerCase()
    })
    return words.join(Hyphen_String)
}


/*
enum Equal {
	equal
}

type CheckStringMatchModes = Equal | OneOfOrAll

matchMode = Equal.equal
matchMode = OneOfOrAll.OneOf

matchMode = CheckStringMatchModes.oneOf 报错, CheckStringMatchModes 是一个类型

*/

enum CheckStringMatchModes {
    Contains_Of,
    Equals_Of,
    Has_Substrings
}

type CheckStringParameter = {
    string: string
    inclusions: Array<string>
    matchMode?: CheckStringMatchModes
    isCaseSensitive?: boolean
    // 性能选项
    isCheckNonEmptyArguments?: boolean
}


function checkString({
                         string,
                         inclusions,
                         matchMode = CheckStringMatchModes.Contains_Of,
                         isCaseSensitive = true,
                         isCheckNonEmptyArguments = true
                     }: CheckStringParameter): boolean {
    if (isCheckNonEmptyArguments) {
        if (!isNonEmptyString(string) || !isNonEmptyArray(inclusions)) return false
    }
    let counter = 0
    if (matchMode === CheckStringMatchModes.Has_Substrings) {
        // [lyne] 代码虽长, 但性能高. 分两次遍历, 而非每次遍历判断是否忽略大小写
        if (!isCaseSensitive) {
            string = string.toLowerCase()
            for (const inclusion of inclusions) {
                if (string.includes(inclusion.toLowerCase())) {
                    counter++
                }
            }
        } else {
            for (const inclusion of inclusions) {
                if (string.includes(inclusion)) {
                    counter++
                }
            }
        }
        return counter === inclusions.length
    } else if (matchMode === CheckStringMatchModes.Contains_Of) {
        if (isCaseSensitive) {
            for (const inclusion of inclusions) {
                if (string.includes(inclusion)) {
                    return true
                }
            }
        } else {
            string = string.toLowerCase()
            for (const inclusion of inclusions) {
                if (string.includes(inclusion.toLowerCase())) {
                    // return 就不用 break.
                    // [lyne] **只判断一层**, 直接返回 return value. 无需悲观锁思想. 无需先设置变量, 中途改变变量, 最后再返回. 提高性能
                    return true
                }
            }
        }
    } else if (matchMode === CheckStringMatchModes.Equals_Of) {
        if (isCaseSensitive) {
            for (const inclusion of inclusions) {
                if (string === inclusion) {
                    return true
                }
            }
        } else {
            string = string.toLowerCase()
            for (const inclusion of inclusions) {
                if (string === inclusion.toLowerCase()) {
                    return true
                }
            }
        }
    }
    return false
}

export type ContainsOfParameter = Omit<CheckStringParameter, 'matchMode'>

/**
 *
 * @param {ContainsOfParameter} argObj
 * @return {boolean}
 */
export function containsOf(argObj: ContainsOfParameter): boolean {
    return checkString(Object.assign(argObj, {matchMode: CheckStringMatchModes.Contains_Of}))
}

export type HasSubstringsParameter = Omit<CheckStringParameter, 'matchMode'>


/**
 * 比如用 ['Dark Kight', 'BHUNP'] 筛选出 "Dark Kight CBBE 3BA & BHUNP"
 *
 * @param {HasSubstringsParameter} argObj
 * @return {boolean}
 */
export function hasSubstrings(argObj: HasSubstringsParameter): boolean {
    return checkString(Object.assign(argObj, {matchMode: CheckStringMatchModes.Has_Substrings}))
}


export type EqualsOfParameter = Omit<CheckStringParameter, 'matchMode'>

/**
 * 文件名等于其中一个
 * @param {EqualsOfParameter} argObj
 * @return {boolean}
 */
export function equalsOf(argObj: EqualsOfParameter): boolean {
    return checkString(Object.assign(argObj, {matchMode: CheckStringMatchModes.Equals_Of}))
}

/**
 * determine any variable is empty string or not
 * @param unknown
 * @return {boolean}
 */
export function isNonEmptyString(unknown: unknown): boolean {
    return typeof unknown === 'string' && unknown.length > 0
}

/**
 * 检查相等性
 *
 * @param {string} str1
 * @param {string} str2
 * @param {boolean} isCaseSensitive
 * @return {boolean}
 */
export function checEquality(str1: string, str2: string, isCaseSensitive: boolean = true): boolean {
    if (isCaseSensitive) {
        return str1 === str2
    } else {
        return str1.toLowerCase() === str2.toLowerCase()
    }
}

export const equals = checEquality


export type GetMiddleParameter = {
    string: string
    left: string
    right: string
}

/**
 * 获取中间部分
 *
 * 比如获取 '@ByteArray(Z_RM_CBBE)' 中间的 可变字符串  Z_RM_CBBE
 *
 * @param string
 * @param left
 * @param right
 * @param isCaseSentive
 *
 *
 * 测试代码
 * ```
 * console.log('@ByteArray(Z_RM_CBBE)'.slice('@ByteArray('.length, '@ByteArray(Z_RM_CBBE)'.length - ')'.length))
 * // Z_RM_CBBE
 * ```
 */
export function getMiddle({
                              string, left, right
                          }: GetMiddleParameter): string {
  return string.slice(left.length, string.length - right.length)
}