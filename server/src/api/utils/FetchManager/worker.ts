import WorkerPool from 'workerpool'
import { fetchData, refreshData } from './utils'

WorkerPool.worker({
	fetchData,
	refreshData,
	finish: () => {
		return 'finish'
	},
})
