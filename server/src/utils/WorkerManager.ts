import WorkerPool from 'workerpool'
import Pool from 'workerpool/src/Pool'
import { PROCESS_ENV } from './InitEnv'
import Console from './ConsoleHandler'

interface IInitOptions {
	minWorkers: number
	maxWorkers: number
}

interface IGetFreePool {
	pool: Pool
	terminate: () => void
}

const MAX_WORKERS = PROCESS_ENV.MAX_WORKERS
	? Number(PROCESS_ENV.MAX_WORKERS)
	: 7

const WorkerManager = (() => {
	return {
		init: (
			workerPath: string,
			options?: IInitOptions,
			instanceTaskList?: string[]
		) => {
			options = {
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
				...(options || {}),
			}

			let curPool = WorkerPool.pool(workerPath, options)

			try {
				if (instanceTaskList && instanceTaskList.length) {
					const promiseTaskList: Promise<any>[] = []
					for (const task of instanceTaskList) {
						promiseTaskList.push(curPool.exec(task, []))
					}

					Promise.all(promiseTaskList)
				}
			} catch (err) {
				Console.error(err)
			}

			const _terminate = (() => {
				let isTerminate = false

				return async () => {
					if (isTerminate) return
					isTerminate = true
					const pool = curPool

					const newPool = WorkerPool.pool(workerPath, {
						...options,
					})

					try {
						if (instanceTaskList && instanceTaskList.length) {
							const promiseTaskList: Promise<any>[] = []
							for (const task of instanceTaskList) {
								promiseTaskList.push(newPool.exec(task, []))
							}

							await Promise.all(promiseTaskList)
						}
					} catch (err) {
						Console.error(err)
					} finally {
						isTerminate = false
					}

					curPool = newPool
					isTerminate = false
					pool.terminate()
				}
			})()

			const _getFreePool: () => IGetFreePool = () => ({
				pool: curPool,
				terminate: _terminate,
			}) // _getFreePool

			return {
				getFreePool: _getFreePool,
			}
		},
	}
})()

export default WorkerManager
