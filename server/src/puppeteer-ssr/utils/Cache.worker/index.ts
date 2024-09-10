import WorkerPool from 'workerpool'
import { get, remove, renew, set } from './utils'

WorkerPool.worker({
	get,
	set,
	renew,
	remove,
	finish: () => {
		return 'finish'
	},
})
