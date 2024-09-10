'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _constants = require('../../../constants')
var _ConsoleHandler = require('../../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _WorkerManager = require('../../../utils/WorkerManager')
var _WorkerManager2 = _interopRequireDefault(_WorkerManager)
var _InitEnv = require('../../../utils/InitEnv')

const workerManager = _WorkerManager2.default.init(
	_path2.default.resolve(__dirname, `./worker.${_constants.resourceExtension}`),
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

const compressContent = async (html) => {
	if (!html || _InitEnv.PROCESS_ENV.DISABLE_COMPRESS) return html

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
		_ConsoleHandler2.default.error(err)
		result = html
	}

	freePool.terminate({
		force: true,
		// delay: 0,
	})

	return result
}
exports.compressContent = compressContent // compressContent

const optimizeContent = async (html, isFullOptimize = false) => {
	if (!html || _InitEnv.PROCESS_ENV.DISABLE_OPTIMIZE) return html

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
		_ConsoleHandler2.default.error(err)
		result = html
	}

	freePool.terminate({
		force: true,
		// delay: 0,
	})

	return result
}
exports.optimizeContent = optimizeContent // compressContent

const shallowOptimizeContent = async (html) => {
	if (!html || _InitEnv.PROCESS_ENV.DISABLE_OPTIMIZE) return html

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
		_ConsoleHandler2.default.error(err)
		result = html
	}

	freePool.terminate({
		force: true,
		// delay: 0,
	})

	return result
}
exports.shallowOptimizeContent = shallowOptimizeContent // shallowOptimizeContent

const deepOptimizeContent = async (html, isFullOptimize = false) => {
	if (!html || _InitEnv.PROCESS_ENV.DISABLE_DEEP_OPTIMIZE) return html

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
		_ConsoleHandler2.default.error(err)
		result = html
	}

	freePool.terminate({
		force: true,
		// delay: 0,
	})

	return result
}
exports.deepOptimizeContent = deepOptimizeContent // compressContent
