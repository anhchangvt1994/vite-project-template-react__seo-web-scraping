import WorkerPool from 'workerpool'
import {
	BANDWIDTH_LEVEL,
	BANDWIDTH_LEVEL_LIST,
	POWER_LEVEL,
	POWER_LEVEL_LIST,
	SERVER_LESS,
	resourceExtension,
} from '../../constants'
import ServerConfig from '../../server.config'
import Console from '../../utils/ConsoleHandler'
import { PROCESS_ENV } from '../../utils/InitEnv'
import { DISABLE_SSR_CACHE, DURATION_TIMEOUT, MAX_WORKERS } from '../constants'
import { ISSRResult } from '../types'
import CacheManager from './CacheManager'
import ISRHandler from './ISRHandler'

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
		).then((res) => res.text())

		const data = /^{(.|[\r\n])*?}$/.test(response) ? JSON.parse(response) : {}

		return data
	} catch (error) {
		Console.error(error)
	}
} // fetchData

const getRestOfDuration = (startGenerating, gapDuration = 0) => {
	if (!startGenerating) return 0

	return DURATION_TIMEOUT - gapDuration - (Date.now() - startGenerating)
} // getRestOfDuration

interface IISRGeneratorParams {
	url: string
	isSkipWaiting?: boolean
}

const SSRGenerator = async ({
	isSkipWaiting = false,
	...ISRHandlerParams
}: IISRGeneratorParams): Promise<ISSRResult> => {
	const cacheManager = CacheManager(ISRHandlerParams.url)

	if (!PROCESS_ENV.BASE_URL) {
		Console.error('Missing base url!')
		return
	}

	if (!ISRHandlerParams.url) {
		Console.error('Missing scraping url!')
		return
	}

	const startGenerating = Date.now()

	if (SERVER_LESS && BANDWIDTH_LEVEL === BANDWIDTH_LEVEL_LIST.TWO)
		fetchData(`${PROCESS_ENV.BASE_URL}/cleaner-service`, {
			method: 'POST',
			headers: new Headers({
				Authorization: 'mtr-cleaner-service',
				Accept: 'application/json',
			}),
		})

	let result: ISSRResult
	result = await cacheManager.achieve()

	if (result) {
		const NonNullableResult = result
		const pathname = new URL(ISRHandlerParams.url).pathname
		const renewTime =
			(ServerConfig.crawl.routes[pathname]?.cache.renewTime ||
				ServerConfig.crawl.custom?.(pathname)?.cache.renewTime ||
				ServerConfig.crawl.cache.renewTime) * 1000

		if (
			Date.now() - new Date(NonNullableResult.updatedAt).getTime() >
			renewTime
		) {
			cacheManager.renew().then((result) => {
				if (!result.hasRenew)
					if (SERVER_LESS)
						fetchData(
							`${PROCESS_ENV.BASE_URL}/web-scraping`,
							{
								method: 'GET',
								headers: new Headers({
									Authorization: 'web-scraping-service',
									Accept: 'application/json',
									service: 'web-scraping-service',
								}),
							},
							{
								startGenerating,
								hasCache: NonNullableResult.available,
								url: ISRHandlerParams.url,
							}
						)
					else
						ISRHandler({
							startGenerating,
							hasCache: NonNullableResult.available,
							...ISRHandlerParams,
						})
			})
		}
	} else {
		result = await cacheManager.get()

		Console.log('Check for condition to create new page.')
		Console.log('result.available', result?.available)

		if (result) {
			const NonNullableResult = result
			const isValidToScraping = NonNullableResult.isInit

			if (isValidToScraping) {
				const tmpResult: ISSRResult = await new Promise(async (res) => {
					const handle = (() => {
						if (SERVER_LESS)
							return fetchData(
								`${PROCESS_ENV.BASE_URL}/web-scraping`,
								{
									method: 'GET',
									headers: new Headers({
										Authorization: 'web-scraping-service',
										Accept: 'application/json',
										service: 'web-scraping-service',
									}),
								},
								{
									startGenerating,
									hasCache: NonNullableResult.available,
									url: ISRHandlerParams.url,
								}
							)
						else
							return ISRHandler({
								startGenerating,
								hasCache: NonNullableResult.available,
								...ISRHandlerParams,
							})
					})()

					if (isSkipWaiting) return res(undefined)
					else
						setTimeout(
							res,
							SERVER_LESS
								? 5000
								: BANDWIDTH_LEVEL > BANDWIDTH_LEVEL_LIST.ONE
								? 60000
								: 60000
						)

					const result = await (async () => {
						return await handle
					})()

					res(result)
				})

				if (tmpResult && tmpResult.status) result = tmpResult
				else {
					const tmpResult = await cacheManager.achieve()
					result = tmpResult || result
				}

				if (result.html && result.status === 200 && DISABLE_SSR_CACHE) {
					const optimizeHTMLContentPool = WorkerPool.pool(
						__dirname + `/OptimizeHtml.worker.${resourceExtension}`,
						{
							minWorkers: 1,
							maxWorkers: MAX_WORKERS,
						}
					)
					let tmpHTML = result.html

					try {
						if (POWER_LEVEL === POWER_LEVEL_LIST.THREE)
							tmpHTML = await optimizeHTMLContentPool.exec('compressContent', [
								tmpHTML,
							])
					} catch (err) {
						tmpHTML = result.html
						// Console.error(err)
					} finally {
						optimizeHTMLContentPool.terminate()
						result.html = tmpHTML
					}
				}
			} else if (!isSkipWaiting) {
				const restOfDuration = getRestOfDuration(startGenerating, 2000)

				if (restOfDuration >= 500) {
					let waitingDuration = 0
					const followThisCache = (res) => {
						const duration =
							restOfDuration - waitingDuration < 200
								? restOfDuration - waitingDuration
								: 200

						setTimeout(async () => {
							const tmpResult = await cacheManager.achieve()

							if (tmpResult && tmpResult.response) return res(tmpResult)

							waitingDuration += duration

							if (waitingDuration === restOfDuration) res(undefined)
							else followThisCache(res)
						}, duration)
					} // followThisCache

					const tmpResult = await new Promise<ISSRResult>((res) => {
						followThisCache(res)
					})

					if (tmpResult && tmpResult.response) result = tmpResult
				}
			}
		}
	}

	return result
}

export default SSRGenerator
