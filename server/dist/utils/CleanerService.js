'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _chromiummin = require('@sparticuz/chromium-min')
var _chromiummin2 = _interopRequireDefault(_chromiummin)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)

var _constants = require('../constants')
var _constants3 = require('../puppeteer-ssr/constants')
var _serverconfig = require('../server.config')
var _serverconfig2 = _interopRequireDefault(_serverconfig)
var _store = require('../store')
var _ConsoleHandler = require('./ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _InitEnv = require('./InitEnv')
var _WorkerManager = require('./WorkerManager')
var _WorkerManager2 = _interopRequireDefault(_WorkerManager)

const workerManager = _WorkerManager2.default.init(
	_path2.default.resolve(
		__dirname,
		`./FollowResource.worker/index.${_constants.resourceExtension}`
	),
	{
		minWorkers: 1,
		maxWorkers: 4,
	},
	['scanToCleanBrowsers', 'scanToCleanPages', 'scanToCleanAPIDataCache']
)

const CleanerService = async () => {
	// NOTE - Browsers Cleaner
	const cleanBrowsers = (() => {
		let executablePath
		return async (
			durationValidToKeep = _InitEnv.PROCESS_ENV.RESET_RESOURCE ? 0 : 1
		) => {
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

			const freePool = workerManager.getFreePool()
			const pool = freePool.pool

			browserStore.executablePath = executablePath

			try {
				await pool.exec('scanToCleanBrowsers', [
					_constants.userDataPath,
					durationValidToKeep,
					browserStore,
				])
			} catch (err) {
				_ConsoleHandler2.default.error(err)
			} finally {
				freePool.terminate()

				if (!_constants.SERVER_LESS)
					setTimeout(() => {
						cleanBrowsers(5)
					}, 300000)
			}
		}
	})()

	// if (!SERVER_LESS) cleanBrowsers()
	if (process.env.MODE === 'development') cleanBrowsers(0)
	else cleanBrowsers(360)

	// NOTE - Pages Cleaner
	const cleanPages = async (
		durationValidToKeep = _InitEnv.PROCESS_ENV.RESET_RESOURCE ? 0 : 1
	) => {
		const freePool = workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanPages', [
				_constants.pagesPath,
				durationValidToKeep,
			])
		} catch (err) {
			_ConsoleHandler2.default.error(err)
		} finally {
			freePool.terminate()

			if (!_constants.SERVER_LESS) {
				const cacheTimeHour = _serverconfig2.default.crawl.cache.time / 3600

				setTimeout(() => {
					cleanPages(cacheTimeHour)
				}, 21600000)
			}
		}
	}

	if (process.env.MODE === 'development') cleanPages(0)
	else cleanPages(360)

	// NOTE - API Data Cache Cleaner
	const cleanAPIDataCache = async () => {
		const freePool = workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanAPIDataCache', [_constants.dataPath])
		} catch (err) {
			_ConsoleHandler2.default.error(err)
		} finally {
			freePool.terminate()

			if (!_constants.SERVER_LESS) {
				setTimeout(() => {
					cleanAPIDataCache()
				}, 10000)
			}
		}
	}

	if (process.env.MODE === 'development') cleanAPIDataCache()
	else cleanAPIDataCache()

	// NOTE - API Store Cache Cleaner
	const cleanAPIStoreCache = async () => {
		const freePool = workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanAPIStoreCache', [_constants.storePath])
		} catch (err) {
			_ConsoleHandler2.default.error(err)
		} finally {
			freePool.terminate()

			if (!_constants.SERVER_LESS) {
				setTimeout(() => {
					cleanAPIStoreCache()
				}, 10000)
			}
		}
	}

	if (process.env.MODE === 'development') cleanAPIStoreCache()
	else cleanAPIStoreCache()
}

if (!_constants.SERVER_LESS) CleanerService()

exports.default = CleanerService
