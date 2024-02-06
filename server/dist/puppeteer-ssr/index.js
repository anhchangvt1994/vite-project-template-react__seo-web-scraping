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
var _zlib = require('zlib')
var _constants = require('../constants')
var _serverconfig = require('../server.config')
var _serverconfig2 = _interopRequireDefault(_serverconfig)

var _CleanerService = require('../utils/CleanerService')
var _CleanerService2 = _interopRequireDefault(_CleanerService)
var _ConsoleHandler = require('../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _CookieHandler = require('../utils/CookieHandler')
var _InitEnv = require('../utils/InitEnv')
var _constants3 = require('./constants')
var _ForamatUrl = require('./utils/ForamatUrl')
var _ISRGeneratornext = require('./utils/ISRGenerator.next')
var _ISRGeneratornext2 = _interopRequireDefault(_ISRGeneratornext)
var _ISRHandler = require('./utils/ISRHandler')
var _ISRHandler2 = _interopRequireDefault(_ISRHandler)

const _resetCookie = (res) => {
	_CookieHandler.setCookie.call(void 0, res, `BotInfo=;Max-Age=0;Path=/`)
	_CookieHandler.setCookie.call(
		void 0,
		res,
		`EnvironmentInfo=;Max-Age=0;Path=/`
	)
	_CookieHandler.setCookie.call(void 0, res, `DeviceInfo=;Max-Age=0;Path=/`)
} // _resetCookie

const puppeteerSSRService = (async () => {
	let _app
	const webScrapingService = 'web-scraping-service'
	const cleanerService = 'cleaner-service'

	const _allRequestHandler = () => {
		if (_constants.SERVER_LESS) {
			_app
				.get('/web-scraping', async function (req, res) {
					if (req.headers.authorization !== webScrapingService)
						return res
							.status(200)
							.send(
								'Welcome to MTr Web Scraping Service, please provide authorization to use it.'
							)

					const startGenerating = Number(req.query.startGenerating)
					const isFirstRequest = !!req.query.isFirstRequest
					const url = req.query.url ? decodeURIComponent(req.query.url) : ''

					const result = await _ISRHandler2.default.call(void 0, {
						startGenerating,
						isFirstRequest,
						url,
					})

					res.status(200).send(result || {})
				})
				.post('/cleaner-service', async function (req, res) {
					if (req.headers.authorization !== cleanerService)
						return res
							.status(200)
							.send(
								'Welcome to MTr Cleaner Service, please provide authorization to use it.'
							)
					else if (!_constants.SERVER_LESS)
						return res
							.status(200)
							.send(
								'MTr cleaner service can not run in none serverless environment'
							)

					await _CleanerService2.default.call(void 0)

					_ConsoleHandler2.default.log('Finish clean service!')

					res.status(200).send('Finish clean service!')
				})
		}
		_app.get('*', async function (req, res, next) {
			const pathname = _optionalChain([
				req,
				'access',
				(_) => _.url,
				'optionalAccess',
				(_2) => _2.split,
				'call',
				(_3) => _3('?'),
				'access',
				(_4) => _4[0],
			])
			const cookies = _CookieHandler.getCookieFromResponse.call(void 0, res)
			const botInfo = _optionalChain([
				cookies,
				'optionalAccess',
				(_5) => _5['BotInfo'],
			])
			const enableISR =
				_serverconfig2.default.isr.enable &&
				Boolean(
					!_serverconfig2.default.isr.routes ||
						!_serverconfig2.default.isr.routes[pathname] ||
						_serverconfig2.default.isr.routes[pathname].enable
				)
			const headers = req.headers
			const enableContentEncoding = Boolean(headers['accept-encoding'])
			const contentEncoding = (() => {
				const tmpHeaderAcceptEncoding = headers['accept-encoding'] || ''
				if (tmpHeaderAcceptEncoding.indexOf('br') !== -1) return 'br'
				else if (tmpHeaderAcceptEncoding.indexOf('gzip') !== -1) return 'gzip'
				return ''
			})()

			_ConsoleHandler2.default.log('<---puppeteer/index.uws.ts--->')
			_ConsoleHandler2.default.log(
				'enableContentEncoding: ',
				enableContentEncoding
			)
			_ConsoleHandler2.default.log(
				`headers['accept-encoding']: `,
				headers['accept-encoding']
			)
			_ConsoleHandler2.default.log('contentEncoding: ', contentEncoding)
			_ConsoleHandler2.default.log('<---puppeteer/index.uws.ts--->')

			res.set({
				'Content-Type':
					headers.accept === 'application/json'
						? 'application/json'
						: 'text/html; charset=utf-8',
			})

			if (
				_constants.IS_REMOTE_CRAWLER &&
				((_serverconfig2.default.crawlerSecretKey &&
					req.query.crawlerSecretKey !==
						_serverconfig2.default.crawlerSecretKey) ||
					(!botInfo.isBot && _constants3.DISABLE_SSR_CACHE))
			) {
				return res.status(403).send('403 Forbidden')
			}

			if (
				_InitEnv.ENV_MODE !== 'development' &&
				enableISR &&
				req.headers.service !== 'puppeteer'
			) {
				const url = _ForamatUrl.convertUrlHeaderToQueryString.call(
					void 0,
					_ForamatUrl.getUrl.call(void 0, req),
					res,
					!botInfo.isBot
				)

				if (!req.headers['redirect'] && botInfo.isBot) {
					try {
						const result = await _ISRGeneratornext2.default.call(void 0, {
							url,
						})

						if (result) {
							/**
							 * NOTE
							 * calc by using:
							 * https://www.inchcalculator.com/convert/year-to-second/
							 */
							res.set({
								'Server-Timing': `Prerender;dur=50;desc="Headless render time (ms)"`,
								// 'Cache-Control': 'public, max-age: 31556952',
								'Cache-Control': 'no-store',
							})

							res.status(result.status)

							if (enableContentEncoding && result.status === 200) {
								res.set({
									'Content-Encoding': contentEncoding,
								})
							}

							if (result.status === 503) res.set('Retry-After', '120')
						} else {
							next(new Error('504 Gateway Timeout'))
							return
						}

						if (
							(_constants3.CACHEABLE_STATUS_CODE[result.status] ||
								result.status === 503) &&
							result.response
						) {
							const body = (() => {
								let tmpBody = ''

								if (enableContentEncoding) {
									tmpBody = result.html
										? contentEncoding === 'br'
											? _zlib.brotliCompressSync.call(void 0, result.html)
											: contentEncoding === 'gzip'
											? _zlib.gzipSync.call(void 0, result.html)
											: result.html
										: (() => {
												let tmpContent = _fs2.default.readFileSync(
													result.response
												)

												if (contentEncoding === 'br') return tmpContent
												else
													tmpContent = _zlib.brotliDecompressSync
														.call(void 0, tmpContent)
														.toString()

												if (result.status === 200) {
													if (contentEncoding === 'gzip')
														tmpContent = _zlib.gzipSync.call(void 0, tmpContent)
												}

												return tmpContent
										  })()
								} else if (result.response.indexOf('.br') !== -1) {
									const content = _fs2.default.readFileSync(result.response)

									tmpBody = _zlib.brotliDecompressSync
										.call(void 0, content)
										.toString()
								} else {
									tmpBody = _fs2.default.readFileSync(result.response)
								}

								return tmpBody
							})()

							res.send(body)
						}
						// Serve prerendered page as response.
						else {
							const body = (() => {
								let tmpBody
								if (enableContentEncoding) {
									tmpBody = result.html
										? contentEncoding === 'br'
											? _zlib.brotliCompressSync.call(void 0, result.html)
											: contentEncoding === 'gzip'
											? _zlib.gzipSync.call(void 0, result.html)
											: result.html
										: _fs2.default.readFileSync(result.response)
								}

								tmpBody = result.html || `${result.status} Error`

								return tmpBody
							})()
							res.send(body) // Serve prerendered page as response.
						}
					} catch (err) {
						_ConsoleHandler2.default.error('url', url)
						_ConsoleHandler2.default.error(err)
						next(err)
					}

					return
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

			/**
			 * NOTE
			 * Cache-Control max-age is 1 year
			 * calc by using:
			 * https://www.inchcalculator.com/convert/year-to-second/
			 */
			if (headers.accept === 'application/json') {
				// NOTE - If header accept application/json (pre-ISR generate static file when user enter and navigate), system will reset cookies to ensure that cookie doesn't exist in these cases
				_resetCookie(res)
				res
					.set({
						'Cache-Control': 'no-store',
					})
					.send(
						req.headers['redirect']
							? JSON.parse(req.headers['redirect'])
							: { status: 200, originPath: pathname, path: pathname }
					)
			} else {
				const filePath =
					req.headers['static-html-path'] ||
					_path2.default.resolve(__dirname, '../../../dist/index.html')

				res
					.set({
						// 'Cache-Control': 'public, max-age: 31556952',
						'Cache-Control': 'no-store',
					})
					.status(200)
					.sendFile(filePath, { etag: false, lastModified: false }) // Serve prerendered page as response.
			}
		})

		// Hàm middleware xử lý lỗi cuối cùng
		_app.use(function (err, req, res, next) {
			_ConsoleHandler2.default.error(err.stack)
			res.status(504).send('504 Gateway Timeout')
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
