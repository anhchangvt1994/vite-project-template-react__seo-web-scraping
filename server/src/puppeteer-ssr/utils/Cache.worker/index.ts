import WorkerPool from 'workerpool'
import { get, remove, renew, rename, set, isExist } from './utils'

WorkerPool.worker({
	get,
	set,
	renew,
	remove,
	rename,
	isExist,
	finish: () => {
		return 'finish'
	},
})
