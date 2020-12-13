/**
 * [lyne]
 *  当一个模块导出很多函数时, 对开发就显得不友好了...
 *  函数过多, 有时你会忘记函数名字, 甚至还有重命名函数避免来自多个模块函数名冲突.
 *
 *  可使用导出全部作为新对象, import * as DateUtil from './DateUtil'
 *
 *  虽然 OOP 舒适, 虽然 JS 使用 OOP 耗能增加. 因为原本可能只需导出一些函数对象, 现在将导出一个模块的类中全部属性, 函数.
 *  TypeScript 推荐导出函数, 开发工具对导出函数更为友好...
 *
 *
 */

/**
 * 可直接使用 new Set(array) 把 array 转为 Set, 这里写这个为了 API
 * @param {Array<T>} array
 * @return {Set<T>}
 */
export function arrayToSet<T> (array: Array<T>): Set<T> {
	return new Set<T>(array)
}

