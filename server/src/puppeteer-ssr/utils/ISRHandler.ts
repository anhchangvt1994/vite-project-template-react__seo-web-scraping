import { Page } from 'puppeteer-core'
import WorkerPool from 'workerpool'
import {
	BANDWIDTH_LEVEL,
	BANDWIDTH_LEVEL_LIST,
	POWER_LEVEL,
	POWER_LEVEL_LIST,
	resourceExtension,
	userDataPath,
} from '../../constants'
import ServerConfig from '../../server.config'
import { getStore } from '../../store'
import Console from '../../utils/ConsoleHandler'
import { ENV_MODE } from '../../utils/InitEnv'
import {
	CACHEABLE_STATUS_CODE,
	DURATION_TIMEOUT,
	MAX_WORKERS,
	regexNotFoundPageID,
	regexQueryStringSpecialInfo,
} from '../constants'
import { ISSRResult } from '../types'
import BrowserManager, { IBrowser } from './BrowserManager'
import CacheManager from './CacheManager'

const browserManager = (() => {
	if (ENV_MODE === 'development') return undefined as unknown as IBrowser
	if (POWER_LEVEL === POWER_LEVEL_LIST.THREE)
		return BrowserManager(() => `${userDataPath}/user_data_${Date.now()}`)
	return BrowserManager()
})()

interface IISRHandlerParam {
	startGenerating: number
	isFirstRequest: boolean
	url: string
}

const getRestOfDuration = (startGenerating, gapDuration = 0) => {
	if (!startGenerating) return 0

	return DURATION_TIMEOUT - gapDuration - (Date.now() - startGenerating)
} // getRestOfDuration

const fetchData = async (
	input: RequestInfo | URL,
	init?: RequestInit | undefined,
	reqData?: { [key: string]: any }
) => {
	try {
		const params = new URLSearchParams()
		if (reqData) {
			for (const key in reqData) {
				params.append(key, reqData[key])
			}
		}

		const response = await fetch(
			input + (reqData ? `?${params.toString()}` : ''),
			init
		).then(async (res) => ({
			status: res.status,
			data: await res.text(),
		}))

		const data = /^{(.|[\r\n])*?}$/.test(response.data)
			? JSON.parse(response.data)
			: response.data

		return {
			...response,
			data,
		}
	} catch (error) {
		Console.error(error)
		return {
			status: 500,
			data: '',
		}
	}
} // fetchData

const waitResponse = (() => {
	const firstWaitingDuration =
		BANDWIDTH_LEVEL > BANDWIDTH_LEVEL_LIST.ONE ? 200 : 500
	const defaultRequestWaitingDuration =
		BANDWIDTH_LEVEL > BANDWIDTH_LEVEL_LIST.ONE ? 200 : 500
	const requestServedFromCacheDuration =
		BANDWIDTH_LEVEL > BANDWIDTH_LEVEL_LIST.ONE ? 200 : 250
	const requestFailDuration =
		BANDWIDTH_LEVEL > BANDWIDTH_LEVEL_LIST.ONE ? 200 : 250
	const maximumTimeout =
		BANDWIDTH_LEVEL > BANDWIDTH_LEVEL_LIST.ONE ? 5000 : 5000

	return async (page: Page, url: string, duration: number) => {
		let response
		try {
			response = await new Promise(async (resolve, reject) => {
				const result = await new Promise<any>((resolveAfterPageLoad) => {
					page
						.goto(url.split('?')[0], {
							waitUntil: 'domcontentloaded',
						})
						.then((res) => {
							setTimeout(() => resolveAfterPageLoad(res), firstWaitingDuration)
						})
						.catch((err) => {
							reject(err)
						})
				})

				const html = await page.content()

				if (regexNotFoundPageID.test(html)) return resolve(result)

				await new Promise((resolveAfterPageLoadInFewSecond) => {
					const startTimeout = (() => {
						let timeout
						return (duration = defaultRequestWaitingDuration) => {
							if (timeout) clearTimeout(timeout)
							timeout = setTimeout(resolveAfterPageLoadInFewSecond, duration)
						}
					})()

					startTimeout()

					page.on('requestfinished', () => {
						startTimeout()
					})
					page.on('requestservedfromcache', () => {
						startTimeout(requestServedFromCacheDuration)
					})
					page.on('requestfailed', () => {
						startTimeout(requestFailDuration)
					})

					setTimeout(resolveAfterPageLoadInFewSecond, maximumTimeout)
				})

				resolve(result)
			})
		} catch (err) {
			throw err
		}

		return response
	}
})() // waitResponse

