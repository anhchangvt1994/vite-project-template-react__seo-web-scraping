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
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _constants = require('../constants')

var _CleanerService = require('../utils/CleanerService')
var _CleanerService2 = _interopRequireDefault(_CleanerService)
var _ConsoleHandler = require('../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _CookieHandler = require('../utils/CookieHandler')
var _SendFile = require('../utils/SendFile')
var _SendFile2 = _interopRequireDefault(_SendFile)
var _constants3 = require('./constants')
var _ForamatUrl = require('./utils/ForamatUrl')
var _ISRGeneratornext = require('./utils/ISRGenerator.next')
var _ISRGeneratornext2 = _interopRequireDefault(_ISRGeneratornext)
var _ISRHandler = require('./utils/ISRHandler')
var _ISRHandler2 = _interopRequireDefault(_ISRHandler)
var _serverconfig = require('../server.config')
var _serverconfig2 = _interopRequireDefault(_serverconfig)

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

					const startGenerating = Number(
						_optionalChain([
							req,
							'access',
							(_) => _.query,
							'optionalAccess',
							(_2) => _2['startGenerating'],
						])
					)
					const isFirstRequest = !!_optionalChain([
						req,
						'access',
						(_3) => _3.query,
						'optionalAccess',
						(_4) => _4['isFirstRequest'],
					])
					const url = _optionalChain([
						req,
						'access',
						(_5) => _5.query,
						'optionalAccess',
						(_6) => _6['url'],
					])
						? decodeURIComponent(
								_optionalChain([
									req,
									'access',
									(_7) => _7.query,
									'optionalAccess',
									(_8) => _8['url'],
								])
						  )
						: ''

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
		_app.get('*', async function (req, res) {
			const pathname = _optionalChain([
				req,
				'access',
				(_9) => _9.url,
				'optionalAccess',
				(_10) => _10.split,
				'call',
				(_11) => _11('?'),
				'access',
				(_12) => _12[0],
			])
			const cookies = _CookieHandler.getCookieFromResponse.call(void 0, res)
			const botInfo = _optionalChain([
				cookies,
				'optionalAccess',
				(_13) => _13['BotInfo'],
			])
			const enableISR =
				_serverconfig2.default.isr.enable &&
				Boolean(
					!_serverconfig2.default.isr.routes ||
						!_serverconfig2.default.isr.routes[pathname] ||
						_serverconfig2.default.isr.routes[pathname].enable
				)
			const headers = req.headers

			res.raw.setHeader(
				'Content-Type',
				headers.accept === 'application/json'
					? 'application/json'
					: 'text/html; charset=utf-8'
			)

			if (
				_constants.ENV !== 'development' &&
				enableISR &&
				headers.service !== 'puppeteer'
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
							res.raw.setHeader(
								'Server-Timing',
								`Prerender;dur=50;desc="Headless render time (ms)"`
							)
							res.raw.setHeader('Cache-Control', 'no-store')
							res.raw.statusCode = result.status

							if (result.status === 503) res.header('Retry-After', '120')
						} else {
							return res.status(504).send('504 Gateway Timeout')
						}

						// Add Server-Timing! See https://w3c.github.io/server-timing/.
						if (
							(_constants3.CACHEABLE_STATUS_CODE[result.status] ||
								result.status === 503) &&
							result.response
						)
							return _SendFile2.default.call(void 0, result.response, res.raw)
						// Serve prerendered page as response.
						else return res.send(result.html || `${result.status} Error`) // Serve prerendered page as response.
					} catch (err) {
						_ConsoleHandler2.default.error('url', url)
						_ConsoleHandler2.default.error(err)
					}

					return
				} else if (!botInfo.isBot) {
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
			if (headers.accept === 'application/json')
				res
					.header('Cache-Control', 'no-store')
					.send(
						req.headers['redirect']
							? JSON.parse(req.headers['redirect'])
							: { status: 200, originPath: pathname, path: pathname }
					)
			else {
				const filePath =
					req.headers['static-html-path'] ||
					_path2.default.resolve(__dirname, '../../../dist/index.html')
				res.raw.setHeader('Cache-Control', 'no-store')
				return _SendFile2.default.call(void 0, filePath, res.raw)
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
