/**
 * 正则表达式的设计实在有些难以使用
 * 符号是令人头疼的事情
 * 为了特地编写一些功能性函数
 */


export type GetMiddleParameter = {
	string: string
	left: string
	right: string
	isCaseSentive?: boolean
}




const anyRegExp = /[\S\s]*/	// RegExp instance
const anyRegExpString = anyRegExp.source // RegExp string variable
/*
// 直接写在代码里, RegExp string literal, 常需要转义"\", 即常遇到 double back slash
const anyRegExpStringLiteral = `[\\S\\s]*`	// RegExp string literal

*/


//******************* loadsh _escapeRegExp() 开始 **************************
/**
 * <reference>
 *     2020-12-11
 *     https://github.com/lodash/lodash/blob/91c9cb1ea3d0973201d8e5f517a93c9f54e3f9e5/escapeRegExp.js
 * </reference>
 */

const reRegExpChar = /[\\^$.*+?()[\]{}|]/g
const reHasRegExpChar = RegExp(reRegExpChar.source)
/**
 *
 * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
 * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
 *
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @see escape, escapeRegExp, unescape
 * @example
 *
 * escapeRegExp('[lodash](https://lodash.com/)')            // '\[lodash\]\(https://lodash\.com/\)'
 *
 */
export function escapeRegExp(string: string): string {
	return (string && reHasRegExpChar.test(string))
		? string.replace(reRegExpChar, '\\$&')
		: (string || '')
}
//******************* loadsh _escapeRegExp() 结束 **************************



/**
 * 获取中间部分
 *
 * @param {string} string
 * @param {string} left
 * @param {string} right
 * @param {boolean | undefined} isCaseSentive 暂不支持 <defaultValue value="true">
 * @return {string}
 *

// 测试代码
console.log(getMiddle({
	string: '@ByteArray(Z_RM_CBBE)',
	left: '@ByteArray\\(',
	right: '\\)'
}))

 */
export function getMiddle ({
	string, left, right, isCaseSentive = true
}: GetMiddleParameter): string {

	let regExpString = `(${escapeRegExp(left)})(${anyRegExpString})(${escapeRegExp(right)})`
	let threeGroupRegExp = new RegExp(regExpString)
	let execArray = threeGroupRegExp.exec(string)
	if (Array.isArray(execArray)) {
		// execArray[0] 是匹配到的整个, 之后的才是分组
		return execArray[2]
	} else {
		return ''
	}
}




