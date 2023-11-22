import { InspectOptions } from 'node:util'
import { ENABLE_CONSOLE_DEBUGGER } from '../constants'

export interface IConsole {
	assert(condition: any, ...data: any[]): void
	clear(): void
	count(label?: string): void
	debug(...data: any[]): void
	dir(item?: any, options?: InspectOptions): void
	dirxml(...data: any[]): void
	error(...data: any[]): void
	group(...data: any[]): void
	groupCollapsed(...data: any[]): void
	groupEnd(): void
	info(...data: any[]): void
	log(...data: any[]): void
	memory?: any
	profile(label?: string): void
	profileEnd(label?: string): void
	table(tabularData: any, properties?: string[]): void
	time(label?: string): void
	timeEnd(label?: string): void
	timeStamp(label?: string): void
	trace(...data: any[]): void
	warn(...data: any[]): void
}

const Console = (() => {
	if (ENABLE_CONSOLE_DEBUGGER) return console
	const consoleFormatted = {}
	for (const key in console) {
		consoleFormatted[key] = () => {}
	}

	return consoleFormatted as Console
})()

export default Console
