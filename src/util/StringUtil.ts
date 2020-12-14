import { isNonEmptyArray } from './ArrayUtil'

const ACode = 'A'.charCodeAt(0)
const ZCode = ACode + 25
const aCode = 'a'.charCodeAt(0)
const zCode = aCode + 25
const spaceCode = ' '.charCodeAt(0)

/**
 * 向一个字符串里插入字符串
 * @param sourceStr
 * @param startIndex
 * @param insertStr
 */
export function insertString (sourceStr: string, startIndex: number, insertStr: string): string {
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
 */
export function wordsToLowerCamel (str: string): string {
	let words = str.split(' ')
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
	return words.join('')
}

/**
 *
 * @param sourceStr
 * @param startIndex
 * @param insertStr
 */
/**
 * 从一个字符串里删除某个字符串
 *   delete 是关键字, 只好命名为 deleteString
 * @param sourceStr
 * @param deleteStr
 */
export function deleteString (sourceStr: string, deleteStr: string): string {
	// replace 可以
	// sourceStr = sourceStr.replace('-', '')

	// split 也可以
	// sourceStr = sourceStr.split('-').join('')

	// slice 也可以, hyphen 译为分隔符
	// sourceStr = sourceStr.slice(0, hyphenIndex - 1) + sourceStr.slice(hyphenIndex + 1)
	if (sourceStr.includes(deleteStr)) {
		return sourceStr.replace(deleteStr, '')
	} else {
		return sourceStr
	}
}

/**
 * 删除多个字符串
 * @param sourceStr
 * @param deleteStringArray
 */
export function deleteStrings (sourceStr: string, deleteStringArray: Array<string>): string {
	for (const delStr of deleteStringArray) {
		sourceStr = deleteString(sourceStr, delStr)
	}
	return sourceStr
}


/**
 * 替换多个字符串为某一个字符串
 *
 * @param {string} sourceStr
 * @param {Array<string>} replaceStringArray
 * @param {string} targetString
 * @return {string}
 */
export function replaceStrings (sourceStr: string, replaceStringArray: Array<string>, targetString: string): string {
	for (const replaceStr of replaceStringArray) {
		sourceStr = sourceStr.replace(replaceStr, targetString)
	}
	return sourceStr
}

/**
 *
 * @param {string} sourceString
 * @param {Map<string, string>} map Map<oldStrKey, newStrValue>
 * @return {string}
 */
export function replaceStringsByMap (sourceString: string, map: Map<string, string>): string {
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
		// 没遍历一次就替换一次
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
export function reserveLettersAndSpace (str: string): string {
	let charArray = str.split('')
	for (let i = 0; i < charArray.length - 1; i++) {
		let charCode = charArray[i].charCodeAt(0)
		if (charCode < spaceCode || charCode > spaceCode && charCode < ACode || charCode > ZCode && charCode < aCode || charCode > zCode) {
			delete charArray[i]
		}
	}
	
	return charArray.join('')
}

/**
 *
 * @param {string} str
 * @return {string}
 */
export function wordsToHyphenLowercase (str: string): string {
	let words: Array<string> = str.trim().split(' ')
	words = words.map(word => {
		return word.toLowerCase()
	})
	return words.join('-')
}

/**
 *
 * @param {string} str
 * @param {Array<string>} inclusions
 * @return {boolean}
 */
export function isContainsOf (str: string, inclusions: Array<string>): boolean {
	let isInclusions = isNonEmptyArray(inclusions)
	let isQueryd = false
	if (isInclusions) {
		for (let i = 0; i < inclusions.length; i++) {
			if (str.includes(inclusions[i])) {
				isQueryd = true
			}
		}
	}
	return false
}

