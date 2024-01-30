import { Express } from 'express'
import fs from 'fs'
import path from 'path'
import { brotliCompressSync, brotliDecompressSync, gzipSync } from 'zlib'
import { IS_REMOTE_CRAWLER, SERVER_LESS } from '../constants'
import ServerConfig from '../server.config'
import { IBotInfo } from '../types'
import CleanerService from '../utils/CleanerService'
import Console from '../utils/ConsoleHandler'
import { getCookieFromResponse, setCookie } from '../utils/CookieHandler'
import { ENV_MODE } from '../utils/InitEnv'
import { CACHEABLE_STATUS_CODE, DISABLE_SSR_CACHE } from './constants'
import { convertUrlHeaderToQueryString, getUrl } from './utils/ForamatUrl'
import ISRGenerator from './utils/ISRGenerator.next'
import SSRHandler from './utils/ISRHandler'

const _resetCookie = (res) => {
	setCookie(res, `BotInfo=;Max-Age=0;Path=/`)
	setCookie(res, `EnvironmentInfo=;Max-Age=0;Path=/`)
	setCookie(res, `DeviceInfo=;Max-Age=0;Path=/`)
} // _resetCookie

const puppeteerSSRService = (async () => {
	let _app: Express
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
		_app.get('*', async function (req, res, next) {
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
			const enableContentEncoding = Boolean(headers['accept-encoding'])
			const contentEncoding = (() => {
				const tmpHeaderAcceptEncoding = headers['accept-encoding'] || ''
				if (tmpHeaderAcceptEncoding.indexOf('br') !== -1) return 'br'
				else if (tmpHeaderAcceptEncoding.indexOf('gzip') !== -1) return 'gzip'
				return '' as 'br' | 'gzip' | ''
			})()

			res.set({
				'Content-Type':
					headers.accept === 'application/json'
						? 'application/json'
						: 'text/html; charset=utf-8',
			})

			if (
				IS_REMOTE_CRAWLER &&
				((ServerConfig.crawlerSecretKey &&
					req.query.crawlerSecretKey !== ServerConfig.crawlerSecretKey) ||
					(!botInfo.isBot && DISABLE_SSR_CACHE))
			) {
				return res.status(403).send('403 Forbidden')
			}

			if (
				ENV_MODE !== 'development' &&
				enableISR &&
				req.headers.service !== 'puppeteer'
			) {
				const url = convertUrlHeaderToQueryString(
					getUrl(req),
					res,
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

						// Add Server-Timing! See https://w3c.github.io/server-timing/.
						if (
							(CACHEABLE_STATUS_CODE[result.status] || result.status === 503) &&
							result.response
						) {
							const body = (() => {
								let tmpBody: string | Buffer = ''

								if (enableContentEncoding) {
									tmpBody = result.html
										? contentEncoding === 'br'
											? brotliCompressSync(result.html)
											: contentEncoding === 'gzip'
											? gzipSync(result.html)
											: result.html
										: fs.readFileSync(result.response)
								} else if (result.response.indexOf('.br') !== -1) {
									const content = fs.readFileSync(result.response)

									tmpBody = brotliDecompressSync(content).toString()
								} else {
									tmpBody = fs.readFileSync(result.response)
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
											? brotliCompressSync(result.html)
											: contentEncoding === 'gzip'
											? gzipSync(result.html)
											: result.html
										: fs.readFileSync(result.response)
								}

								tmpBody = result.html || `${result.status} Error`

								return tmpBody
							})()
							res.send(body) // Serve prerendered page as response.
						}
					} catch (err) {
						Console.error('url', url)
						Console.error(err)
						next(err)
					}

					return
				} else if (
					!botInfo.isBot &&
					(!DISABLE_SSR_CACHE || ServerConfig.crawler)
				) {
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
			if (headers.accept === 'application/json') {
				// NOTE - If header accept application/json (pre-ISR generate static file when user enter and navigate), system will reset cookies to ensure that cookie doesn't exist in these cases
				_resetCookie(res)
				res
					.set({
						'Cache-Control': 'no-store',
					})
					.send(
						req.headers['redirect']
							? JSON.parse(req.headers['redirect'] as string)
							: { status: 200, originPath: pathname, path: pathname }
					)
			} else {
				const filePath =
					(req.headers['static-html-path'] as string) ||
					path.resolve(__dirname, '../../../dist/index.html')

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
