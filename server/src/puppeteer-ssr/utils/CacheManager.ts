import fs from 'fs'
import path from 'path'
import WorkerPool from 'workerpool'
import { pagesPath, resourceExtension } from '../../constants'
import Console from '../../utils/ConsoleHandler'
import { ISSRResult } from '../types'
import {
	ICacheSetParams,
	getKey as getCacheKey,
	getFileInfo,
	setRequestTimeInfo,
} from './Cache.worker/utils'

const MAX_WORKERS = process.env.MAX_WORKERS
	? Number(process.env.MAX_WORKERS)
	: 7

const CacheManager = () => {
	const get = async (url: string) => {
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

	const achieve = async (url: string): Promise<ISSRResult> => {
		if (!url) {
			Console.error('Need provide "url" param!')
			return
		}

		const key = getCacheKey(url)
		let file = `${pagesPath}/${key}.html`
		let isRaw = false

		if (!fs.existsSync(file)) {
			file = `${pagesPath}/${key}.raw.html`
			isRaw = true
		}

		if (!fs.existsSync(file)) return

		const info = await getFileInfo(file)

		if (!info || info.size === 0) return

		await setRequestTimeInfo(file, new Date())

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

	const remove = async (url: string) => {
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
		remove,
	}
}

export default CacheManager
