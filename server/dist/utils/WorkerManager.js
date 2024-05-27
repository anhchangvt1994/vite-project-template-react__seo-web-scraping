'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)

var _InitEnv = require('./InitEnv')
var _ConsoleHandler = require('./ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)

const MAX_WORKERS = _InitEnv.PROCESS_ENV.MAX_WORKERS
	? Number(_InitEnv.PROCESS_ENV.MAX_WORKERS)
	: 7

const WorkerManager = (() => {
	return {
		init: (workerPath, options, instanceTaskList) => {
			options = {
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
				...(options || {}),
			}

			let curPool = _workerpool2.default.pool(workerPath, options)

			try {
				if (instanceTaskList && instanceTaskList.length) {
					const promiseTaskList = []
					for (const task of instanceTaskList) {
						promiseTaskList.push(curPool.exec(task, []))
					}

					Promise.all(promiseTaskList)
				}
			} catch (err) {
				_ConsoleHandler2.default.error(err)
			}

			const _terminate = (() => {
				let isTerminate = false

				return async () => {
					if (isTerminate) return
					isTerminate = true
					const pool = curPool

					const newPool = _workerpool2.default.pool(workerPath, {
						...options,
					})

					try {
						if (instanceTaskList && instanceTaskList.length) {
							const promiseTaskList = []
							for (const task of instanceTaskList) {
								promiseTaskList.push(newPool.exec(task, []))
							}

							await Promise.all(promiseTaskList)
						}
					} catch (err) {
						_ConsoleHandler2.default.error(err)
					} finally {
						isTerminate = false
					}

					curPool = newPool
					isTerminate = false
					pool.terminate()
				}
			})()

			const _getFreePool = () => ({
				pool: curPool,
				terminate: _terminate,
			}) // _getFreePool

			return {
				getFreePool: _getFreePool,
			}
		},
	}
})()

exports.default = WorkerManager
