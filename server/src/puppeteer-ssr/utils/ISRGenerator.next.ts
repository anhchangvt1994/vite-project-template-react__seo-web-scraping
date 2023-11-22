import fs from 'fs'
import WorkerPool from 'workerpool'
import { SERVER_LESS, resourceExtension } from '../../constants'
import Console from '../../utils/ConsoleHandler'
import {
	BANDWIDTH_LEVEL,
	BANDWIDTH_LEVEL_LIST,
	DURATION_TIMEOUT,
	MAX_WORKERS,
	POWER_LEVEL,
	POWER_LEVEL_LIST,
} from '../constants'
import { ISSRResult } from '../types'
import CacheManager from './CacheManager'
import ISRHandler from './ISRHandler'

const cacheManager = CacheManager()

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
	if (!process.env.BASE_URL) {
		Console.error('Missing base url!')
		return
	}

	if (!ISRHandlerParams.url) {
		Console.error('Missing scraping url!')
		return
	}

	const startGenerating = Date.now()

	if (SERVER_LESS && BANDWIDTH_LEVEL === BANDWIDTH_LEVEL_LIST.TWO)
		fetchData(`${process.env.BASE_URL}/cleaner-service`, {
			method: 'POST',
			headers: new Headers({
				Authorization: 'mtr-cleaner-service',
				Accept: 'application/json',
			}),
		})

	let result: ISSRResult
	result = await cacheManager.achieve(ISRHandlerParams.url)

	if (result) {
		if (result.isRaw) {
			Console.log('File và nội dung đã tồn tại, đang tiến hành Optimize file')
			const asyncTmpResult = new Promise<ISSRResult>(async (res) => {
				const optimizeHTMLContentPool = WorkerPool.pool(
					__dirname + `/OptimizeHtml.worker.${resourceExtension}`,
					{
						minWorkers: 1,
						maxWorkers: MAX_WORKERS,
					}
				)

				if (!result || !result.file || !fs.existsSync(result.file))
					res(undefined)

				fs.readFile(result?.file as string, async (err, data) => {
					if (err) return res(undefined)

					const restOfDuration = (() => {
						const duration = getRestOfDuration(startGenerating, 2000)

						return duration > 7000 ? 7000 : duration
					})()

					let html = data.toString('utf-8')
					const timeout = setTimeout(async () => {
						optimizeHTMLContentPool.terminate()
						const result = await cacheManager.set({
							html,
							url: ISRHandlerParams.url,
							isRaw: false,
						})

						res(result)
					}, restOfDuration)

					let tmpHTML = ''

					try {
						if (POWER_LEVEL === POWER_LEVEL_LIST.THREE)
							tmpHTML = await optimizeHTMLContentPool.exec('compressContent', [
								html,
							])
					} catch (err) {
						tmpHTML = html
						// Console.error(err)
					} finally {
						clearTimeout(timeout)
						optimizeHTMLContentPool.terminate()

						const result = await cacheManager.set({
							html: tmpHTML,
							url: ISRHandlerParams.url,
							isRaw: false,
						})

						res(result)
					}
				})
			})

			const tmpResult = await asyncTmpResult
			result = tmpResult || result
		} else if (Date.now() - new Date(result.updatedAt).getTime() > 300000) {
			const tmpResult: ISSRResult = await new Promise(async (res) => {
				const handle = (() => {
					if (SERVER_LESS)
						return fetchData(
							`${process.env.BASE_URL}/web-scraping`,
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
								isFirstRequest: true,
								url: ISRHandlerParams.url,
							}
						)
					else
						return ISRHandler({
							startGenerating,
							isFirstRequest: true,
							...ISRHandlerParams,
						})
				})()

				if (isSkipWaiting) return res(undefined)
				else setTimeout(res, 10000)

				const result = await (async () => {
					return await handle
				})()

				res(result)
			})

			if (tmpResult && tmpResult.status) result = tmpResult
		}
	} else {
		result = await cacheManager.get(ISRHandlerParams.url)

		Console.log('Kiểm tra có đủ điều kiện tạo page mới không ?')
		Console.log('result.available', result?.available)

		if (result) {
			const isValidToScraping = (() => {
				return (
					result.isInit ||
					(() => {
						const createTimeDuration =
							Date.now() - new Date(result.createdAt).getTime()
						return (
							!result.available &&
							createTimeDuration >=
								(SERVER_LESS && BANDWIDTH_LEVEL === BANDWIDTH_LEVEL_LIST.ONE
									? 2000
									: 10000)
						)
					})()
				)
			})()
			if (isValidToScraping) {
				const tmpResult: ISSRResult = await new Promise(async (res) => {
					const handle = (() => {
						if (SERVER_LESS)
							return fetchData(
								`${process.env.BASE_URL}/web-scraping`,
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
									isFirstRequest: true,
									url: ISRHandlerParams.url,
								}
							)
						else
							return ISRHandler({
								startGenerating,
								isFirstRequest: true,
								...ISRHandlerParams,
							})
					})()

					if (isSkipWaiting) return res(undefined)
					else setTimeout(res, SERVER_LESS ? 5000 : 10000)

					const result = await (async () => {
						return await handle
					})()

					res(result)
				})

				if (tmpResult && tmpResult.status) result = tmpResult
				else {
					const tmpResult = await cacheManager.achieve(ISRHandlerParams.url)
					result = tmpResult || result
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
							const tmpResult = await cacheManager.achieve(ISRHandlerParams.url)

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
