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
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)

var _constants = require('../constants')
var _DetectBot = require('../middlewares/uws/DetectBot')
var _DetectBot2 = _interopRequireDefault(_DetectBot)
var _DetectDevice = require('../middlewares/uws/DetectDevice')
var _DetectDevice2 = _interopRequireDefault(_DetectDevice)
var _DetectLocale = require('../middlewares/uws/DetectLocale')
var _DetectLocale2 = _interopRequireDefault(_DetectLocale)
var _DetectRedirect = require('../middlewares/uws/DetectRedirect')
var _DetectRedirect2 = _interopRequireDefault(_DetectRedirect)
var _DetectStatic = require('../middlewares/uws/DetectStatic')
var _DetectStatic2 = _interopRequireDefault(_DetectStatic)
var _serverconfig = require('../server.config')
var _serverconfig2 = _interopRequireDefault(_serverconfig)

var _CleanerService = require('../utils/CleanerService')
var _CleanerService2 = _interopRequireDefault(_CleanerService)
var _ConsoleHandler = require('../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _InitEnv = require('../utils/InitEnv')
var _constants3 = require('./constants')
var _ForamatUrluws = require('./utils/ForamatUrl.uws')
var _ISRGeneratornext = require('./utils/ISRGenerator.next')
var _ISRGeneratornext2 = _interopRequireDefault(_ISRGeneratornext)
var _ISRHandler = require('./utils/ISRHandler')
var _ISRHandler2 = _interopRequireDefault(_ISRHandler)

const COOKIE_EXPIRED_SECOND = _constants.COOKIE_EXPIRED / 1000
const ENVIRONMENT = JSON.stringify({
	ENV: _InitEnv.ENV,
	MODE: _InitEnv.MODE,
	ENV_MODE: _InitEnv.ENV_MODE,
})

const puppeteerSSRService = (async () => {
	let _app
	const webScrapingService = 'web-scraping-service'
	const cleanerService = 'cleaner-service'

	const _getResponseWithDefaultCookie = (res) => {
		res
			.writeHeader(
				'set-cookie',
				`EnvironmentInfo=${ENVIRONMENT};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
			)
			.writeHeader(
				'set-cookie',
				`BotInfo=${JSON.stringify(
					res.cookies.botInfo
				)};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
			)
			.writeHeader(
				'set-cookie',
				`DeviceInfo=${JSON.stringify(
					res.cookies.deviceInfo
				)};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
			)
			.writeHeader(
				'set-cookie',
				`LocaleInfo=${JSON.stringify(
					res.cookies.localeInfo
				)};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
			)

		return res
	} // _getResponseWithDefaultCookie

	const _allRequestHandler = () => {
		if (_constants.SERVER_LESS) {
			_app
				.get('/web-scraping', async function (res, req) {
					if (req.getHeader('authorization') !== webScrapingService)
						res
							.writeStatus('200')
							.end(
								'Welcome to MTr Web Scraping Service, please provide authorization to use it.',
								true
							)
					else {
						const startGenerating = Number(req.getQuery('startGenerating'))
						const isFirstRequest = !!req.getQuery('isFirstRequest')
						const url = req.getQuery('url') || ''

						res.onAborted(() => {
							_ConsoleHandler2.default.log('Request aborted')
						})

						const result = await _ISRHandler2.default.call(void 0, {
							startGenerating,
							isFirstRequest,
							url,
						})

						res.cork(() => {
							res
								.writeStatus('200')
								.end(result ? JSON.stringify(result) : '{}', true)
						})
					}
				})
				.post('/cleaner-service', async function (res, req) {
					if (req.getHeader('authorization') !== cleanerService)
						res
							.writeStatus('200')
							.end(
								'Welcome to MTr Cleaner Service, please provide authorization to use it.',
								true
							)
					else if (!_constants.SERVER_LESS)
						res
							.writeStatus('200')
							.end(
								'MTr cleaner service can not run in none serverless environment'
							)
					else {
						res.onAborted(() => {
							_ConsoleHandler2.default.log('Request aborted')
						})

						await _CleanerService2.default.call(void 0)

						_ConsoleHandler2.default.log('Finish clean service!')

						res.cork(() => {
							res.writeStatus('200').end('Finish clean service!', true)
						})
					}
				})
		}
		_app.get('/*', async function (res, req) {
			// NOTE - Check and create base url
			if (!_InitEnv.PROCESS_ENV.BASE_URL)
				_InitEnv.PROCESS_ENV.BASE_URL = `${
					req.getHeader('x-forwarded-proto')
						? req.getHeader('x-forwarded-proto')
						: 'http'
				}://${req.getHeader('host')}`

			_DetectStatic2.default.call(void 0, res, req)

			// NOTE - Check if static will send static file
			if (res.writableEnded) return

			// NOTE - Detect, setup BotInfo and LocaleInfo
			_DetectBot2.default.call(void 0, res, req)
			_DetectLocale2.default.call(void 0, res, req)

			const botInfo = _optionalChain([
				res,
				'access',
				(_) => _.cookies,
				'optionalAccess',
				(_2) => _2.botInfo,
			])

			if (
				_constants.IS_REMOTE_CRAWLER &&
				((_serverconfig2.default.crawlerSecretKey &&
					req.getQuery('crawlerSecretKey') !==
						_serverconfig2.default.crawlerSecretKey) ||
					(!botInfo.isBot && _constants3.DISABLE_SSR_CACHE))
			) {
				return res.writeStatus('403').end('403 Forbidden', true)
			}

			// NOTE - Check redirect or not
			const isRedirect = _DetectRedirect2.default.call(void 0, res, req)

			/**
			 * NOTE
			 * - We need crawl page although this request is not a bot
			 * When we request by enter first request, redirect will checked and will redirect immediately in server. But when we change router in client side, the request will be a extra fetch from client to server to check redirect information, in this case redirect will run in client not server and won't any request call to server after client run redirect. So we need crawl page in server in the first fetch request that client call to server (if header.accept is 'application/json' then it's fetch request from client)
			 */
			if (
				(res.writableEnded && botInfo.isBot) ||
				(isRedirect && req.getHeader('accept') !== 'application/json')
			)
				return

			// NOTE - Detect DeviceInfo
			_DetectDevice2.default.call(void 0, res, req)

			const enableISR =
				_serverconfig2.default.isr.enable &&
				Boolean(
					!_serverconfig2.default.isr.routes ||
						!_serverconfig2.default.isr.routes[req.getUrl()] ||
						_serverconfig2.default.isr.routes[req.getUrl()].enable ||
						!_serverconfig2.default.isr.routes[res.urlForCrawler] ||
						_serverconfig2.default.isr.routes[res.urlForCrawler].enable
				)

			if (
				_InitEnv.ENV_MODE !== 'development' &&
				enableISR &&
				req.getHeader('service') !== 'puppeteer'
			) {
				const url = _ForamatUrluws.convertUrlHeaderToQueryString.call(
					void 0,
					_ForamatUrluws.getUrl.call(void 0, res, req),
					res,
					!botInfo.isBot
				)

				if (botInfo.isBot) {
					res.onAborted(() => {
						_ConsoleHandler2.default.log('Request aborted')
					})

					try {
						const result = await _ISRGeneratornext2.default.call(void 0, {
							url,
						})

						res.cork(() => {
							if (result) {
								/**
								 * NOTE
								 * calc by using:
								 * https://www.inchcalculator.com/convert/year-to-second/
								 */
								res.writeStatus(String(result.status))

								if (result.status === 503) res.writeHeader('Retry-After', '120')

								// Add Server-Timing! See https://w3c.github.io/server-timing/.
								if (
									(_constants3.CACHEABLE_STATUS_CODE[result.status] ||
										result.status === 503) &&
									result.response
								) {
									try {
										res = _getResponseWithDefaultCookie(res)
										const body = result.html
											? result.html
											: _fs2.default.readFileSync(result.response)
										res.end(body, true)
									} catch (e) {
										res.writeStatus('404').end('Page not found!', true)
									}
								} else if (result.html) {
									if (result.status === 200) {
										res
											.writeHeader(
												'Server-Timing',
												`Prerender;dur=50;desc="Headless render time (ms)"`
											)
											.writeHeader('Cache-Control', 'no-store')
									}

									res.end(result.html || '', true)
								} else {
									res.end(`${result.status} Error`, true)
								}
							} else {
								res.writeStatus('504').end('504 Gateway Timeout', true)
							}
						})
					} catch (err) {
						_ConsoleHandler2.default.error('url', url)
						_ConsoleHandler2.default.error(err)
						// NOTE - Error: uWS.HttpResponse must not be accessed after uWS.HttpResponse.onAborted callback, or after a successful response. See documentation for uWS.HttpResponse and consult the user manual.
						res.writeStatus('500').end('Server Error!', true)
					}

					res.writableEnded = true
				} else if (
					!botInfo.isBot &&
					(!_constants3.DISABLE_SSR_CACHE || _serverconfig2.default.crawler)
				) {
					try {
						if (_constants.SERVER_LESS) {
							await _ISRGeneratornext2.default.call(void 0, {
								url,
								isSkipWaiting: true,
							})
						} else {
							_ISRGeneratornext2.default.call(void 0, {
								url,
								isSkipWaiting: true,
							})
						}
					} catch (err) {
						_ConsoleHandler2.default.error('url', url)
						_ConsoleHandler2.default.error(err)
					}
				}
			}

			if (!res.writableEnded) {
				/**
				 * NOTE
				 * Cache-Control max-age is 1 year
				 * calc by using:
				 * https://www.inchcalculator.com/convert/year-to-second/
				 */
				if (req.getHeader('accept') === 'application/json') {
					res.writeStatus('200')

					res = _getResponseWithDefaultCookie(res)
					res.end(
						JSON.stringify({
							status: 200,
							originPath: req.getUrl(),
							path: req.getUrl(),
						}),
						true
					)
				} else {
					const filePath =
						req.getHeader('static-html-path') ||
						_path2.default.resolve(__dirname, '../../../dist/index.html')

					try {
						const body = _fs2.default.readFileSync(filePath)
						res
							.writeStatus('200')
							.writeHeader(
								'Content-Type',
								req.getHeader('accept') === 'application/json'
									? 'application/json'
									: 'text/html; charset=utf-8'
							)
						res = _getResponseWithDefaultCookie(res)
						res
							.writeHeader('Cache-Control', 'no-store')
							.writeHeader('etag', 'false')
							.writeHeader('lastModified', 'false')

						// NOTE - Setup cookie information
						if (res.cookies.lang)
							res.writeHeader('set-cookie', `lang=${res.cookies.lang};Path=/`)
						if (res.cookies.country)
							res.writeHeader(
								'set-cookie',
								`country=${res.cookies.country};Path=/`
							)

						res.end(body, true)
					} catch (e2) {
						res
							.writeStatus('404')
							.writeHeader(
								'Content-Type',
								req.getHeader('accept') === 'application/json'
									? 'application/json'
									: 'text/html; charset=utf-8'
							)
							.end('File not found!', true)
					}
				}
			}
		})
	}

	return {
		init(app) {
			if (!app)
				return _ConsoleHandler2.default.warn('You need provide express app!')
			_app = app
			_allRequestHandler()
		},
	}
})()

exports.default = puppeteerSSRService
