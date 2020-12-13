import { doubleFigures } from './OrderNumberUtil'

export type StandardFormatParameter = {
	date: Date
	separator?: string
	separatorDate?: string
	separatorTime?: string
}

export function standardFormat ({
	date,
	separator = ` `,
	separatorDate = `-`,
	separatorTime = `:`
}: StandardFormatParameter): string {

	if (!date) {
		console.log('[Error] Wrong date!')
		return ``
	} else {
		let fullYear = date.getFullYear()
		// getMonth() value: 0 ~ 11
		let month = date.getMonth()
		// getDay() value: 0 ~ 6, 0 means Sunday
		// let day = date.getDay()
		// getDay() value: 1 ~ 31
		let day = date.getDate()
		let hours = date.getHours()
		let minutes = date.getMinutes()
		let seconds = date.getSeconds()
		let dateString = `${fullYear}${separatorDate}${doubleFigures(
			month + 1
		)}${separatorDate}${doubleFigures(day)}`
		let timeString = `${doubleFigures(hours)}${separatorTime}${doubleFigures(
			minutes
		)}${separatorTime}${doubleFigures(seconds)}`
		return `${dateString}${separator}${timeString}`
	}
}

export function datetimeForFilename (date: Date): string {
	return standardFormat({
		date,
		separator: `_`,
		separatorDate: `-`,
		separatorTime: `-`
	}) + '_' + date.getMilliseconds()
}

export function nowForFilename (): string {
	let date = new Date()
	return datetimeForFilename(date)
}

export function addDay (date: Date, num: number): Date {
	let days = num * 24 * 60 * 60 * 1000
	date.setTime(date.getTime() + days)
	return date
}

export function subtractDay (date: Date, num: number): Date {
	let days = num * 24 * 60 * 60 * 1000
	date.setTime(date.getTime() - days)
	return date
}

export function getYesterday (date: Date): Date {
	return subtractDay(date, 1)
}

export function getTomorrow (date: Date): Date {
	return addDay(date, 1)
}

export function isLeapYear (arg: Date | string): boolean {
	let fullYear
	if (arg instanceof Date) {
		fullYear = arg.getFullYear()
	} else {
		fullYear = parseInt(arg)
	}
	if (!fullYear) return false

	if (fullYear % 100 === 0) {
		return fullYear % 400 === 0
	} else {
		return fullYear % 4 === 0
	}
}





