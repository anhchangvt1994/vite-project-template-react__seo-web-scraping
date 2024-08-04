import fs from 'fs'
import path from 'path'
import { pagesPath, resourceExtension } from '../../constants'
import ServerConfig from '../../server.config'
import Console from '../../utils/ConsoleHandler'
import WorkerManager from '../../utils/WorkerManager'
import { ISSRResult } from '../types'
import {
	ICacheSetParams,
	getKey as getCacheKey,
	getFileInfo,
} from './Cache.worker/utils'

const workerManager = WorkerManager.init(
	path.resolve(__dirname, `./Cache.worker/index.${resourceExtension}`),
	{
		minWorkers: 1,
		maxWorkers: 4,
	},
	['get', 'set', 'renew', 'remove']
)

const maintainFile = path.resolve(__dirname, '../../../maintain.html')

const CacheManager = (url: string) => {
	const pathname = new URL(url).pathname

	const enableToCache =
		ServerConfig.crawl.enable &&
		(ServerConfig.crawl.routes[pathname] === undefined ||
			ServerConfig.crawl.routes[pathname].enable ||
			ServerConfig.crawl.custom?.(pathname) === undefined ||
			ServerConfig.crawl.custom?.(pathname).enable) &&
		ServerConfig.crawl.cache.enable &&
		(ServerConfig.crawl.routes[pathname] === undefined ||
			ServerConfig.crawl.routes[pathname].cache.enable ||
			ServerConfig.crawl.custom?.(pathname) === undefined ||
			ServerConfig.crawl.custom?.(pathname).cache.enable)

	const get = async () => {
		if (!enableToCache)
			return {
				response: maintainFile,
				status: 503,
				createdAt: new Date(),
				updatedAt: new Date(),
				requestedAt: new Date(),
				ttRenderMs: 200,
				available: false,
				isInit: true,
			}

		const freePool = workerManager.getFreePool()
		const pool = freePool.pool

		try {
			const result = await pool.exec('get', [url])
			return result
		} catch (err) {
			Console.error(err)
			return
		} finally {
			freePool.terminate()
		}
	} // get

	const achieve = async (): Promise<ISSRResult> => {
		if (!enableToCache) return
		if (!url) {
			Console.error('Need provide "url" param!')
			return
		}

		const key = getCacheKey(url)
		let file = `${pagesPath}/${key}.br`
		let isRaw = false

		switch (true) {
			case fs.existsSync(file):
				break
			case fs.existsSync(`${pagesPath}/${key}.renew.br`):
				file = `${pagesPath}/${key}.renew.br`
				break
			default:
				file = `${pagesPath}/${key}.raw.br`
				isRaw = true
				break
		}

		if (!fs.existsSync(file)) return

		const info = await getFileInfo(file)

		if (!info || info.size === 0) return

		// await setRequestTimeInfo(file, new Date())

		return {
			file,
			response: file,
			status: 200,
			createdAt: info.createdAt,
			updatedAt: info.updatedAt,
			requestedAt: new Date(),
			ttRenderMs: 200,
			available: true,
			isInit: false,
			isRaw,
		}
	} // achieve

	const set = async (params: ICacheSetParams) => {
		if (!enableToCache)
			return {
				html: params.html,
				response: maintainFile,
				status: params.html ? 200 : 503,
			}

		const freePool = workerManager.getFreePool()
		const pool = freePool.pool

		try {
			const result = await pool.exec('set', [params])
			return result
		} catch (err) {
			Console.error(err)
			return
		} finally {
			freePool.terminate()
		}
	} // set

	const renew = async () => {
		const freePool = workerManager.getFreePool()
		const pool = freePool.pool

		try {
			const result = await pool.exec('renew', [url])
			return result
		} catch (err) {
			Console.error(err)
			return
		} finally {
			freePool.terminate()
		}
	} // renew

	const remove = async (url: string) => {
		if (!enableToCache) return
		const freePool = workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('remove', [url])
		} catch (err) {
			Console.error(err)
			return
		} finally {
			freePool.terminate()
		}
	} // remove

	return {
		achieve,
		get,
		set,
		renew,
		remove,
	}
}

export default CacheManager
