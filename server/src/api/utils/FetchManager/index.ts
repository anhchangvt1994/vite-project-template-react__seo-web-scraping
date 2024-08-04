import path from 'path'
import { resourceExtension } from '../../../constants'
import Console from '../../../utils/ConsoleHandler'
import WorkerManager from '../../../utils/WorkerManager'

const workerManager = WorkerManager.init(
	path.resolve(__dirname, `./worker.${resourceExtension}`),
	{
		minWorkers: 1,
		maxWorkers: 4,
	},
	['fetchData', 'refreshData']
)

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
		Console.error('input is required!')
		return { status: 500, data: {}, message: 'input is required' }
	}

	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('fetchData', [input, init])

		return result
	} catch (err) {
		Console.error(err)
		return { status: 500, data: {}, message: 'input is required' }
	} finally {
		freePool.terminate()
	}
} // fetchData

export const refreshData = async (cacheKeyList: string[]) => {
	if (!cacheKeyList || !cacheKeyList.length) {
		Console.error('cacheKeyList is required!')
		return
	}

	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		await pool.exec('refreshData', [cacheKeyList])

		return 'finish'
	} catch (err) {
		Console.error(err)
		return
	} finally {
		freePool.terminate()
	}
} // refreshData
