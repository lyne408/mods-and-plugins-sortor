export type GetOrderNumber = (num: number) => string

export enum WordsEnum {
	counter = 'counter',
	doubleFigures = 'double figures',
	threeFigures = 'three figures',
	fourFigures = 'four figures'
}

/**
 * 直接计数, 不添加 0
 * @param num
 */
export let counter: GetOrderNumber = (num: number) => '' + num

/**
 * 两位数, 数字为一位数时添加 0
 * @param num
 */
export let doubleFigures: GetOrderNumber = (num: number) => num < 10 ? '0' + num : num + ''

/**
 * 三位数, 数字为 一位数 或 两位数 时添加 0
 * @param num
 */
export let threeFigures: GetOrderNumber = (num: number) => {
	// [Lyne] 不要采用 "临时值", 最后返回临时值的方式, 而是每个 if 里直接返回. 避免多消耗资源
	//  let numStr: string
	if (num < 10) {
		return '00' + num
	} else if (num >= 10 && num < 100) {
		return '0' + num
	} else {
		return '' + num
	}
}

/**
 * 四位数, 数字为 一位数 或 两位数 或 三位数 时添加 0
 * @param num
 */
export let fourFigures: GetOrderNumber = (num: number) => {
	if (num < 10) {
		return '000' + num
	} else if (num <= 10 && num < 100) {
		return '00' + num
	} else if (num <= 100 && num < 1000) {
		return '0' + num
	} else {
		return '' + num
	}
}

/**
 * Finds suitable "getOrderNumber"
 * @param length
 * @returns suitable
 */
export let findSuitable = (
	length: number
): GetOrderNumber => {
	let fn: GetOrderNumber
	if (length >= 0 && length <= 9) {
		fn = counter
	} else if (length >= 10 && length <= 99) {
		fn = doubleFigures
	} else if (length >= 100 && length <= 999) {
		fn = threeFigures
	} else {
		fn = fourFigures
	}
	return fn
}







