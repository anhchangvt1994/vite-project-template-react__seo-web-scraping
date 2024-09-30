'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
function _optionalChain(ops) {
	let lastAccessLHS = undefined
	let value = ops[0]
	let i = 1
	while (i < ops.length) {
		const op = ops[i]
		const fn = ops[i + 1]
		i += 2
		if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) {
			return undefined
		}
		if (op === 'access' || op === 'optionalAccess') {
			lastAccessLHS = value
			value = fn(value)
		} else if (op === 'call' || op === 'optionalCall') {
			value = fn((...args) => value.call(lastAccessLHS, ...args))
			lastAccessLHS = undefined
		}
	}
	return value
}
var _chromiummin = require('@sparticuz/chromium-min')
var _chromiummin2 = _interopRequireDefault(_chromiummin)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)

var _constants = require('../../constants')

var _constants3 = require('../../puppeteer-ssr/constants')
var _store = require('../../store')
var _ConsoleHandler = require('../ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _InitEnv = require('../InitEnv')
var _WorkerManager = require('../WorkerManager')
var _WorkerManager2 = _interopRequireDefault(_WorkerManager)

const { isMainThread } = require('worker_threads')

const workerManager = (() => {
	if (!isMainThread) return
	return _WorkerManager2.default.init(
		_path2.default.resolve(
			__dirname,
			`./FollowResource.worker/index.${_constants.resourceExtension}`
		),
		{
			minWorkers: 1,
			maxWorkers: 5,
		},
		[
			'scanToCleanBrowsers',
			'scanToCleanPages',
			'scanToCleanAPIDataCache',
			'deleteResource',
		]
	)
})()

const cleanBrowsers = (() => {
	let executablePath
	return async (expiredTime = _InitEnv.PROCESS_ENV.RESET_RESOURCE ? 0 : 1) => {
		if (!isMainThread || process.env.DISABLE_INTERNAL_CRAWLER || !workerManager)
			return

		const browserStore = (() => {
			const tmpBrowserStore = _store.getStore.call(void 0, 'browser')
			return tmpBrowserStore || {}
		})()
		const promiseStore = (() => {
			const tmpPromiseStore = _store.getStore.call(void 0, 'promise')
			return tmpPromiseStore || {}
		})()

		if (_constants3.canUseLinuxChromium && !promiseStore.executablePath) {
			_ConsoleHandler2.default.log('Create executablePath')
			promiseStore.executablePath = _chromiummin2.default.executablePath(
				_constants3.chromiumPath
			)
		}

		_store.setStore.call(void 0, 'browser', browserStore)
		_store.setStore.call(void 0, 'promise', promiseStore)

		if (!executablePath && promiseStore.executablePath) {
			executablePath = await promiseStore.executablePath
		}

		const freePool = await workerManager.getFreePool()
		const pool = freePool.pool

		browserStore.executablePath = executablePath

		try {
			await pool.exec('scanToCleanBrowsers', [
				_constants.userDataPath,
				expiredTime,
				browserStore,
			])
		} catch (err) {
			_ConsoleHandler2.default.error(err)
		}

		freePool.terminate({
			force: true,
		})

		if (!_constants.SERVER_LESS)
			setTimeout(() => {
				exports.cleanBrowsers.call(void 0, 5)
			}, 300000)

		if (process.env.MODE === 'development')
			_optionalChain([exports.cleanBrowsers, 'optionalCall', (_) => _(0)])
		else
			_optionalChain([exports.cleanBrowsers, 'optionalCall', (_2) => _2(360)])
	}
})()
exports.cleanBrowsers = cleanBrowsers // cleanBrowsers

const cleanPages = (() => {
	return async () => {
		if (!isMainThread || !workerManager) return

		const freePool = await workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanPages', [_constants.pagesPath])
		} catch (err) {
			_ConsoleHandler2.default.error(err)
		}

		freePool.terminate({
			force: true,
		})

		if (!_constants.SERVER_LESS) {
			setTimeout(() => {
				exports.cleanPages.call(void 0)
			}, 1800000)
		}
	}
})()
exports.cleanPages = cleanPages // cleanPages

const cleanAPIDataCache = (() => {
	return async () => {
		if (!isMainThread || !workerManager) return

		const freePool = await workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanAPIDataCache', [_constants.dataPath])
		} catch (err) {
			_ConsoleHandler2.default.error(err)
		}

		freePool.terminate({
			force: true,
		})

		if (!_constants.SERVER_LESS) {
			setTimeout(() => {
				exports.cleanAPIDataCache.call(void 0)
			}, 30000)
		}
	}
})()
exports.cleanAPIDataCache = cleanAPIDataCache // cleanAPIDataCache

const cleanAPIStoreCache = (() => {
	return async () => {
		if (!isMainThread || !workerManager) return

		const freePool = await workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanAPIStoreCache', [_constants.storePath])
		} catch (err) {
			_ConsoleHandler2.default.error(err)
		}

		freePool.terminate({
			force: true,
		})

		if (!_constants.SERVER_LESS) {
			setTimeout(() => {
				exports.cleanAPIStoreCache.call(void 0)
			}, 30000)
		}
	}
})()
exports.cleanAPIStoreCache = cleanAPIStoreCache // cleanAPIStoreCache

const cleanOther = (() => {
	return async () => {
		if (!isMainThread || !workerManager) return

		const clean = async (path) => {
			if (!path) return

			const freePool = await workerManager.getFreePool()
			const pool = freePool.pool

			return pool.exec('deleteResource', [path]).finally(() => {
				freePool.terminate({
					force: true,
				})
			})
		}

		try {
			await Promise.all([
				clean(`${_constants.userDataPath}/wsEndpoint.txt`),
				clean(`${_constants.workerManagerPath}/counter.txt`),
			])
		} catch (err) {
			_ConsoleHandler2.default.error(err)
		}
	}
})()
exports.cleanOther = cleanOther
