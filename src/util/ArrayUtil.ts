/**
 *  delete 数组元素会形成空位, 但 array.join() 把空位当成空串连接. 遍历方式...
 *  所以自己写个方法, 因为 forEach 忽略空位.
 *  [Lyne] 副作用的全局性代码其实不利于维护和开发工具, 所以这里没有添加到原型上
 * @param array
 * @param joinStr
 *
 *  ### 测试代码
 *  let testArray = [,,,'非空串'];
 *  console.log(testArray.joinNoEmpty("\r\n"));
 *
 *

 delete 数组元素会形成空位. array.join(), 如果是空位, 则形成空串.

 */
export function joinNoEmpty (array: Array<string>, joinStr: string): string {
	let outputStr = ''
	array.forEach(element => {
		outputStr += element + joinStr
	})
	return outputStr.substr(0, outputStr.length - joinStr.length)
}

/**
 * 把一维数组 转为 二维数组.
 * 把 160 个并行任务拆分为 20 次序列的 8 个并行任务, 减少资源消耗
 * 如下载 160 个文件, 每次并行下载 8 个, 这 8 个下载完成后, 再继续
 * @param arrayOneDimensional
 * @param capacity
 */
// [Lyne] TS 的函数的参数有默认值都不能设为可选参数
export function toTwoDimensional (arrayOneDimensional: Array<any>, capacity: number = 8): Array<Array<any>> {

	let arrayTwoDimensional: Array<Array<any>> = []
	let tempArr: Array<any> = []

	for (let i = 0; i < arrayOneDimensional.length; i++) {
		tempArr.push(arrayOneDimensional[i])
		// 设 capacity = 8, 没到 8 个就 push 一次, 并清空 tempArr,  少于 8 个时会在遍历结束后 push
		// i + 1 不可能为 0
		if ((i + 1) % capacity === 0) {
			arrayTwoDimensional.push(tempArr)
			tempArr = []
		}
	}

	// 设 capacity = 8
	// oneDimensionalArr 的长度除 8 有余数时
	// oneDimensionalArr % 8 > 0 时会有 tempArr.length > 0, 应该 push
	if (arrayOneDimensional.length % capacity > 0) {
		arrayTwoDimensional.push(tempArr)
	}
	return arrayTwoDimensional
}

// [Lyne] TypeScript 扩展 Array.constructor.prototype 应该使用 继承...

// class FixArray extends Array {
//     joinNoEmpty = (str: string) => {
//         let outputStr = ''
//         this.forEach((element: string) => {
//             outputStr += element + str
//         })
//         return outputStr.substr(0, outputStr.length - str.length)
//     }
// }

// Array.constructor.prototype.joinNoEmpty = (function anonymous(str: string) {
//     let outputStr = ''
//     this.forEach((element: string) => {
//         outputStr += element + str
//     })
//     return outputStr.substr(0, outputStr.length - str.length)
// })
//
// let testArray = new FixArray()
// console.log(testArray.joinNoEmpty("\r\n"));

/**
 * Remove duplicated elements of an string array.
 *
 * TODO 考虑增设判断相等的函数参数, 增设泛型参数
 *
 * @param {Array<string>} array
 *
 * @param {"last" | "first"} reservation
 *  If "last", reserve the element which has the largest index.
 *
 * @param {boolean} isCaseSensitive
 *
 * @return {Array<string>}
 *  Return array has been handled.
 *
 测试代码:

 let testArray: Array<string> = ['3', '2', '1', '5', '2', '3']
 console.info(`[Info]`, stringArraytRemoveDuplication(testArray)) // [Info] [ '3', '2', '1', '5' ]
 console.info(`[Info]`, stringArraytRemoveDuplication(testArray, 'last')) // [Info] [ '1', '5', '2', '3' ]

 let testArrayCaseInsensitive: Array<string> = ['AA', 'Bb', 'cC', 'H', 'bb', 'aa']
 console.info(`[Info]`, stringArraytRemoveDuplication(testArrayCaseInsensitive, 'first', false)) // [Info] [ 'AA', 'Bb', 'cC', 'H' ]
 console.info(`[Info]`, stringArraytRemoveDuplication(testArrayCaseInsensitive,'last', false )) //  [Info] [ 'cC', 'H', 'bb', 'aa' ]
 */
export function removeStringArrayDuplication (array: Array<string>, reservation: 'last' | 'first' = 'first', isCaseSensitive: boolean = true): Array<string> {

	let arrayReturned: Array<string> = []

	if (isCaseSensitive) {
		/* [lyne] 比如 Array, 使用 Set 或 Map 检索性能高 */
		let elementIndexSet = new Set<string>()
		if (reservation === 'first') {

			array.forEach((element) => {
				// 如果之前没有出现, 就添加, 反之无操作
				if (!elementIndexSet.has(element)) {
					arrayReturned.push(element)
					elementIndexSet.add(element)
				}
			})
		} else if (reservation === 'last') {
			// 正序遍历会易出现空位. 所以采用倒序遍历.
			/*array.forEach((element, index) => {
			  let value = elementIndexMap.get(element)
			  // 如果之前有, 则删除. 所以会形成空位
			  if (elementIndexSet.has(element)) {
				delete arrayReturned[value]
			  }
			  elementIndexSet.add(element)
			  arrayReturned.push(element)
			})*/
			// 倒序遍历, 避免出现空位. 倒序遍历 i --
			for (let i = array.length - 1; i >= 0; i--) {
				// 如果之前没有出现, 就添加, 反之无操作
				if (!elementIndexSet.has(array[i])) {
					elementIndexSet.add(array[i])
					arrayReturned.push(array[i])
				}
			}
			arrayReturned.reverse()
		}
	}

	// 大小写不敏感时
	else {
		let elementIndexSetCaseInsensitive = new Set<string>()
		if (reservation === 'first') {
			array.forEach((element) => {
				if (!elementIndexSetCaseInsensitive.has(element.toLowerCase())) {
					elementIndexSetCaseInsensitive.add(element.toLowerCase())
					arrayReturned.push(element)
				}
			})
		} else if (reservation === 'last') {
			// 倒序遍历, 避免出现空位. 倒序遍历 i --
			for (let i = array.length - 1; i >= 0; i--) {
				// 如果之前没有出现, 就添加, 反之无操作
				if (!elementIndexSetCaseInsensitive.has(array[i])) {
					elementIndexSetCaseInsensitive.add(array[i])
					arrayReturned.push(array[i])
				}
			}
			arrayReturned.reverse()
		}
	}

	return arrayReturned
}

export function isNonEmptyArray (array: any): boolean {
	return Array.isArray(array) && array.length > 0
}

export function setToArray<T> (set: Set<T>): Array<T> {
	return Array.from(set)
}


