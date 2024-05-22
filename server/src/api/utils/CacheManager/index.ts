import fs from 'fs'
import path from 'path'
import { dataPath, resourceExtension, storePath } from '../../../constants'
import Console from '../../../utils/ConsoleHandler'
import WorkerManager from '../../../utils/WorkerManager'
import {
	IGetCacheOptionsParam,
	ISetCacheContent,
	ISetCacheOptionsParam,
	IStatus,
} from './types'

const workerManager = WorkerManager.init(
	path.resolve(__dirname, `./worker.${resourceExtension}`),
	{
		minWorkers: 1,
		maxWorkers: 4,
	},
	['get', 'set', 'remove', 'updateStatus']
)

export const getData = async (key: string, options?: IGetCacheOptionsParam) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('get', [dataPath, key, 'br', options])

		if (result && result.status === 200) {
			result.data = fs.readFileSync(result.response)
		}

		return result
	} catch (err) {
		Console.error(err)
		return
	} finally {
		freePool.terminate()
	}
} // getData
export const getStore = async (
	key: string,
	options?: IGetCacheOptionsParam
) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('get', [storePath, key, 'json', options])

		if (result && result.status === 200) {
			const tmpData = fs.readFileSync(result.response) as unknown as string
			result.data = tmpData ? JSON.parse(tmpData) : tmpData
		}

		return result
	} catch (err) {
		Console.error(err)
		return
	} finally {
		freePool.terminate()
	}
} // getStore

export const setData = async (
	key: string,
	content: string | Buffer | ISetCacheContent,
	options?: ISetCacheOptionsParam
) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('set', [
			dataPath,
			key,
			'br',
			content,
			options,
		])
		return result
	} catch (err) {
		Console.error(err)
		return
	} finally {
		freePool.terminate()
	}
} // setData
export const setStore = async (key: string, content: any) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('set', [
			storePath,
			key,
			'json',
			content,
			{
				isCompress: false,
			},
		])
		return result
	} catch (err) {
		Console.error(err)
		return
	} finally {
		freePool.terminate()
	}
} // setStore

export const removeData = async (key: string) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('remove', [dataPath, key, 'br'])
		return result
	} catch (err) {
		Console.error(err)
		return
	} finally {
		freePool.terminate()
	}
} // removeData
export const removeStore = async (key: string) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('remove', [storePath, key])
		return result
	} catch (err) {
		Console.error(err)
		return
	} finally {
		freePool.terminate()
	}
} // removeStore

export const updateDataStatus = (key: string, newStatus?: IStatus) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		pool.exec('updateStatus', [dataPath, key, 'br', newStatus])
	} catch (err) {
		Console.error(err)
		return
	} finally {
		freePool.terminate()
	}
} // updateDataStatus
