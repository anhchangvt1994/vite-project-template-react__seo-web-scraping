import path from 'path'
import { SERVER_LESS } from '../constants'
import { IBotInfo } from '../types'
import CleanerService from '../utils/CleanerService'
import Console from '../utils/ConsoleHandler'
import { CACHEABLE_STATUS_CODE, COOKIE_EXPIRED } from './constants'
import { convertUrlHeaderToQueryString, getUrl } from './utils/ForamatUrl.bun'
import ISRGenerator from './utils/SSRGenerator.next'
import SSRHandler from './utils/SSRHandler'
import Elysia from 'elysia'

const puppeteerSSRService = (async () => {
	let _app: Elysia
	const ssrHandlerAuthorization = 'mtr-ssr-handler'
	const cleanerServiceAuthorization = 'mtr-cleaner-service'

	const _allRequestHandler = () => {
		if (SERVER_LESS) {
			_app
				.get('/web-scraping', async (ctx) => {
					const req = ctx.request
					if (req.headers['authorization'] !== ssrHandlerAuthorization) {
						ctx.set.status = 200
						return 'Welcome to MTr Web Scraping Service, please provide authorization to use it.'
					}

					const query = ctx.store['query']

					const startGenerating = Number(query.startGenerating)
					const isFirstRequest = !!query.isFirstRequest
					const url = query.url
						? (decodeURIComponent(query.url as string) as string)
						: ''

					const result = await SSRHandler({
						startGenerating,
						isFirstRequest,
						url,
					})

					ctx.set.status = 200

					return JSON.stringify(result || {})
				})
				.post('/cleaner-service', async (ctx) => {
					const req = ctx.request
					if (
						req.headers.get('authorization') !== cleanerServiceAuthorization
					) {
						ctx.set.status = 200
						return 'Welcome to MTr Cleaner Service, please provide authorization to use it.'
					} else if (!SERVER_LESS) {
						ctx.set.status = 200
						return 'MTr cleaner service can not run in none serverless environment'
					}

					await CleanerService()

					Console.log('Finish clean service!')

					ctx.set.status = 200
					return 'Finish clean service!'
				})
		}
		_app.get('*', async ({ cookie, ...ctx }) => {
			const req = ctx.request
			const botInfoStringify = ctx.store['Bot-Info'] as string
			const botInfo: IBotInfo = JSON.parse(botInfoStringify)

			cookie['BotInfo'].set({
				value: ctx.store['Bot-Info'],
				maxAge: COOKIE_EXPIRED,
			})
			cookie['DeviceInfo'].set({
				value: ctx.store['Device-Info'],
				maxAge: COOKIE_EXPIRED,
			})
			const url = convertUrlHeaderToQueryString(
				getUrl(ctx.store['url']),
				[ctx.store['Bot-Info'], ctx.store['Device-Info']],
				true
			)

			if (req.headers.get('service') !== 'puppeteer') {
				if (botInfo.isBot) {
					try {
						const result = await ISRGenerator({
							url,
						})

						if (result) {
							/**
							 * NOTE
							 * Cache-Control max-age is 1 year
							 * calc by using:
							 * https://www.inchcalculator.com/convert/year-to-second/
							 */
							ctx.set.headers['Server-Timing'] =
								'Prerender;dur=50;desc="Headless render time (ms)"'
							ctx.set.headers['Content-Type'] = 'text/html'
							ctx.set.headers['Cache-Control'] = 'public, max-age: 31556952'

							ctx.set.status = result.status

							if (result.status === 503) ctx.set.headers['Retry-After'] = '120'
						} else {
							ctx.set.status = 504
							return '504 Gateway Timeout'
						}

						// Add Server-Timing! See https://w3c.github.io/server-timing/.
						if (CACHEABLE_STATUS_CODE[result.status] || result.status === 503)
							return Bun.file(result.response).text()
						// Serve prerendered page as response.
						else return result.html || `${result.status} Error` // Serve prerendered page as response.
					} catch (err) {
						Console.error('url', url)
						Console.error(err)
						ctx.set.status = 504
						return '504 Gateway Timeout'
					} finally {
						return
					}
				}

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

			/**
			 * NOTE
			 * Cache-Control max-age is 1 year
			 * calc by using:
			 * https://www.inchcalculator.com/convert/year-to-second/
			 */
			ctx.set.headers['Content-Type'] = 'text/html'
			ctx.set.headers['Cache-Control'] = 'public, max-age: 31556952'
			ctx.set.status = 200
			return Bun.file(
				(req.headers.get('staticHtmlPath') as string) ||
					path.resolve(__dirname, '../../../dist/index.html')
			)
		})
	}

	return {
		init(app: Elysia) {
			if (!app) return Console.warn('You need provide express app!')
			_app = app
			_allRequestHandler()
		},
	}
})()

export default puppeteerSSRService
