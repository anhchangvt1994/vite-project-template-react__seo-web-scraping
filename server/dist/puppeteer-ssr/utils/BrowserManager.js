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

var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)

var _constants = require('../../constants')
var _ConsoleHandler = require('../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)

var _constants3 = require('../constants')

const canUseLinuxChromium =
	_constants.serverInfo &&
	_constants.serverInfo.isServer &&
	_constants.serverInfo.platform.toLowerCase() === 'linux'

const puppeteer = (() => {
	if (canUseLinuxChromium) return require('puppeteer-core')
	return require('puppeteer')
})()

const deleteUserDataDir = async (dir) => {
	if (dir) {
		try {
			_optionalChain([
				_workerpool2.default,
				'access',
				(_) => _.pool,
				'call',
				(_2) =>
					_2(
						_path2.default.resolve(
							__dirname,
							`./FollowResource.worker/index.${_constants.resourceExtension}`
						)
					),
				'optionalAccess',
				(_3) => _3.exec,
				'call',
				(_4) => _4('deleteResource', [dir]),
			])
		} catch (err) {
			_ConsoleHandler2.default.error(err)
		}
	}
}
exports.deleteUserDataDir = deleteUserDataDir // deleteUserDataDir

const BrowserManager = (
	userDataDir = () => `${_constants.userDataPath}/user_data`
) => {
	let executablePath

	const maxRequestPerBrowser = 20
	let totalRequests = 0
	let browserLaunch

	const __launch = async () => {
		totalRequests = 0

		const selfUserDataDirPath = userDataDir()

		browserLaunch = new Promise(async (res, rej) => {
			let isError = false
			let promiseBrowser
			try {
				if (canUseLinuxChromium && !executablePath) {
					_ConsoleHandler2.default.log('Tạo executablePath')
					executablePath = await _chromiummin2.default.executablePath(
						'https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v116.0.0-pack.tar'
					)
				}

				if (executablePath) {
					_ConsoleHandler2.default.log('Khởi động browser với executablePath')
					promiseBrowser = puppeteer.launch({
						..._constants3.defaultBrowserOptions,
						userDataDir: selfUserDataDirPath,
						args: _chromiummin2.default.args,
						executablePath,
					})
				} else {
					promiseBrowser = puppeteer.launch({
						..._constants3.defaultBrowserOptions,
						userDataDir: selfUserDataDirPath,
					})
				}
			} catch (err) {
				isError = true
				_ConsoleHandler2.default.error(err)
			} finally {
				if (isError) return rej(undefined)
				res(promiseBrowser)
			}
		})

		if (browserLaunch) {
			try {
				let tabsClosed = 0
				const browser = await browserLaunch

				browser.on('createNewPage', async (page) => {
					await new Promise((resolveCloseTab) => {
						const timeoutCloseTab = setTimeout(() => {
							if (!page.isClosed()) {
								page.close({
									runBeforeUnload: true,
								})
							}
							resolveCloseTab(null)
						}, 180000)
						page.once('close', () => {
							clearTimeout(timeoutCloseTab)
							resolveCloseTab(null)
						})
					})

					tabsClosed++

					if (!_constants.SERVER_LESS && tabsClosed === 20) {
						browser.close()
						exports.deleteUserDataDir.call(void 0, selfUserDataDirPath)
					}
				})
			} catch (err) {
				_ConsoleHandler2.default.error(err)
			}
		}
	} // __launch()

	if (_constants3.POWER_LEVEL === _constants3.POWER_LEVEL_LIST.THREE) {
		__launch()
	}

	const _get = async () => {
		if (!browserLaunch || !_isReady()) {
			__launch()
		}

		totalRequests++
		const curBrowserLaunch = browserLaunch

		await new Promise((res) => setTimeout(res, (totalRequests - 1) * 1000))

		return curBrowserLaunch
	} // _get

	const _newPage = async () => {
		let browser
		let page
		try {
			browser = await _get()
			page = await _optionalChain([
				browser,
				'optionalAccess',
				(_5) => _5.newPage,
				'optionalCall',
				(_6) => _6(),
			])
		} catch (err) {
			return
		}

		if (page) browser.emit('createNewPage', page)
		return page
	} // _newPage

	const _isReady = () => {
		return totalRequests <= maxRequestPerBrowser
	} // _isReady

	return {
		get: _get,
		newPage: _newPage,
		isReady: _isReady,
	}
}

exports.default = BrowserManager