const gapDurationDefault = 1500

const ISRHandler = async ({ isFirstRequest, url }: IISRHandlerParam) => {
	const startGenerating = Date.now()
	if (getRestOfDuration(startGenerating, gapDurationDefault) <= 0) return

	const cacheManager = CacheManager()

	let restOfDuration = getRestOfDuration(startGenerating, gapDurationDefault)

	if (restOfDuration <= 0) {
		if (!isFirstRequest) {
			const tmpResult = await cacheManager.achieve(url)

			return tmpResult
		}
		return
	}

	let html = ''
	let status = 200

	if (ServerConfig.crawler) {
		const requestParams = {
			startGenerating,
			isFirstRequest: true,
			url,
		}

		if (ServerConfig.crawlerSecretKey) {
			requestParams['crawlerSecretKey'] = ServerConfig.crawlerSecretKey
		}

		const headersStore = getStore('headers')

		const botInfo = JSON.parse(headersStore['botInfo'])

		if (!botInfo.isBot) {
			headersStore['botInfo'] = JSON.stringify({
				name: 'unknown',
				isBot: true,
			})
		}

		try {
			const result = await fetchData(
				ServerConfig.crawler,
				{
					method: 'GET',
					headers: new Headers({
						Accept: 'text/html; charset=utf-8',
						...headersStore,
					}),
				},
				requestParams
			)

			if (result) {
				status = result.status
				html = result.data
			}
			Console.log('External crawler status: ', status)
		} catch (err) {
			Console.log('Crawler is fail!')
			Console.error(err)
		}
	}

	if (!ServerConfig.crawler || [404, 500].includes(status)) {
		Console.log('Create new page')
		const page = await browserManager.newPage()
		Console.log('Create new page success!')

		if (!page) {
			if (!page && !isFirstRequest) {
				const tmpResult = await cacheManager.achieve(url)

				return tmpResult
			}
			return
		}

		let isGetHtmlProcessError = false

		try {
			await page.waitForNetworkIdle({ idleTime: 150 })
			await page.setRequestInterception(true)
			page.on('request', (req) => {
				const resourceType = req.resourceType()

				if (resourceType === 'stylesheet') {
					req.respond({ status: 200, body: 'aborted' })
				} else if (
					/(socket.io.min.js)+(?:$)|data:image\/[a-z]*.?\;base64/.test(url) ||
					/font|image|media|imageset/.test(resourceType)
				) {
					req.abort()
				} else {
					req.continue()
				}
			})

			const specialInfo = regexQueryStringSpecialInfo.exec(url)?.groups ?? {}

			await page.setExtraHTTPHeaders({
				...specialInfo,
				service: 'puppeteer',
			})

			await new Promise(async (res) => {
				Console.log(`Start to crawl: ${url}`)

				let response

				try {
					response = await waitResponse(page, url, restOfDuration)
				} catch (err) {
					if (err.name !== 'TimeoutError') {
						isGetHtmlProcessError = true
						res(false)
						await page.close()
						return Console.error(err)
					}
				} finally {
					status = response?.status?.() ?? status
					Console.log(`Internal crawler status: ${status}`)

					res(true)
				}
			})
		} catch (err) {
			Console.log('Crawler is fail!')
			Console.error(err)
			await page.close()
			return {
				status: 500,
			}
		}

		if (isGetHtmlProcessError)
			return {
				status: 500,
			}

		try {
			html = await page.content() // serialized HTML of page DOM.
			await page.close()
		} catch (err) {
			Console.error(err)
			return
		}

		status = html && regexNotFoundPageID.test(html) ? 404 : 200
	}

	restOfDuration = getRestOfDuration(startGenerating)

	let result: ISSRResult
	if (CACHEABLE_STATUS_CODE[status]) {
		const optimizeHTMLContentPool = WorkerPool.pool(
			__dirname + `/OptimizeHtml.worker.${resourceExtension}`,
			{
				minWorkers: 2,
				maxWorkers: MAX_WORKERS,
			}
		)

		try {
			html = await optimizeHTMLContentPool.exec('optimizeContent', [html, true])
		} catch (err) {
			Console.error(err)
			return
		} finally {
			optimizeHTMLContentPool.terminate()
		}

		result = await cacheManager.set({
			html,
			url,
			isRaw: true,
		})
	} else {
		await cacheManager.remove(url)
		return {
			status,
			html: status === 404 ? 'Page not found!' : html,
		}
	}

	return result
}

export default ISRHandler
