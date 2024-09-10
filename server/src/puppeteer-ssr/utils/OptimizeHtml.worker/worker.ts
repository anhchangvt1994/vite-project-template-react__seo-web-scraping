import WorkerPool from 'workerpool'
import {
	compressContent,
	optimizeContent,
	shallowOptimizeContent,
	deepOptimizeContent,
} from './utils'

WorkerPool.worker({
	compressContent,
	optimizeContent,
	shallowOptimizeContent,
	deepOptimizeContent,
	finish: () => {
		return 'finish'
	},
})
