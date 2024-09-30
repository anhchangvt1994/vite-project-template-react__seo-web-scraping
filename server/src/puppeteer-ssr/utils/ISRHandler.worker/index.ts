import path from 'path'
import { resourceExtension } from '../../../constants'
import Console from '../../../utils/ConsoleHandler'
import WorkerManager from '../../../utils/WorkerManager'
import BrowserManager from '../BrowserManager'
import CacheManager from '../CacheManager.worker/utils'
import { type IISRHandlerWorkerParam } from './types'
import ServerConfig from '../../../server.config'
const { parentPort, isMainThread } = require('worker_threads')

const workerManager = WorkerManager.init(
	path.resolve(__dirname, `./worker.${resourceExtension}`),
	{
		minWorkers: 1,
		maxWorkers: 5,
		enableGlobalCounter: !isMainThread,
	},
	['ISRHandler']
)

const browserManager = BrowserManager()

const ISRHandler = async (params: IISRHandlerWorkerParam) => {
	if (!browserManager || !params.url) return

	const browser = await browserManager.get()

	const wsEndpoint =
		browser && browser.connected ? browser.wsEndpoint() : undefined

	if (!wsEndpoint && !ServerConfig.crawler) return

	const freePool = await workerManager.getFreePool({
		delay: 500,
	})

	const pool = freePool.pool

	let result
	const cacheManager = CacheManager(params.url)

	try {
		result = await new Promise(async (res, rej) => {
			let html
			const timeout = setTimeout(async () => {
				if (html) {
					const tmpResult = await cacheManager.set({
						html,
						url: params.url,
						isRaw: !params.hasCache,
					})

					res(tmpResult)
				} else {
					res(undefined)
				}
			}, 52000)
			try {
				const tmpResult = await pool.exec(
					'ISRHandler',
					[
						{
							...params,
							wsEndpoint,
						},
					],
					{
						on: (payload) => {
							if (!payload) return
							if (
								typeof payload === 'object' &&
								payload.name === 'html' &&
								payload.value
							) {
								html = payload.value
							}
						},
					}
				)

				res(tmpResult)
			} catch (err) {
				rej(err)
			} finally {
				clearTimeout(timeout)
			}
		})
	} catch (err) {
		// clearTimeout(timeoutToCloseBrowserPage)
		Console.error(err)
	}

	const url = params.url.split('?')[0]
	browser?.emit('closePage', url)
	if (!isMainThread) {
		parentPort.postMessage({
			name: 'closePage',
			wsEndpoint,
			url,
		})
	}

	if (!result || result.status !== 200) {
		cacheManager.remove(params.url)
	}

	freePool.terminate({
		force: true,
		// delay: 30000,
	})

	return result
} // getData

export default ISRHandler
