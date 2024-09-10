import path from 'path'
import { resourceExtension } from '../../../constants'
import Console from '../../../utils/ConsoleHandler'
import WorkerManager from '../../../utils/WorkerManager'
import { PROCESS_ENV } from '../../../utils/InitEnv'

const workerManager = WorkerManager.init(
	path.resolve(__dirname, `./worker.${resourceExtension}`),
	{
		minWorkers: 1,
		maxWorkers: 2,
	},
	[
		'compressContent',
		'optimizeContent',
		'shallowOptimizeContent',
		'deepOptimizeContent',
	]
)

export const compressContent = async (html: string) => {
	if (!html || PROCESS_ENV.DISABLE_COMPRESS) return html

	const freePool = await workerManager.getFreePool({
		delay: 500,
	})
	const pool = freePool.pool
	let result

	try {
		result = await new Promise(async (res) => {
			const timeout = setTimeout(() => res(html), 5000)
			const tmpResult = await pool.exec('compressContent', [html])

			clearTimeout(timeout)

			res(tmpResult)
		})
	} catch (err) {
		Console.error(err)
		result = html
	}

	freePool.terminate({
		force: true,
		// delay: 0,
	})

	return result
} // compressContent

export const optimizeContent = async (
	html: string,
	isFullOptimize: boolean = false
) => {
	if (!html || PROCESS_ENV.DISABLE_OPTIMIZE) return html

	const freePool = await workerManager.getFreePool({
		delay: 500,
	})
	const pool = freePool.pool
	let result

	try {
		result = await new Promise(async (res) => {
			const timeout = setTimeout(() => res(html), 5000)
			const tmpResult = await pool.exec('optimizeContent', [
				html,
				isFullOptimize,
			])

			clearTimeout(timeout)

			res(tmpResult)
		})
	} catch (err) {
		Console.error(err)
		result = html
	}

	freePool.terminate({
		force: true,
		// delay: 0,
	})

	return result
} // compressContent

export const shallowOptimizeContent = async (html: string) => {
	if (!html || PROCESS_ENV.DISABLE_OPTIMIZE) return html

	const freePool = await workerManager.getFreePool({
		delay: 500,
	})
	const pool = freePool.pool
	let result

	try {
		result = await new Promise(async (res) => {
			const timeout = setTimeout(() => res(html), 5000)
			const tmpResult = await pool.exec('shallowOptimizeContent', [html])

			clearTimeout(timeout)

			res(tmpResult)
		})
	} catch (err) {
		Console.error(err)
		result = html
	}

	freePool.terminate({
		force: true,
		// delay: 0,
	})

	return result
} // shallowOptimizeContent

export const deepOptimizeContent = async (
	html: string,
	isFullOptimize: boolean = false
) => {
	if (!html || PROCESS_ENV.DISABLE_DEEP_OPTIMIZE) return html

	const freePool = await workerManager.getFreePool({
		delay: 500,
	})
	const pool = freePool.pool
	let result

	try {
		result = await new Promise(async (res) => {
			const timeout = setTimeout(() => res(html), 5000)
			const tmpResult = await pool.exec('deepOptimizeContent', [html])

			clearTimeout(timeout)

			res(tmpResult)
		})
	} catch (err) {
		Console.error(err)
		result = html
	}

	freePool.terminate({
		force: true,
		// delay: 0,
	})

	return result
} // compressContent
