'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _chromiummin = require('@sparticuz/chromium-min')
var _chromiummin2 = _interopRequireDefault(_chromiummin)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)

var _constants = require('../constants')
var _constants3 = require('../puppeteer-ssr/constants')
var _store = require('../store')
var _ConsoleHandler = require('./ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)

const CleanerService = async () => {
	// NOTE - Browsers Cleaner
	const cleanBrowsers = (() => {
		let executablePath
		return async (durationValidToKeep = process.env.RESET_RESOURCE ? 0 : 1) => {
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

			const pool = _workerpool2.default.pool(
				_path2.default.resolve(
					__dirname,
					`../puppeteer-ssr/utils/FollowResource.worker/index.${_constants.resourceExtension}`
				)
			)

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
				pool.terminate()

				if (!_constants.SERVER_LESS)
					setTimeout(() => {
						cleanBrowsers(5)
					}, 300000)
			}
		}
	})()

	if (!_constants.SERVER_LESS) cleanBrowsers()

	// NOTE - Pages Cleaner
	const cleanPages = async (
		durationValidToKeep = process.env.RESET_RESOURCE ? 0 : 1
	) => {
		const pool = _workerpool2.default.pool(
			_path2.default.resolve(
				__dirname,
				`../puppeteer-ssr/utils/FollowResource.worker/index.${_constants.resourceExtension}`
			)
		)

		try {
			await pool.exec('scanToCleanPages', [
				_constants.pagesPath,
				durationValidToKeep,
			])
		} catch (err) {
			_ConsoleHandler2.default.error(err)
		} finally {
			pool.terminate()

			if (!_constants.SERVER_LESS)
				setTimeout(() => {
					cleanPages(5)
				}, 300000)
		}
	}

	if (_constants.SERVER_LESS) cleanPages(10)
	else await cleanPages()
}

if (!_constants.SERVER_LESS) CleanerService()

exports.default = CleanerService
