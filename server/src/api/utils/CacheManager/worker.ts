import WorkerPool from 'workerpool'
import { get, set, getStatus, remove, updateStatus } from './utils'

WorkerPool.worker({
	getStatus,
	updateStatus,
	get,
	set,
	remove,
	finish: () => {
		return 'finish'
	},
})
