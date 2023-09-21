import { Express } from 'express'
import path from 'path'
import { SERVER_LESS } from '../constants'
import { IBotInfo } from '../types'
import CleanerService from '../utils/CleanerService'
import Console from '../utils/ConsoleHandler'
import { CACHEABLE_STATUS_CODE } from './constants'
import { convertUrlHeaderToQueryString, getUrl } from './utils/ForamatUrl'
import SSRGenerator from './utils/SSRGenerator.next'
import SSRHandler from './utils/SSRHandler'

const puppeteerSSRService = (async () => {
	let _app: Express
	const ssrHandlerAuthorization = 'mtr-ssr-handler'
	const cleanerServiceAuthorization = 'mtr-cleaner-service'

	const _allRequestHandler = () => {
		if (SERVER_LESS) {
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
					const url = req.query.url
						? (decodeURIComponent(req.query.url as string) as string)
						: ''

					const result = await SSRHandler({
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
					else if (!SERVER_LESS)
						return res
							.status(200)
							.send(
								'MTr cleaner service can not run in none serverless environment'
							)

					await CleanerService()

					Console.log('Finish clean service!')

					res.status(200).send('Finish clean service!')
				})
		}
		_app.get('*', async function (req, res, next) {
			const botInfoStringify = res.getHeader('Bot-Info') as string
			const botInfo: IBotInfo = JSON.parse(botInfoStringify)
			res.cookie('BotInfo', res.getHeader('Bot-Info'), {
				maxAge: 2000,
			})
			res.cookie('DeviceInfo', res.getHeader('Device-Info'), {
				maxAge: 2000,
			})
			const url = convertUrlHeaderToQueryString(getUrl(req), res, true)

			if (req.headers.service !== 'puppeteer') {
				if (botInfo.isBot) {
					try {
						const result = await SSRGenerator({
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
						if (CACHEABLE_STATUS_CODE[result.status] || result.status === 503)
							res.sendFile(result.response)
						// Serve prerendered page as response.
						else res.send(result.html || `${result.status} Error`) // Serve prerendered page as response.
					} catch (err) {
						Console.error('url', url)
						Console.error(err)
						next(err)
					} finally {
						return
					}
				}

				try {
					if (SERVER_LESS) {
						await SSRGenerator({
							url,
							isSkipWaiting: true,
						})
					} else {
						SSRGenerator({
							url,
							isSkipWaiting: true,
						})
					}
				} catch (err) {
					Console.error('url', url)
					Console.error(err)
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
					(req.headers.staticHtmlPath as string) ||
						path.resolve(__dirname, '../../../dist/index.html')
				) // Serve prerendered page as response.
		})

		// Hàm middleware xử lý lỗi cuối cùng
		_app.use(function (err, req, res, next) {
			Console.error(err.stack)
			res.status(504).send('504 Gateway Timeout')
		})
	}

	return {
		init(app: Express) {
			if (!app) return Console.warn('You need provide express app!')
			_app = app
			_allRequestHandler()
		},
	}
})()

export default puppeteerSSRService
