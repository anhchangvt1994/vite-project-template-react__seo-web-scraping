'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
function _nullishCoalesce(lhs, rhsFn) {
	if (lhs != null) {
		return lhs
	} else {
		return rhsFn()
	}
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
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _puppeteercore = require('puppeteer-core')
var _puppeteercore2 = _interopRequireDefault(_puppeteercore)
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)
var _constants = require('../../constants')
var _ConsoleHandler = require('../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)

var _constants3 = require('../constants')

var _utils = require('./Cache.worker/utils')

const chromium = require('@sparticuz/chromium-min')

const MAX_WORKERS = process.env.MAX_WORKERS
	? Number(process.env.MAX_WORKERS)
	: 7

const serverInfoPath = _path2.default.resolve(
	__dirname,
	'../../../server-info.json'
)
let serverInfoStringify

if (_fs2.default.existsSync(serverInfoPath)) {
	serverInfoStringify = _fs2.default.readFileSync(serverInfoPath)
}

let serverInfo
if (serverInfoStringify) {
	try {
		serverInfo = JSON.parse(serverInfoStringify)
	} catch (err) {
		console.error(err)
	}
}

exports.default = (() => {
	const litmitEmptyContentDuration = process.env.BROWSERLESS_API_KEY
		? 1800000
		: 150000

	const _init = ({
		userDataDir = () => `${_constants.userDataPath}/user_data`,
	}) => {
		const deleteUserDataDir = async (path) => {
			if (path) {
				try {
					_optionalChain([
						_workerpool2.default,
						'access',
						(_) => _.pool,
						'call',
						(_2) =>
							_2(
								__dirname +
									`./FollowResource.worker/index.${_constants.resourceExtension}`
							),
						'optionalAccess',
						(_3) => _3.exec,
						'call',
						(_4) => _4('deleteResource', [path]),
					])
				} catch (err) {
					_ConsoleHandler2.default.error(err)
				}
			}
		} // deleteUserDataDir

		const cache = (() => {
			const get = async (url) => {
				const pool = _workerpool2.default.pool(
					__dirname + `/Cache.worker/index.${_constants.resourceExtension}`,
					{
						minWorkers: 1,
						maxWorkers: MAX_WORKERS,
					}
				)

				try {
					const result = await pool.exec('get', [url])
					return result
				} catch (err) {
					_ConsoleHandler2.default.error(err)
					return
				} finally {
					pool.terminate()
				}
			} // get

			const achieve = async (url) => {
				if (!url) {
					_ConsoleHandler2.default.error('Need provide "url" param!')
					return
				}

				const key = _utils.getKey.call(void 0, url)
				let file = `${_constants.pagesPath}/${key}.html`
				let isRaw = false

				if (!_fs2.default.existsSync(file)) {
					file = `${_constants.pagesPath}/${key}.raw.html`
					isRaw = true
				}

				if (!_fs2.default.existsSync(file)) return

				const info = await _utils.getFileInfo.call(void 0, file)

				if (!info || info.size === 0) return

				await _utils.setRequestTimeInfo.call(void 0, file, new Date())

				return {
					file,
					response: file,
					createdAt: info.createdAt,
					updatedAt: info.updatedAt,
					requestedAt: new Date(),
					ttRenderMs: 200,
					available: true,
					isInit: false,
					isRaw,
				}
			} // achieve

			const set = async (params) => {
				const pool = _workerpool2.default.pool(
					__dirname + `/Cache.worker/index.${_constants.resourceExtension}`,
					{
						minWorkers: 1,
						maxWorkers: MAX_WORKERS,
					}
				)

				try {
					const result = await pool.exec('set', [params])
					return result
				} catch (err) {
					_ConsoleHandler2.default.error(err)
					return
				} finally {
					pool.terminate()
				}
			} // set

			const clean = async (file, options) => {
				const { fail, ...restOfOptions } = options

				const schedule = options.schedule || 30000

				setTimeout(async () => {
					const followFileWithSchedulePool = _workerpool2.default.pool(
						__dirname +
							`./FollowResource.worker/index.${_constants.resourceExtension}`,
						{
							minWorkers: 1,
							maxWorkers: MAX_WORKERS,
						}
					)

					try {
						const result = await followFileWithSchedulePool.exec(
							'checkToCleanFile',
							[file, restOfOptions]
						)
						followFileWithSchedulePool.terminate()
						_optionalChain([
							fail,
							'optionalCall',
							(_5) => _5(result, () => clean(file, options)),
						])
						return result
					} catch (err) {
						_ConsoleHandler2.default.error(err)
						followFileWithSchedulePool.terminate()
						_optionalChain([
							fail,
							'optionalCall',
							(_6) => _6(false, () => clean(file, options)),
						])
						return false
					}
				}, schedule)
			} // clean

			return {
				achieve,
				get,
				set,
				clean,
			}
		})() // cache

		const browserInit = (() => {
			const maxRequestPerBrowser = 20
			let totalRequests = 0
			let browserLaunch
			// puppeteer.defaultArgs(defaultBrowserOptions)

			const __launch = async () => {
				totalRequests = 0
				// if (process.env.BROWSERLESS_API_KEY && Boolean(browserLaunch)) return

				const selfUserDataDirPath = userDataDir()

				browserLaunch = new Promise(async (res, rej) => {
					let isError = false
					let promiseBrowser
					try {
						// if (process.env.BROWSERLESS_API_KEY) {
						// 	promiseBrowser = puppeteer.connect({
						// 		browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`,
						// 	})
						// } else {
						// 	promiseBrowser = puppeteer.launch({
						// 		...defaultBrowserOptions,
						// 		userDataDir: selfUserDataDirPath,
						// 	})
						// }
						_ConsoleHandler2.default.log('Khởi động browser')
						promiseBrowser = await _puppeteercore2.default.launch({
							args: chromium.args,
							defaultViewport: await chromium.executablePath(
								'https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v116.0.0-pack.tar'
							),
							executablePath: serverInfo.chromiumExecutablePath,
							headless: chromium.headless,
						})

						console.log(await promiseBrowser.version())
					} catch (err) {
						isError = true
						_ConsoleHandler2.default.log('Khởi động browser thất bại')
						_ConsoleHandler2.default.error(err)
					} finally {
						if (isError) return rej(undefined)
						res(promiseBrowser)
					}
				})

				_ConsoleHandler2.default.log(browserLaunch)

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
								}, 30000)
								page.once('close', () => {
									clearTimeout(timeoutCloseTab)
									resolveCloseTab(null)
								})
							})

							tabsClosed++

							if (tabsClosed === 20) {
								browser.close()
								deleteUserDataDir(selfUserDataDirPath)
							}
						})
					} catch (err) {
						_ConsoleHandler2.default.error(err)
					}
				}
			} // __launch()

			__launch()

			const _get = async () => {
				if (!_isReady()) {
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
					_ConsoleHandler2.default.log(await browser.version())
					page = await _optionalChain([
						browser,
						'optionalAccess',
						(_7) => _7.newPage,
						'optionalCall',
						(_8) => _8(),
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
		})() // browserInit

		const autoScroll = (() => {
			const _run = async (page) => {
				await page.evaluate(async () => {
					await new Promise((resolve) => {
						let totalHeight = 0
						const distance = 150
						let scrollHeight = document.body.scrollHeight
						const viewportHeight = document.documentElement.clientHeight

						if (scrollHeight - viewportHeight <= 150) resolve(null)

						const timer = setInterval(async () => {
							scrollHeight = document.body.scrollHeight
							window.scrollBy(0, distance)
							totalHeight += distance

							if (totalHeight >= scrollHeight) {
								clearInterval(timer)
								resolve(null)
							}
						}, 25)
					})
				})
			}

			return {
				run: _run,
			}
		})() // autoScroll

		const waitResponse = async (page, duration) => {
			await new Promise((resolve) => {
				let timeout
				const startTimeout = (customDuration = 0) => {
					if (timeout) clearTimeout(timeout)
					timeout = setTimeout(resolve, customDuration || duration)
				}

				startTimeout(500)

				page.on('requestfinished', () => {
					startTimeout()
				})
				page.on('requestservedfromcache', () => {
					startTimeout()
				})
				page.on('requestfailed', () => {
					startTimeout()
				})
			})
		} // waitResponse

		const handleRequest = async (url, isFirstRequest = false) => {
			_ConsoleHandler2.default.log('Bắt đầu tạo page mới')
			// const browser = await browserInit.get()
			const page = await _optionalChain([
				browserInit,
				'optionalAccess',
				(_9) => _9.newPage,
				'optionalCall',
				(_10) => _10(),
			])

			if (!page) return
			// const page = await browserServerLessInit.newPage()
			_ConsoleHandler2.default.log('Tạo page mới thành công')

			let html = ''
			let status = 200
			let isGetHtmlProcessError = false
			let isCompleteGetHtmlProcess = false

			const start = Date.now()
			try {
				// networkidle0 waits for the network to be idle (no requests for 500ms).
				// The page's JS has likely produced markup by this point, but wait longer
				// if your site lazy loads, etc.
				page.waitForNetworkIdle({ idleTime: 150 })
				await page.setRequestInterception(true)
				page.on('request', (req) => {
					const resourceType = req.resourceType()

					if (resourceType === 'stylesheet') {
						req.respond({ status: 200, body: 'aborted' })
					} else if (
						/(socket.io.min.js)+(?:$)|data:image\/[a-z]*.?\;base64/.test(url) ||
						/font|image|media|imageset/.test(resourceType)
					) {
						req.abort()
					} else {
						req.continue()
					}
				})

				const specialInfo = _nullishCoalesce(
					_optionalChain([
						_constants3.regexQueryStringSpecialInfo,
						'access',
						(_11) => _11.exec,
						'call',
						(_12) => _12(url),
						'optionalAccess',
						(_13) => _13.groups,
					]),
					() => ({})
				)

				await page.setExtraHTTPHeaders({
					...specialInfo,
					service: 'puppeteer',
				})

				isCompleteGetHtmlProcess = await new Promise(async (res) => {
					_ConsoleHandler2.default.log(`Bắt đầu crawl url: ${url}`)

					let response
					try {
						response = await page.goto(url, {
							waitUntil: 'domcontentloaded',
							timeout: 2500,
						})
					} catch (err) {
						page.close()
						isGetHtmlProcessError = true
						res(false)
						return _ConsoleHandler2.default.error(err)
					}

					status = _optionalChain([
						response,
						'optionalAccess',
						(_14) => _14.status,
						'call',
						(_15) => _15(),
					])

					_ConsoleHandler2.default.log('Domcontentloaded thành công!')
					_ConsoleHandler2.default.log(`Response status là: ${status}`)

					if (status !== 200) {
						return res(false)
					}

					if (isFirstRequest) {
						try {
							await page.waitForNavigation({
								waitUntil: 'load',
								timeout: 2500,
							})
						} catch (err) {
							if (err.name !== 'TimeoutError') {
								isGetHtmlProcessError = true
								_ConsoleHandler2.default.error(err)
							}
						} finally {
							if (isGetHtmlProcessError) {
								page.close()
								return res(false)
							}

							res(false)
						}
					}

					try {
						await page.waitForNavigation({
							waitUntil: 'networkidle2',
							timeout: 5000,
						})
					} catch (err) {
						if (err.name !== 'TimeoutError') {
							isGetHtmlProcessError = true
							_ConsoleHandler2.default.error(err)
						}
					} finally {
						if (isGetHtmlProcessError) {
							page.close()
							return res(false)
						}

						await new Promise((resolveAfterTimeout) => {
							const timeout = setTimeout(resolveAfterTimeout, 5000)
							waitResponse(page, 250).then(() => {
								clearTimeout(timeout)
								resolveAfterTimeout(null)
							})
						})

						if (!isFirstRequest) return res(true)

						try {
							html = await page.content() // serialized HTML of page DOM.
							page.close()
						} catch (err) {
							_ConsoleHandler2.default.error(err)
							page.close()
							isGetHtmlProcessError = true
							return res(false)
						}

						const optimizeHTMLContentPool = _workerpool2.default.pool(
							__dirname +
								`/OptimizeHtml.worker.${_constants.resourceExtension}`,
							{
								minWorkers: 1,
								maxWorkers: MAX_WORKERS,
							}
						)

						try {
							html = await optimizeHTMLContentPool.exec('compressContent', [
								html,
							])
							html = await optimizeHTMLContentPool.exec('optimizeContent', [
								html,
								true,
							])

							cache.set({
								html,
								url,
								isRaw: false,
							})
							optimizeHTMLContentPool.terminate()
						} catch (err) {
							_ConsoleHandler2.default.error(err)
							status = 500
							res(false)
							optimizeHTMLContentPool.terminate()
						}
					}
				})
			} catch (err) {
				_ConsoleHandler2.default.log('Page mới đã bị lỗi')
				_ConsoleHandler2.default.error(err)
				// throw new Error('page.goto/waitForSelector timed out.')
				return
			}

			if (isGetHtmlProcessError) return

			_ConsoleHandler2.default.log('Bắt đầu optimize nội dung file')

			const optimizeHTMLContentPool = _workerpool2.default.pool(
				__dirname + `/OptimizeHtml.worker.${_constants.resourceExtension}`,
				{
					minWorkers: 1,
					maxWorkers: MAX_WORKERS,
				}
			)

			try {
				html = await page.content() // serialized HTML of page DOM.
				if (isCompleteGetHtmlProcess) {
					page.close()
					html = await optimizeHTMLContentPool.exec('compressContent', [html])
				}
				html = await optimizeHTMLContentPool.exec('optimizeContent', [
					html,
					isCompleteGetHtmlProcess,
				])
			} catch (err) {
				_ConsoleHandler2.default.error(err)
			} finally {
				optimizeHTMLContentPool.terminate()
			}

			const ttRenderMs = Date.now() - start
			_ConsoleHandler2.default.info(
				`Headless rendered page in: ${ttRenderMs}ms`
			)

			const result = cache.set({
				html,
				url,
				isRaw: !isCompleteGetHtmlProcess,
			})

			return result
		} // handleRequest

		const SSRGenerator = async (url) => {
			let result
			result = await cache.achieve(url)

			if (result && !result.available) {
				const emptyContentDuration =
					Date.now() - new Date(result.updatedAt).getTime()
				if (emptyContentDuration > litmitEmptyContentDuration) {
					handleRequest(url)
				}
			} else if (!result) {
				result = await cache.get(url)

				_ConsoleHandler2.default.log(
					'Kiểm tra có đủ điều kiện tạo page mới không ?'
				)
				_ConsoleHandler2.default.log(
					'result.available',
					_optionalChain([result, 'optionalAccess', (_16) => _16.available])
				)

				if (result) {
					if (result.isInit && !result.available) {
						_ConsoleHandler2.default.log('Chuẩn bị tạo page mới')
						handleRequest(url, true)
					}

					if (result.isInit) {
						// NOTE - Cache will be cleaned 10 minutes if requestAt time to current time larger than 30 seconds
						cache.clean(result.file, {
							schedule: process.env.BROWSERLESS_API_KEY ? 1800000 : 300000,
							validRequestAtDuration: 120000,
							fail: (result, retry) => {
								if (result === 'update') {
									handleRequest(url)
									retry()
								}
							},
						})
					}
				}
			}

			_ConsoleHandler2.default.log('result', result)

			return result
		} // SSRGenerator

		return SSRGenerator
	} // _init

	return {
		init: _init,
	}
})()
