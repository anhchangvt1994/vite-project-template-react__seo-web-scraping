import fs from 'fs-extra'
import WorkerPool from 'workerpool'
import Console from '../../../utils/ConsoleHandler'

type TWorkerPool = ReturnType<typeof WorkerPool & ((...args: any[]) => any)>

export const deleteResource = (path: string, WorkerPool?: TWorkerPool) => {
	if (!path || !fs.existsSync(path)) return Console.log('Path can not empty!')

	fs.emptyDirSync(path)
	fs.remove(path)
		.then(() => {
			if (WorkerPool) {
				WorkerPool.pool().terminate()
			}
		})
		.catch((err) => {
			if (err) {
				console.error(err)
				if (WorkerPool) {
					WorkerPool.pool().terminate()
				}
			}
		})
}
