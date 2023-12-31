import fs from 'fs'
import path from 'path'
import { TemplatedApp } from 'uWebSockets.js'
import { ENV, SERVER_LESS } from '../constants'
import ServerConfig from '../server.config'
import { IBotInfo } from '../types'
import CleanerService from '../utils/CleanerService'
import Console from '../utils/ConsoleHandler'
import { CACHEABLE_STATUS_CODE, COOKIE_EXPIRED } from './constants'
import { convertUrlHeaderToQueryString, getUrl } from './utils/ForamatUrl.uws'
import ISRGenerator from './utils/ISRGenerator.next'
import SSRHandler from './utils/ISRHandler'
import DetectLocaleMiddle from '../middlewares/uws/DetectLocale'
import DetectRedirectMiddle from '../middlewares/uws/DetectRedirect'
import DetectStaticMiddle from '../middlewares/uws/DetectStatic'
import DetectBotMiddle from '../middlewares/uws/DetectBot'
import DetectDeviceMiddle from '../middlewares/uws/DetectDevice'

const COOKIE_EXPIRED_SECOND = COOKIE_EXPIRED / 1000

const puppeteerSSRService = (async () => {
	let _app: TemplatedApp
	const webScrapingService = 'web-scraping-service'
	const cleanerService = 'cleaner-service'

	const _allRequestHandler = () => {
		if (SERVER_LESS) {
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
							Console.log('Request aborted')
						})

						const result = await SSRHandler({
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
					else if (!SERVER_LESS)
						res
							.writeStatus('200')
							.end(
								'MTr cleaner service can not run in none serverless environment'
							)
					else {
						res.onAborted(() => {
							Console.log('Request aborted')
						})

						await CleanerService()

						Console.log('Finish clean service!')

						res.cork(() => {
							res.writeStatus('200').end('Finish clean service!', true)
						})
					}
				})
		}
		_app.get('/*', async function (res, req) {
			// NOTE - Check and create base url
			if (!process.env.BASE_URL)
				process.env.BASE_URL = `${
					req.getHeader('x-forwarded-proto')
						? req.getHeader('x-forwarded-proto')
						: 'http'
				}://${req.getHeader('host')}`

			DetectStaticMiddle(res, req)

			// NOTE - Check if static will send static file
			if (res.writableEnded) return

			// NOTE - Detect, setup BotInfo and LocaleInfo
			DetectBotMiddle(res, req)
			DetectLocaleMiddle(res, req)

			const botInfo: IBotInfo = res.cookies?.botInfo

			// NOTE - Check redirect or not
			const isRedirect = DetectRedirectMiddle(res, req)

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
			DetectDeviceMiddle(res, req)

			const enableISR =
				ServerConfig.isr.enable &&
				Boolean(
					!ServerConfig.isr.routes ||
						!ServerConfig.isr.routes[req.getUrl()] ||
						ServerConfig.isr.routes[req.getUrl()].enable ||
						!ServerConfig.isr.routes[res.urlForCrawler] ||
						ServerConfig.isr.routes[res.urlForCrawler].enable
				)

			if (
				ENV !== 'development' &&
				enableISR &&
				req.getHeader('service') !== 'puppeteer'
			) {
				const url = convertUrlHeaderToQueryString(
					getUrl(res, req),
					res,
					!botInfo.isBot
				)

				if (botInfo.isBot) {
					res.onAborted(() => {
						Console.log('Request aborted')
					})

					try {
						const result = await ISRGenerator({
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
									(CACHEABLE_STATUS_CODE[result.status] ||
										result.status === 503) &&
									result.response
								) {
									try {
										const body = fs.readFileSync(result.response)
										res
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
											.end(body, true)
									} catch {
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
						Console.error('url', url)
						Console.error(err)
						// NOTE - Error: uWS.HttpResponse must not be accessed after uWS.HttpResponse.onAborted callback, or after a successful response. See documentation for uWS.HttpResponse and consult the user manual.
						res.writeStatus('500').end('Server Error!', true)
					}

					res.writableEnded = true
				} else {
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

			if (!res.writableEnded) {
				/**
				 * NOTE
				 * Cache-Control max-age is 1 year
				 * calc by using:
				 * https://www.inchcalculator.com/convert/year-to-second/
				 */
				if (req.getHeader('accept') === 'application/json')
					res
						.writeStatus('200')
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
						.end(
							JSON.stringify({
								status: 200,
								originPath: req.getUrl(),
								path: req.getUrl(),
							}),
							true
						)
				else {
					const filePath =
						(req.getHeader('static-html-path') as string) ||
						path.resolve(__dirname, '../../../dist/index.html')

					try {
						const body = fs.readFileSync(filePath)
						res
							.writeStatus('200')
							.writeHeader(
								'Content-Type',
								req.getHeader('accept') === 'application/json'
									? 'application/json'
									: 'text/html; charset=utf-8'
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
					} catch {
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
		init(app: TemplatedApp) {
			if (!app) return Console.warn('You need provide express app!')
			_app = app
			_allRequestHandler()
		},
	}
})()

export default puppeteerSSRService
