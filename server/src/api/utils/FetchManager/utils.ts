import { brotliDecompressSync, gunzipSync } from 'zlib'
import { dataPath } from '../../../constants'
import Console from '../../../utils/ConsoleHandler'
import { ICacheResult } from '../CacheManager/types'
import {
	get as getDataCache,
	set as setDataCache,
	updateStatus as updateDataCacheStatus,
} from '../CacheManager/utils'

export const fetchData = async (
	input: RequestInfo | URL,
	init?: RequestInit | undefined
): Promise<{
	status: number
	data: any
	cookies?: string[]
	message?: string
}> => {
	if (!input) {
		Console.error('URL is required!')
		return { status: 500, data: {}, message: 'URL is required' }
	}

	try {
		const response = await fetch(input, {
			...(init || {}),
		})
			.then(async (res) => {
				const data = await new Promise(async (resolve) => {
					let tmpData
					const buffer = await res.clone().arrayBuffer()

					try {
						tmpData = brotliDecompressSync(buffer)?.toString()
					} catch {}

					if (!tmpData)
						try {
							tmpData = gunzipSync(buffer)?.toString()
						} catch {}

					if (!tmpData) {
						const text = await res.clone().text()
						tmpData = /^(\{|\[)(.|[\r\n])*?(\}|\])$/.test(text)
							? JSON.parse(text)
							: {}
					} else JSON.parse(tmpData)

					resolve(tmpData)
				})

				return {
					status: res.status,
					message: res.statusText,
					cookies: res.headers.getSetCookie(),
					data,
				}
			})
			.catch((err) => {
				if (err.name !== 'AbortError') Console.log(err)
				return {
					status: 500,
					data: {},
					message: 'Server Error',
				}
			})

		return response
	} catch (error) {
		Console.error(error)
		return { status: 500, data: {}, message: 'Server Error' }
	}
} // fetchData

export const refreshData = async (cacheKeyList: string[]) => {
	if (!cacheKeyList || !cacheKeyList.length) return

	const arrRefreshData: (Promise<any> | undefined)[] = []

	for (const cacheKeyItem of cacheKeyList) {
		const apiCache = await getDataCache(dataPath, cacheKeyItem, 'br')

		if (!apiCache || !apiCache.cache || !apiCache.url) continue

		updateDataCacheStatus(dataPath, cacheKeyItem, 'br', 'fetch')

		arrRefreshData.push(
			new Promise(async (res) => {
				const headers = new Headers()
				for (const key in apiCache.headers) {
					headers.append(key, apiCache.headers[key])
				}

				await fetchData(apiCache.url as string, {
					method: apiCache.method,
					headers: apiCache.headers,
					body: apiCache.body,
				}).then((result) => {
					const cacheResult = apiCache.cache as Exclude<
						NonNullable<ICacheResult>['cache'],
						string | Buffer | undefined
					>
					const enableToSetCache =
						result.status === 200 || !cacheResult || cacheResult.status !== 200
					if (enableToSetCache) {
						setDataCache(dataPath, cacheKeyItem, 'br', {
							url: apiCache.url as string,
							method: apiCache.method as string,
							body: apiCache.body,
							headers: apiCache.headers,
							cache: {
								expiredTime: cacheResult.expiredTime,
								...result,
							},
						})

						res('finish')
					}
				})
			})
		)
	}

	if (arrRefreshData.length) await Promise.all(arrRefreshData)

	return 'finish'
} // refreshData
