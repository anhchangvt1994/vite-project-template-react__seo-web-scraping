import fs from 'fs'
import path from 'path'
import WorkerPool from 'workerpool'
import { pagesPath, resourceExtension } from '../../constants'
import ServerConfig from '../../server.config'
import Console from '../../utils/ConsoleHandler'
import { PROCESS_ENV } from '../../utils/InitEnv'
import { ISSRResult } from '../types'
import {
	ICacheSetParams,
	getKey as getCacheKey,
	getFileInfo,
} from './Cache.worker/utils'

const MAX_WORKERS = PROCESS_ENV.MAX_WORKERS
	? Number(PROCESS_ENV.MAX_WORKERS)
	: 7

const maintainFile = path.resolve(__dirname, '../../../maintain.html')

const CacheManager = (url: string) => {
	const pathname = new URL(url).pathname
	const enableToCache =
		ServerConfig.crawl.routes[pathname]?.compress ||
		ServerConfig.crawl.custom?.(pathname)?.compress ||
		ServerConfig.crawl.compress

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

		const pool = WorkerPool.pool(
			path.resolve(__dirname, `./Cache.worker/index.${resourceExtension}`),
			{
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
			}
		)

		try {
			const result = await pool.exec('get', [url])
			return result
		} catch (err) {
			Console.error(err)
			return
		} finally {
			pool.terminate()
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

		const pool = WorkerPool.pool(
			path.resolve(__dirname, `./Cache.worker/index.${resourceExtension}`),
			{
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
			}
		)

		try {
			const result = await pool.exec('set', [params])
			return result
		} catch (err) {
			Console.error(err)
			return
		} finally {
			pool.terminate()
		}
	} // set

	const renew = async () => {
		const pool = WorkerPool.pool(
			path.resolve(__dirname, `./Cache.worker/index.${resourceExtension}`),
			{
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
			}
		)

		try {
			const result = await pool.exec('renew', [url])
			return result
		} catch (err) {
			Console.error(err)
			return
		} finally {
			pool.terminate()
		}
	} // renew

	const remove = async (url: string) => {
		if (!enableToCache) return
		const pool = WorkerPool.pool(
			path.resolve(__dirname, `./Cache.worker/index.${resourceExtension}`),
			{
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
			}
		)

		try {
			await pool.exec('remove', [url])
		} catch (err) {
			Console.error(err)
			return
		} finally {
			pool.terminate()
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
