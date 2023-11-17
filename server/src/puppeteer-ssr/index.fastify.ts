import { FastifyInstance } from 'fastify'
import path from 'path'
import { ENV, SERVER_LESS } from '../constants'
import { IBotInfo } from '../types'
import CleanerService from '../utils/CleanerService'
import Console from '../utils/ConsoleHandler'
import { getCookieFromResponse } from '../utils/CookieHandler'
import sendFile from '../utils/SendFile'
import { CACHEABLE_STATUS_CODE } from './constants'
import { convertUrlHeaderToQueryString, getUrl } from './utils/ForamatUrl'
import ISRGenerator from './utils/ISRGenerator.next'
import ISRHandler from './utils/ISRHandler'
import ServerConfig from '../server.config'

const puppeteerSSRService = (async () => {
	let _app: FastifyInstance
	const webScrapingService = 'web-scraping-service'
	const cleanerService = 'cleaner-service'

	const _allRequestHandler = () => {
		if (SERVER_LESS) {
			_app
				.get('/web-scraping', async function (req, res) {
					if (req.headers.authorization !== webScrapingService)
						return res
							.status(200)
							.send(
								'Welcome to MTr Web Scraping Service, please provide authorization to use it.'
							)

					const startGenerating = Number(req.query?.['startGenerating'])
					const isFirstRequest = !!req.query?.['isFirstRequest']
					const url = req.query?.['url']
						? (decodeURIComponent(req.query?.['url'] as string) as string)
						: ''

					const result = await ISRHandler({
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
		_app.get('*', async function (req, res) {
			const pathname = req.url?.split('?')[0]
			const cookies = getCookieFromResponse(res)
			const botInfo: IBotInfo = cookies?.['BotInfo']
			const enableISR =
				ServerConfig.isr.enable &&
				Boolean(
					!ServerConfig.isr.routes ||
						!ServerConfig.isr.routes[pathname] ||
						ServerConfig.isr.routes[pathname].enable
				)
			const headers = req.headers

			res.raw.setHeader(
				'Content-Type',
				headers.accept === 'application/json'
					? 'application/json'
					: 'text/html; charset=utf-8'
			)

			if (
				ENV !== 'development' &&
				enableISR &&
				headers.service !== 'puppeteer'
			) {
				const url = convertUrlHeaderToQueryString(
					getUrl(req),
					res as any,
					!botInfo.isBot
				)
				if (!req.headers['redirect'] && botInfo.isBot) {
					try {
						const result = await ISRGenerator({
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
						if (CACHEABLE_STATUS_CODE[result.status] || result.status === 503)
							return sendFile(result.response, res.raw)
						// Serve prerendered page as response.
						else return res.send(result.html || `${result.status} Error`) // Serve prerendered page as response.
					} catch (err) {
						Console.error('url', url)
						Console.error(err)
					}

					return
				} else if (!botInfo.isBot) {
					try {
						if (SERVER_LESS) {
							await ISRGenerator({
								url,
								isSkipWaiting: true,
							})
						} else {
							ISRGenerator({
								url,
								isSkipWaiting: true,
							})
						}
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
			if (headers.accept === 'application/json')
				res
					.header('Cache-Control', 'no-store')
					.send(
						req.headers['redirect']
							? JSON.parse(req.headers['redirect'] as string)
							: { status: 200, originPath: pathname, path: pathname }
					)
			else {
				const filePath =
					(req.headers['static-html-path'] as string) ||
					path.resolve(__dirname, '../../../dist/index.html')
				res.raw.setHeader('Cache-Control', 'no-store')
				return sendFile(filePath, res.raw)
			}
		})
	}

	return {
		init(app: FastifyInstance) {
			if (!app) return Console.warn('You need provide express app!')
			_app = app
			_allRequestHandler()
		},
	}
})()

export default puppeteerSSRService
