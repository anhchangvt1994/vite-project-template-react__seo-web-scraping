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
	hasCache: boolean
	url: string
}

const _getRestOfDuration = (startGenerating, gapDuration = 0) => {
	if (!startGenerating) return 0

	return DURATION_TIMEOUT - gapDuration - (Date.now() - startGenerating)
} // _getRestOfDuration

const _getSafePage = (page: Page | undefined) => {
	const SafePage = page

	return () => {
		if (SafePage && SafePage.isClosed()) return
		return SafePage
	}
} // _getSafePage

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
		BANDWIDTH_LEVEL > BANDWIDTH_LEVEL_LIST.ONE ? 150 : 500
	const defaultRequestWaitingDuration =
		BANDWIDTH_LEVEL > BANDWIDTH_LEVEL_LIST.ONE ? 150 : 500
	const requestServedFromCacheDuration =
		BANDWIDTH_LEVEL > BANDWIDTH_LEVEL_LIST.ONE ? 150 : 250
	const requestFailDuration =
		BANDWIDTH_LEVEL > BANDWIDTH_LEVEL_LIST.ONE ? 150 : 250
	const maximumTimeout =
		BANDWIDTH_LEVEL > BANDWIDTH_LEVEL_LIST.ONE ? 60000 : 60000

	return async (page: Page, url: string, duration: number) => {
		let hasRedirected = false
		const safePage = _getSafePage(page)
		safePage()?.on('response', (response) => {
			const status = response.status()
			//[301, 302, 303, 307, 308]
			if (status >= 300 && status <= 399) {
				hasRedirected = true
			}
		})

		let response
		try {
			response = await new Promise(async (resolve, reject) => {
				const result = await new Promise<any>((resolveAfterPageLoad) => {
					safePage()
						?.goto(url.split('?')[0], {
							waitUntil: 'networkidle2',
							timeout: 0,
						})
						.then((res) => {
							setTimeout(() => resolveAfterPageLoad(res), firstWaitingDuration)
						})
						.catch((err) => {
							reject(err)
						})
				})

				const waitForNavigate = async () => {
					if (hasRedirected) {
						hasRedirected = false
						await safePage()?.waitForSelector('body')
						await waitForNavigate()
					}
				}

				await waitForNavigate()

				safePage()?.removeAllListeners('response')

				const html = (await safePage()?.content()) ?? ''

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

					safePage()?.on('requestfinished', () => {
						startTimeout()
					})
					safePage()?.on('requestservedfromcache', () => {
						startTimeout(requestServedFromCacheDuration)
					})
					safePage()?.on('requestfailed', () => {
						startTimeout(requestFailDuration)
					})

					setTimeout(resolveAfterPageLoadInFewSecond, maximumTimeout)
				})

				setTimeout(() => {
					resolve(result)
				}, 100)
			})
		} catch (err) {
			Console.log('ISRHandler line 156:')
			throw err
		}

		return response
	}
})() // waitResponse

const gapDurationDefault = 1500

const ISRHandler = async ({ hasCache, url }: IISRHandlerParam) => {
	const startGenerating = Date.now()
	if (_getRestOfDuration(startGenerating, gapDurationDefault) <= 0) return

	const cacheManager = CacheManager(url)

	let restOfDuration = _getRestOfDuration(startGenerating, gapDurationDefault)

	if (restOfDuration <= 0) {
		if (hasCache) {
			const tmpResult = await cacheManager.achieve()

			return tmpResult
		}
		return
	}

	let html = ''
	let isForceToOptimizeAndCompress = false
	let status = 200
	const specialInfo = regexQueryStringSpecialInfo.exec(url)?.groups ?? {}

	if (ServerConfig.crawler) {
		isForceToOptimizeAndCompress = true
		const requestParams = {
			startGenerating,
			hasCache,
			url: url.split('?')[0],
		}

		if (ServerConfig.crawlerSecretKey) {
			requestParams['crawlerSecretKey'] = ServerConfig.crawlerSecretKey
		}

		const headers = { ...specialInfo }

		const botInfo = JSON.parse(headers['botInfo'])

		if (!botInfo.isBot) {
			headers['botInfo'] = JSON.stringify({
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
						...headers,
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
			Console.log('ISRHandler line 230:')
			Console.log('Crawler is fail!')
			Console.error(err)
		}
	}

	if (!ServerConfig.crawler || [404, 500].includes(status)) {
		Console.log('Create new page')
		const page = await browserManager.newPage()
		const safePage = _getSafePage(page)

		Console.log('Create new page success!')

		if (!page) {
			if (!page && hasCache) {
				const tmpResult = await cacheManager.achieve()

				return tmpResult
			}
			return
		}

		let isGetHtmlProcessError = false

		try {
			// await safePage()?.waitForNetworkIdle({ idleTime: 150 })
			// safePage()?.setDefaultNavigationTimeout(0);
			await safePage()?.setRequestInterception(true)
			safePage()?.on('request', (req) => {
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

			await safePage()?.setExtraHTTPHeaders({
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
						Console.log('ISRHandler line 285:')
						Console.error(err)
						safePage()?.close()
						return res(false)
					}
				} finally {
					status = response?.status?.() ?? status
					Console.log(`Internal crawler status: ${status}`)

					res(true)
				}
			})
		} catch (err) {
			Console.log('ISRHandler line 297:')
			Console.log('Crawler is fail!')
			Console.error(err)
			cacheManager.remove(url)
			safePage()?.close()
			return {
				status: 500,
			}
		}

		if (isGetHtmlProcessError) {
			cacheManager.remove(url)
			return {
				status: 500,
			}
		}

		try {
			html = (await safePage()?.content()) ?? '' // serialized HTML of page DOM.
			safePage()?.close()
		} catch (err) {
			Console.log('ISRHandler line 315:')
			Console.error(err)
			return
		}

		status = html && regexNotFoundPageID.test(html) ? 404 : 200
	}

	restOfDuration = _getRestOfDuration(startGenerating)

	let result: ISSRResult
	if (CACHEABLE_STATUS_CODE[status]) {
		const optimizeHTMLContentPool = WorkerPool.pool(
			__dirname + `/OptimizeHtml.worker.${resourceExtension}`,
			{
				minWorkers: 2,
				maxWorkers: MAX_WORKERS,
			}
		)

		let isRaw = false

		try {
			const pathname = new URL(url).pathname
			const enableToOptimize =
				ServerConfig.crawl.routes[pathname]?.optimize ||
				ServerConfig.crawl.custom?.(pathname)?.optimize ||
				ServerConfig.crawl.optimize ||
				isForceToOptimizeAndCompress

			html = await optimizeHTMLContentPool.exec('optimizeContent', [
				html,
				true,
				enableToOptimize,
			])

			const enableToCompress =
				ServerConfig.crawl.routes[pathname]?.compress ||
				ServerConfig.crawl.custom?.(pathname)?.compress ||
				ServerConfig.crawl.compress

			html = await optimizeHTMLContentPool.exec('compressContent', [
				html,
				enableToCompress,
			])
		} catch (err) {
			isRaw = true
			Console.log('--------------------')
			Console.log('ISRHandler line 368:')
			Console.log('error url', url.split('?')[0])
			Console.error(err)
		} finally {
			optimizeHTMLContentPool.terminate()
		}

		result = await cacheManager.set({
			html,
			url,
			isRaw,
		})
	} else {
		cacheManager.remove(url)
		return {
			status,
			html: status === 404 ? 'Page not found!' : html,
		}
	}

	return result
}

export default ISRHandler
