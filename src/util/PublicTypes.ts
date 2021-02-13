/*

[lyne]
enum 适用于 enum value identifier 就有含义的, 不需要属性值的.
如果需要 enum 的功能, 还需要属性值的, 宜采用对象(instance or Class Object)
*/


enum OneOfOrAll {

    /**
     * Only when all queried, return.
     */
    All,

    /**
     * If queried any one, return.
     */
    One_Of
}