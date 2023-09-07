import cors from 'cors'
import express, { Express } from 'express'
import path from 'path'
import { IBotInfo } from '../types'
import Console from '../utils/ConsoleHandler'
import detectBot from '../utils/DetectBot'
import detectDevice from '../utils/DetectDevice'
import detectStaticExtension from '../utils/DetectStaticExtension'
import { ENV } from '../constants'
import { convertUrlHeaderToQueryString, getUrl } from './utils/ForamatUrl'
import SSRGenerator from './utils/SSRGenerator.next'
import SSRHandler from './utils/SSRHandler'
import CleanerService from '../utils/CleanerService'
import { SERVER_LESS } from '../constants'
import { CACHEABLE_STATUS_CODE } from './constants'

const puppeteerSSRService = (async () => {
	let _app: Express
	const ssrHandlerAuthorization = 'mtr-ssr-handler'
	const cleanerServiceAuthorization = 'mtr-cleaner-service'

	const _setupAppUse = () => {
		_app
			.use(cors())
			.use(
				'/robots.txt',
				express.static(path.resolve(__dirname, '../../robots.txt'))
			)
			.use(function (req, res, next) {
				const isStatic = detectStaticExtension(req)
				/**
				 * NOTE
				 * Cache-Control max-age is 3 months
				 * calc by using:
				 * https://www.inchcalculator.com/convert/month-to-second/
				 */
				if (isStatic) {
					if (ENV !== 'development') {
						res.set('Cache-Control', 'public, max-age=7889238')
					}

					try {
						res
							.status(200)
							.sendFile(path.resolve(__dirname, `../../../dist/${req.url}`))
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
					botInfo = JSON.stringify(detectBot(req))
				}

				res.setHeader('Bot-Info', botInfo)
				next()
			})
			.use(function (req, res, next) {
				let deviceInfo
				if (req.headers.service === 'puppeteer') {
					deviceInfo = req.headers['device_info'] || ''
				} else {
					deviceInfo = JSON.stringify(detectDevice(req))
				}

				res.setHeader('Device-Info', deviceInfo)
				next()
			})
	} // _setupAppUse

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

			if (req.headers.service !== 'puppeteer') {
				if (botInfo.isBot) {
					const url = convertUrlHeaderToQueryString(getUrl(req), res)

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

				if (ENV !== 'development') {
					const url = convertUrlHeaderToQueryString(getUrl(req), res, true)
					try {
						await SSRGenerator({
							url,
							isSkipWaiting: true,
						})
					} catch (err) {
						Console.error('url', url)
						Console.error(err)
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
					(req.headers['static_html_path'] as string) ||
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
			_setupAppUse()
			_allRequestHandler()
		},
	}
})()

export default puppeteerSSRService
