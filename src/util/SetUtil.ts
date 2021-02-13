/**
 * [lyne]
 *
 * - 若一个 模块文件 内容是些 功能性函数, 宜函数式编程, 如 导出 多个函数
 *
 *  开发工具对导出函数更为友好
 *
 *  当一个模块导出很多函数时, 对开发就显得不友好了...
 *  函数过多, 有时你会忘记函数名字, 甚至还有重命名函数避免来自多个模块函数名冲突.
 *  可使用导出全部函数作为新对象, 如 `import * as DateUtil from './DateUtil'`,
 *      这类似于增设命名空间, 而且 键入 `DateUtil.` 就会提示全部函数
 *
 * - 若需要对象的存储数据, 需创建机器人, 需职责划分等, 宜用 OOP
 *
 * ----
 *
 * 所以还是根据业务取舍性能与开放
 *
 */

/**
 * 可直接使用 new Set(array) 把 array 转为 Set, 这里写这个为了 API
 * @param {Array<T>} array
 * @return {Set<T>}
 */
export function arrayToSet<T>(array: Array<T>): Set<T> {
    return new Set<T>(array)
}

export function isSet(unknown: unknown): boolean {
    return unknown instanceof Set
}

export function isNonEmptySet(unknown: unknown): boolean {
    return unknown instanceof Set && unknown.size > 0
}