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
import SSRHandler from './SSRHandler'

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
		)
		const data = await response.json()
		return data
	} catch (error) {
		Console.error(error)
	}
} // fetchData

const getRestOfDuration = (startGenerating, gapDuration = 0) => {
	if (!startGenerating) return 0

	return DURATION_TIMEOUT - gapDuration - (Date.now() - startGenerating)
} // getRestOfDuration

interface ISSRGeneratorParams {
	url: string
	isSkipWaiting?: boolean
}

const SSRGenerator = async ({
	isSkipWaiting = false,
	...SSRHandlerParams
}: ISSRGeneratorParams): Promise<ISSRResult> => {
	if (!process.env.BASE_URL) {
		Console.error('Missing base url!')
		return
	}

	if (!SSRHandlerParams.url) {
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
	result = await cacheManager.achieve(SSRHandlerParams.url)

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
							url: SSRHandlerParams.url,
							isRaw: false,
						})

						res(result)
					}, restOfDuration)

					try {
						if (POWER_LEVEL === POWER_LEVEL_LIST.THREE)
							html = await optimizeHTMLContentPool.exec('compressContent', [
								html,
							])

						html = await optimizeHTMLContentPool.exec('optimizeContent', [
							html,
							true,
						])
					} catch (err) {
						Console.error(err)
						return
					} finally {
						clearTimeout(timeout)
						optimizeHTMLContentPool.terminate()

						const result = await cacheManager.set({
							html,
							url: SSRHandlerParams.url,
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
									Authorization: 'mtr-ssr-handler',
									Accept: 'application/json',
								}),
							},
							{
								startGenerating,
								isFirstRequest: true,
								url: SSRHandlerParams.url,
							}
						)
					else
						return SSRHandler({
							startGenerating,
							isFirstRequest: true,
							...SSRHandlerParams,
						})
				})()

				if (isSkipWaiting) return res(undefined)
				else setTimeout(res, 5000)

				const result = await (async () => {
					return await handle
				})()

				res(result)
			})

			if (tmpResult && tmpResult.status) result = tmpResult
		}
	} else if (!result) {
		result = await cacheManager.get(SSRHandlerParams.url)

		Console.log('Kiểm tra có đủ điều kiện tạo page mới không ?')
		Console.log('result.available', result?.available)

		if (result) {
			const isValidToSraping = (() => {
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
			if (isValidToSraping) {
				const tmpResult: ISSRResult = await new Promise(async (res) => {
					const handle = (() => {
						if (SERVER_LESS)
							return fetchData(
								`${process.env.BASE_URL}/web-scraping`,
								{
									method: 'GET',
									headers: new Headers({
										Authorization: 'mtr-ssr-handler',
										Accept: 'application/json',
									}),
								},
								{
									startGenerating,
									isFirstRequest: true,
									url: SSRHandlerParams.url,
								}
							)
						else
							return SSRHandler({
								startGenerating,
								isFirstRequest: true,
								...SSRHandlerParams,
							})
					})()

					if (isSkipWaiting) return res(undefined)
					else setTimeout(res, 5000)

					const result = await (async () => {
						return await handle
					})()

					res(result)
				})

				if (tmpResult && tmpResult.status) result = tmpResult
				else {
					const tmpResult = await cacheManager.achieve(SSRHandlerParams.url)
					result = tmpResult || result
				}
			} else if (!isSkipWaiting) {
				const restOfDuration = (() => {
					const duration = getRestOfDuration(startGenerating, 2000)

					return duration < 5000 ? duration : 5000
				})()

				if (restOfDuration >= 500) {
					let waitingDuration = 0
					const followThisCache = (res) => {
						const duration =
							restOfDuration - waitingDuration < 200
								? restOfDuration - waitingDuration
								: 200

						setTimeout(async () => {
							const tmpResult = await cacheManager.achieve(SSRHandlerParams.url)

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
