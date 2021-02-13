/**
 * [lyne]
 * 值工具模块, 用于 TypeScript 选项为 必须给 property 设置初始值
 *
 * 1. 高性能初始化变量值
 * 2. 使用相应变量或属性时, 无需繁琐的类型判断
 * 3. 返回空值时, 无需每次返回新建的对象
 *
 * WARNING:
 * 1. 不应该使用某些初值, 而是把业务逻辑的结果赋给属性.
 * 2. 这只是一种代码风格
 */


/*

// 旧代码 1: 虽不需要许多类型判断, 但可能很多属性都没用到, 浪费资源, 性能差,
export default class DirectoryBase {
    path: string = ''
    files: Array<string> = []
    directories: Array<string> = []
    symbolicLinks: Array<string> = []
    hardLinks: Array<string> = []
    junctions: Array<string> = []
}


// 旧代码 2: 虽节省资源, 性能高, 但需要许多类型判断
export default class DirectoryBase {
    path: string | undefined = undefined
    files: Array<string> | null = null
    directories: Array<string> | null = null
    symbolicLinks: Array<string> | null = null
    hardLinks: Array<string> | null = null
    junctions: Array<string> | null = null
}

// 新代码: 使用 InitialValueUtil, 初始化为常量值. 性能高, 也无需许多类型判断
export default class DirectoryBase {
    path: string = Empty_String
    files: Array<string> = Empty_Array
    directories: Array<string> = Empty_Array
    symbolicLinks: Array<string> = Empty_Array
    hardLinks: Array<string> = Empty_Array
    junctions: Array<string> = Empty_Array
}

*/


/*
[lyne] 高性能初始化方案

1. 根据业务可初始化为有意义的值, 无需有意义的值则使用下面的常量值.
2. 一旦初始值为无需有意义的值, 在通用另外的方式进行业务上的赋值之前, 不宜使用.

    通常不建议一来就把数组变量初始化为 [], 可能用不到, 会浪费资源. Map, Set 亦是.

----

- number

    JavaScript 里, 无意义的 number variable 初始值可设为 NaN.
    期待的逻辑值 >= 0 时, 也可初始化为 -1. Java 常用此方案.

- string

   Empty_String = ''

- boolean

    习惯上根据业务初始化为 true 或 false.

- Array

- Set

- Map

- {Custom Class} instance 初始化

    方案一: 类型为 {Custom Class} | null

    启动 strictNullChecks 时, 欲使 property 值 null, 需用联合类型.
    如 `modManagerTwo: ModOrganizerTwo | null = null`.

    适用场合:
    - 常根据 {返回值是否为 null} 来确定有没有结果
    - 可用 null 作为  的 无意义的初值
    - 该属性可能不被使用, 为性能初始化为 null


    缺点: 造成 null 检查.

    方案二: 类型为 {Custom Class}

    需要修改时, 可用 Object.assign().

    适用场合:
    - 该属性一定会被使用
    - 该属性有默认值

        如该属性是一个 config 对象, 有默认配置


- {Custom Class} 的静态属性

    优先使用静态常量, `static readonly property`.
    不能事先确定, 可设 ClassName.init() 方法来确保初始化, 根据需要可再冻结.

*/


/*
导出一个常量空数组:

方案一: 错误
export const Empty_Array1 = Object.freeze([]) // 无错
let mods: Array<string> = Empty_Array1 // TS 4.1 有错, 只读的 realonly never[] , 不能赋给 可写的 string[]

// 方案二: 无错
export const Empty_Array = []
Object.freeze(Empty_Array)
let mods: Array<string> = Empty_Array

[lyne408]
Object.freeze(obj) 的执行体(无需返回值)会冻结对象的属性, 阻止增减属性.
还有一个返回值, MDN 显示 "freeze() returns the SAME object that was passed to the function."
已知 TS 4.1 里, 返回的对象是 readonly 的, 不能将之赋给其它变量.

方案一 与 方案二 的逻辑是一样的, 只是 TS 的处理不一样罢了.
*/



/*
[lyne408] Object.freeze(Empty_Array) 类被冻结的常量, 适用场合:
本身的值(冻结的[])并不能用, 用于 **被赋值**.
如果要增加元素, 只能新建数组.
*/

export const Empty_Array: Array<any> = []
Object.freeze(Empty_Array)


/* [lyne408] unknown vs. any vs. never:

never 的主要作用就是充当 Typescript 类型系统里的 Bottom Type. 参考 basic types 和 unions 部分.
never 的本意设计应是指不可达的.
unknown: TS 3+ top type,
any: 既是 top也是bottom

unknown 类型在被确定为某个类型之前，不能被进行诸如函数执行、实例化等操作，一定程度上对类型进行了保护.
当完全不需要类型检查时, 宜用 any 而非 unknown.

比如:
不能推断出 unknown 是 对象之前, unknown.toString() 是错误的.
任何时候 any.toString() 都是正确的, 但是不安全的, 只有对象才有 toString() 方法.

TS 里 Set<T> 的泛型声明使用的是 any.
```ts
interface SetConstructor {
    new <T = any>(values?: readonly T[] | null): Set<T>;
    readonly prototype: Set<any>;
}
declare var Set: SetConstructor;
```
*/
export const Empty_Set = new Set<any>()
Object.freeze(Empty_Set)

export const Empty_Weak_Set =new WeakSet<any>()
Object.freeze(Empty_Weak_Set)

export const Empty_Map = new Map<any, any>()
Object.freeze(Empty_Map)

export const Empty_Weak_Map = new WeakMap<any, any>()
Object.freeze(Empty_Weak_Map)
/**
 * 按照习惯, 应使用 null. 而非此.
 * 类似 `modManagerTwo: ModOrganizerTwo | null = null`.
 */
export const Empty_Object = {}
Object.freeze(Empty_Object)

// -----------------------------------------------------

export const Empty_String = ''

export const Space_String = ' '

export const Hyphen_String = '-'

export const Underscore_String = '_'

export const Colon_String = ':'

export const CRLF_String = '\r\n'

export const LF_String = '\n'

// --------------------------------------------------

export const Undefined_String = 'undefined'

export const String_String = 'string'

export const Boolean_String = 'boolean'

export const Number_String = 'number'

export const Function_String = 'function'

export const Object_String = 'object'

// -----------------------------------------------------

export const Finish_String = 'finish'

export const Data_String = 'data'