'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _constants = require('../constants')

var _CleanerService = require('../utils/CleanerService')
var _CleanerService2 = _interopRequireDefault(_CleanerService)
var _ConsoleHandler = require('../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _constants3 = require('./constants')
var _ForamatUrl = require('./utils/ForamatUrl')
var _SSRGeneratornext = require('./utils/SSRGenerator.next')
var _SSRGeneratornext2 = _interopRequireDefault(_SSRGeneratornext)
var _SSRHandler = require('./utils/SSRHandler')
var _SSRHandler2 = _interopRequireDefault(_SSRHandler)

const puppeteerSSRService = (async () => {
	let _app
	const ssrHandlerAuthorization = 'mtr-ssr-handler'
	const cleanerServiceAuthorization = 'mtr-cleaner-service'

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
			res.cookie('BotInfo', res.getHeader('Bot-Info'), {
				maxAge: 2000,
			})
			res.cookie('DeviceInfo', res.getHeader('Device-Info'), {
				maxAge: 2000,
			})
			const url = _ForamatUrl.convertUrlHeaderToQueryString.call(
				void 0,
				_ForamatUrl.getUrl.call(void 0, req),
				res,
				true
			)

			if (req.headers.service !== 'puppeteer') {
				if (botInfo.isBot) {
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

				try {
					if (_constants.SERVER_LESS) {
						await _SSRGeneratornext2.default.call(void 0, {
							url,
							isSkipWaiting: true,
						})
					} else {
						_SSRGeneratornext2.default.call(void 0, {
							url,
							isSkipWaiting: true,
						})
					}
				} catch (err) {
					_ConsoleHandler2.default.error('url', url)
					_ConsoleHandler2.default.error(err)
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
					req.headers.staticHtmlPath ||
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
			_allRequestHandler()
		},
	}
})()

exports.default = puppeteerSSRService
