'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
function _optionalChain(ops) {
	let lastAccessLHS = undefined
	let value = ops[0]
	let i = 1
	while (i < ops.length) {
		const op = ops[i]
		const fn = ops[i + 1]
		i += 2
		if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) {
			return undefined
		}
		if (op === 'access' || op === 'optionalAccess') {
			lastAccessLHS = value
			value = fn(value)
		} else if (op === 'call' || op === 'optionalCall') {
			value = fn((...args) => value.call(lastAccessLHS, ...args))
			lastAccessLHS = undefined
		}
	}
	return value
}
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)
var _constants = require('../../constants')
var _serverconfig = require('../../server.config')
var _serverconfig2 = _interopRequireDefault(_serverconfig)
var _ConsoleHandler = require('../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _InitEnv = require('../../utils/InitEnv')

var _utils = require('./Cache.worker/utils')

const MAX_WORKERS = _InitEnv.PROCESS_ENV.MAX_WORKERS
	? Number(_InitEnv.PROCESS_ENV.MAX_WORKERS)
	: 7

const maintainFile = _path2.default.resolve(__dirname, '../../../maintain.html')

const CacheManager = (url) => {
	const pathname = new URL(url).pathname
	const enableToCache =
		_optionalChain([
			_serverconfig2.default,
			'access',
			(_) => _.crawl,
			'access',
			(_2) => _2.routes,
			'access',
			(_3) => _3[pathname],
			'optionalAccess',
			(_4) => _4.compress,
		]) ||
		_optionalChain([
			_serverconfig2.default,
			'access',
			(_5) => _5.crawl,
			'access',
			(_6) => _6.custom,
			'optionalCall',
			(_7) => _7(pathname),
			'optionalAccess',
			(_8) => _8.compress,
		]) ||
		_serverconfig2.default.crawl.compress

	const get = async () => {
		if (!enableToCache)
			return {
				response: maintainFile,
				status: 503,
				createdAt: new Date(),
				updatedAt: new Date(),
				requestedAt: new Date(),
				ttRenderMs: 200,
				available: false,
				isInit: true,
			}

		const pool = _workerpool2.default.pool(
			_path2.default.resolve(
				__dirname,
				`./Cache.worker/index.${_constants.resourceExtension}`
			),
			{
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
			}
		)

		try {
			const result = await pool.exec('get', [url])
			return result
		} catch (err) {
			_ConsoleHandler2.default.error(err)
			return
		} finally {
			pool.terminate()
		}
	} // get

	const achieve = async () => {
		if (!enableToCache) return
		if (!url) {
			_ConsoleHandler2.default.error('Need provide "url" param!')
			return
		}

		const key = _utils.getKey.call(void 0, url)
		let file = `${_constants.pagesPath}/${key}.br`
		let isRaw = false

		switch (true) {
			case _fs2.default.existsSync(file):
				break
			case _fs2.default.existsSync(`${_constants.pagesPath}/${key}.renew.br`):
				file = `${_constants.pagesPath}/${key}.renew.br`
				break
			default:
				file = `${_constants.pagesPath}/${key}.raw.br`
				isRaw = true
				break
		}

		if (!_fs2.default.existsSync(file)) return

		const info = await _utils.getFileInfo.call(void 0, file)

		if (!info || info.size === 0) return

		// await setRequestTimeInfo(file, new Date())

		return {
			file,
			response: file,
			status: 200,
			createdAt: info.createdAt,
			updatedAt: info.updatedAt,
			requestedAt: new Date(),
			ttRenderMs: 200,
			available: true,
			isInit: false,
			isRaw,
		}
	} // achieve

	const set = async (params) => {
		if (!enableToCache)
			return {
				html: params.html,
				response: maintainFile,
				status: params.html ? 200 : 503,
			}

		const pool = _workerpool2.default.pool(
			_path2.default.resolve(
				__dirname,
				`./Cache.worker/index.${_constants.resourceExtension}`
			),
			{
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
			}
		)

		try {
			const result = await pool.exec('set', [params])
			return result
		} catch (err) {
			_ConsoleHandler2.default.error(err)
			return
		} finally {
			pool.terminate()
		}
	} // set

	const renew = async () => {
		const pool = _workerpool2.default.pool(
			_path2.default.resolve(
				__dirname,
				`./Cache.worker/index.${_constants.resourceExtension}`
			),
			{
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
			}
		)

		try {
			const result = await pool.exec('renew', [url])
			return result
		} catch (err) {
			_ConsoleHandler2.default.error(err)
			return
		} finally {
			pool.terminate()
		}
	} // renew

	const remove = async (url) => {
		if (!enableToCache) return
		const pool = _workerpool2.default.pool(
			_path2.default.resolve(
				__dirname,
				`./Cache.worker/index.${_constants.resourceExtension}`
			),
			{
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
			}
		)

		try {
			await pool.exec('remove', [url])
		} catch (err) {
			_ConsoleHandler2.default.error(err)
			return
		} finally {
			pool.terminate()
		}
	} // remove

	return {
		achieve,
		get,
		set,
		renew,
		remove,
	}
}

exports.default = CacheManager
