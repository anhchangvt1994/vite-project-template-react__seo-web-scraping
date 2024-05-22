'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _constants = require('../../../constants')
var _ConsoleHandler = require('../../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _WorkerManager = require('../../../utils/WorkerManager')
var _WorkerManager2 = _interopRequireDefault(_WorkerManager)

const workerManager = _WorkerManager2.default.init(
	_path2.default.resolve(__dirname, `./worker.${_constants.resourceExtension}`),
	{
		minWorkers: 1,
		maxWorkers: 4,
	},
	['get', 'set', 'remove', 'updateStatus']
)

const getData = async (key, options) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('get', [
			_constants.dataPath,
			key,
			'br',
			options,
		])

		if (result && result.status === 200) {
			result.data = _fs2.default.readFileSync(result.response)
		}

		return result
	} catch (err) {
		_ConsoleHandler2.default.error(err)
		return
	} finally {
		freePool.terminate()
	}
}
exports.getData = getData // getData
const getStore = async (key, options) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('get', [
			_constants.storePath,
			key,
			'json',
			options,
		])

		if (result && result.status === 200) {
			const tmpData = _fs2.default.readFileSync(result.response)
			result.data = tmpData ? JSON.parse(tmpData) : tmpData
		}

		return result
	} catch (err) {
		_ConsoleHandler2.default.error(err)
		return
	} finally {
		freePool.terminate()
	}
}
exports.getStore = getStore // getStore

const setData = async (key, content, options) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('set', [
			_constants.dataPath,
			key,
			'br',
			content,
			options,
		])
		return result
	} catch (err) {
		_ConsoleHandler2.default.error(err)
		return
	} finally {
		freePool.terminate()
	}
}
exports.setData = setData // setData
const setStore = async (key, content) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('set', [
			_constants.storePath,
			key,
			'json',
			content,
			{
				isCompress: false,
			},
		])
		return result
	} catch (err) {
		_ConsoleHandler2.default.error(err)
		return
	} finally {
		freePool.terminate()
	}
}
exports.setStore = setStore // setStore

const removeData = async (key) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('remove', [_constants.dataPath, key, 'br'])
		return result
	} catch (err) {
		_ConsoleHandler2.default.error(err)
		return
	} finally {
		freePool.terminate()
	}
}
exports.removeData = removeData // removeData
const removeStore = async (key) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		const result = await pool.exec('remove', [_constants.storePath, key])
		return result
	} catch (err) {
		_ConsoleHandler2.default.error(err)
		return
	} finally {
		freePool.terminate()
	}
}
exports.removeStore = removeStore // removeStore

const updateDataStatus = (key, newStatus) => {
	const freePool = workerManager.getFreePool()
	const pool = freePool.pool

	try {
		pool.exec('updateStatus', [_constants.dataPath, key, 'br', newStatus])
	} catch (err) {
		_ConsoleHandler2.default.error(err)
		return
	} finally {
		freePool.terminate()
	}
}
exports.updateDataStatus = updateDataStatus // updateDataStatus
