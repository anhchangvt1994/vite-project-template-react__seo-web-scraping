import fs from 'fs'
import WorkerPool from 'workerpool'
import Console from '../../../utils/ConsoleHandler'

type TWorkerPool = ReturnType<typeof WorkerPool & ((...args: any[]) => any)>

export const deleteResource = (path: string, WorkerPool?: TWorkerPool) => {
	if (!path || !fs.existsSync(path)) return Console.log('Path can not empty!')

	fs.rm(path, { recursive: true }, (err) => {
		if (err) {
			console.error(err)
			if (WorkerPool) {
				WorkerPool.pool().terminate()
			}

			throw err
		}

		if (WorkerPool) {
			WorkerPool.pool().terminate()
		}
	})
}
