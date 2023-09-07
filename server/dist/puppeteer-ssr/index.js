'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _cors = require('cors')
var _cors2 = _interopRequireDefault(_cors)
var _express = require('express')
var _express2 = _interopRequireDefault(_express)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)

var _ConsoleHandler = require('../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _DetectBot = require('../utils/DetectBot')
var _DetectBot2 = _interopRequireDefault(_DetectBot)
var _DetectDevice = require('../utils/DetectDevice')
var _DetectDevice2 = _interopRequireDefault(_DetectDevice)
var _DetectStaticExtension = require('../utils/DetectStaticExtension')
var _DetectStaticExtension2 = _interopRequireDefault(_DetectStaticExtension)
var _constants = require('../constants')
var _ForamatUrl = require('./utils/ForamatUrl')
var _SSRGeneratornext = require('./utils/SSRGenerator.next')
var _SSRGeneratornext2 = _interopRequireDefault(_SSRGeneratornext)
var _SSRHandler = require('./utils/SSRHandler')
var _SSRHandler2 = _interopRequireDefault(_SSRHandler)
var _CleanerService = require('../utils/CleanerService')
var _CleanerService2 = _interopRequireDefault(_CleanerService)

var _constants3 = require('./constants')

const puppeteerSSRService = (async () => {
	let _app
	const ssrHandlerAuthorization = 'mtr-ssr-handler'
	const cleanerServiceAuthorization = 'mtr-cleaner-service'

	const _setupAppUse = () => {
		_app
			.use(_cors2.default.call(void 0))
			.use(
				'/robots.txt',
				_express2.default.static(
					_path2.default.resolve(__dirname, '../../robots.txt')
				)
			)
			.use(function (req, res, next) {
				const isStatic = _DetectStaticExtension2.default.call(void 0, req)
				/**
				 * NOTE
				 * Cache-Control max-age is 3 months
				 * calc by using:
				 * https://www.inchcalculator.com/convert/month-to-second/
				 */
				if (isStatic) {
					if (_constants.ENV !== 'development') {
						res.set('Cache-Control', 'public, max-age=7889238')
					}

					try {
						res
							.status(200)
							.sendFile(
								_path2.default.resolve(__dirname, `../../../dist/${req.url}`)
							)
					} catch (err) {
						res.status(404).send('File not found')
					}
				} else {
					next()
				}
			})
			.use(function (req, res, next) {
				if (!process.env.BASE_URL)
					process.env.BASE_URL = `${req.protocol}://${req.get('host')}`
				next()
			})
			.use(function (req, res, next) {
				let botInfo
				if (req.headers.service === 'puppeteer') {
					botInfo = req.headers['bot_info'] || ''
				} else {
					botInfo = JSON.stringify(_DetectBot2.default.call(void 0, req))
				}

				res.setHeader('Bot-Info', botInfo)
				next()
			})
			.use(function (req, res, next) {
				let deviceInfo
				if (req.headers.service === 'puppeteer') {
					deviceInfo = req.headers['device_info'] || ''
				} else {
					deviceInfo = JSON.stringify(_DetectDevice2.default.call(void 0, req))
				}

				res.setHeader('Device-Info', deviceInfo)
				next()
			})
	} // _setupAppUse

	const _allRequestHandler = () => {
		if (_constants.SERVER_LESS) {
			_app
				.get('/web-scraping', async function (req, res) {
					if (req.headers.authorization !== ssrHandlerAuthorization)
						return res
							.status(200)
							.send(
								'Welcome to MTr Web Scraping Service, please provide authorization to use it.'
							)

					const startGenerating = Number(req.query.startGenerating)
					const isFirstRequest = !!req.query.isFirstRequest
					const url = req.query.url ? decodeURIComponent(req.query.url) : ''

					const result = await _SSRHandler2.default.call(void 0, {
						startGenerating,
						isFirstRequest,
						url,
					})

					res.status(200).send(result || {})
				})
				.post('/cleaner-service', async function (req, res) {
					if (req.headers.authorization !== cleanerServiceAuthorization)
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
			const botInfoStringify = res.getHeader('Bot-Info')
			const botInfo = JSON.parse(botInfoStringify)

			if (req.headers.service !== 'puppeteer') {
				if (botInfo.isBot) {
					const url = _ForamatUrl.convertUrlHeaderToQueryString.call(
						void 0,
						_ForamatUrl.getUrl.call(void 0, req),
						res
					)

					try {
						const result = await _SSRGeneratornext2.default.call(void 0, {
							url,
						})

						if (result) {
							/**
							 * NOTE
							 * Cache-Control max-age is 1 year
							 * calc by using:
							 * https://www.inchcalculator.com/convert/year-to-second/
							 */
							res.set({
								'Server-Timing': `Prerender;dur=50;desc="Headless render time (ms)"`,
								'Content-Type': 'text/html',
								'Cache-Control': 'public, max-age: 31556952',
							})

							res.status(result.status)

							if (result.status === 503) res.set('Retry-After', '120')
						} else {
							next(new Error('504 Gateway Timeout'))
							return
						}

						// Add Server-Timing! See https://w3c.github.io/server-timing/.
						if (
							_constants3.CACHEABLE_STATUS_CODE[result.status] ||
							result.status === 503
						)
							res.sendFile(result.response)
						// Serve prerendered page as response.
						else res.send(result.html || `${result.status} Error`) // Serve prerendered page as response.
					} catch (err) {
						_ConsoleHandler2.default.error('url', url)
						_ConsoleHandler2.default.error(err)
						next(err)
					} finally {
						return
					}
				}

				if (_constants.ENV !== 'development') {
					const url = _ForamatUrl.convertUrlHeaderToQueryString.call(
						void 0,
						_ForamatUrl.getUrl.call(void 0, req),
						res,
						true
					)
					try {
						await _SSRGeneratornext2.default.call(void 0, {
							url,
							isSkipWaiting: true,
						})
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
			return res
				.set({
					'Content-Type': 'text/html',
					'Cache-Control': 'public, max-age: 31556952',
				})
				.status(200)
				.sendFile(
					req.headers['static_html_path'] ||
						_path2.default.resolve(__dirname, '../../../dist/index.html')
				) // Serve prerendered page as response.
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
			_setupAppUse()
			_allRequestHandler()
		},
	}
})()

exports.default = puppeteerSSRService
