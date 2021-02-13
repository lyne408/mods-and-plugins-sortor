import fs from 'fs'
import readline from 'readline'
import {Empty_String} from "./ValueUtil";

/**
 * 按行读取文件内容
 *
 * @param filePath 文件路径
 *
 * @return 字符串数组
 */
export async function readlineToArray(filePath: string): Promise<Array<string>> {
    if (filePath === Empty_String) return []

    // 是异步的
    let readObj = readline.createInterface({
        input: fs.createReadStream(filePath)
    })

    let array: Array<string> = []
    // 使用 Promise 一个读取文件, 得到含数组的 Promise.
    // 因为 readLine 读取文件是异步如果要返回读取的数据, 必须使用异步编程
    return new Promise((resolve) => {
        // 读取一行后触发回调
        readObj.on('line', function (line) {
            // 这个 line 参数没有保留文件内容的换行, 可以 push 数组时加上换行, 或者在连接成字符串时添加换行. 推荐后者
            array.push(line)
        })
        // 读取完成后, 关闭流之前触发回调
        readObj.on('close', function () {
            resolve(array)
        })
    })

}


