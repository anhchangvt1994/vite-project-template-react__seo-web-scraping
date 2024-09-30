'use strict'
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

var _zlib = require('zlib')
var _ConsoleHandler = require('../ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _utils = require('./utils')
var _CryptoHandler = require('../CryptoHandler')
var _serverconfig = require('../../server.config')
var _serverconfig2 = _interopRequireDefault(_serverconfig)

const deleteResource = (path) => {
	return _utils.deleteResource.call(void 0, path)
} //  deleteResource

const getFileInfo = async (file) => {
	if (!file) {
		_ConsoleHandler2.default.error('Need provide "file" param!')
		return
	}

	const result = await new Promise((res) => {
		_fs2.default.stat(file, (err, stats) => {
			if (err) {
				_ConsoleHandler2.default.error(err)
				res(undefined)
				return
			}

			res({
				size: stats.size,
				createdAt: stats.birthtimeMs,
				updatedAt: stats.mtimeMs,
				requestedAt: stats.atimeMs,
			})
		})
	})

	return result
} // getFileInfo

const checkToCleanFile = async (file, { schedule, validRequestAtDuration }) => {
	if (!file) {
		_ConsoleHandler2.default.error('Need provide "file" to delete!')
		return false
	}

	schedule = schedule || 30000

	const result = await new Promise(async (res) => {
		file = _fs2.default.existsSync(file) ? file : file.replace('.raw', '')
		if (_fs2.default.existsSync(file)) {
			const info = await getFileInfo(file)
			validRequestAtDuration = validRequestAtDuration || schedule / 2

			if (!info) {
				// WorkerPool.pool().terminate()
				return res(false)
			}

			const curTime = Date.now()
			const requestedAt = new Date(info.requestedAt).getTime()
			const updatedAt = new Date(info.updatedAt).getTime()
			const duration =
				curTime - (requestedAt > updatedAt ? requestedAt : updatedAt)

			if (duration > validRequestAtDuration) {
				let unlinkFinish = true
				try {
					deleteResource(file)
					_ConsoleHandler2.default.log(`File ${file} was permanently deleted`)
				} catch (err) {
					_ConsoleHandler2.default.error(err)
					unlinkFinish = false
				}

				return res(unlinkFinish)
			} else {
				return res('update')
			}
		}
	})

	return result
	// WorkerPool.pool().terminate()
} // checkToCleanFile

const scanToCleanBrowsers = async (dirPath, expiredTime = 1, browserStore) => {
	if (_fs2.default.existsSync(dirPath)) {
		const browserList = _fs2.default.readdirSync(dirPath)

		const curUserDataPath = browserStore.userDataPath
			? _path2.default.join('', browserStore.userDataPath)
			: ''
		const reserveUserDataPath = browserStore.reserveUserDataPath
			? _path2.default.join('', browserStore.reserveUserDataPath)
			: ''

		for (const file of browserList) {
			const absolutePath = _path2.default.join(dirPath, file)

			if (
				absolutePath === curUserDataPath ||
				absolutePath === reserveUserDataPath
			) {
				continue
			}

			const dirExistTimeInMinutes =
				(Date.now() -
					new Date(_fs2.default.statSync(absolutePath).mtime).getTime()) /
				60000

			if (dirExistTimeInMinutes >= expiredTime) {
				// NOTE - Remove without check pages
				try {
					deleteResource(absolutePath)
				} catch (err) {
					_ConsoleHandler2.default.error(err)
				}
			}
		}
	}
} // scanToCleanBrowsers

const scanToCleanPages = (dirPath) => {
	if (_fs2.default.existsSync(dirPath)) {
		const pageList = _fs2.default.readdirSync(dirPath)

		for (const file of pageList) {
			const urlInfo = new URL(
				_CryptoHandler.decryptCrawlerKeyCache.call(void 0, file.split('.')[0])
			)

			const expiredTime =
				process.env.MODE === 'development'
					? 0
					: _serverconfig2.default.crawl.routes[urlInfo.pathname].cache.time ||
					  _serverconfig2.default.crawl.cache.time

			if (expiredTime === 'infinite') {
				continue
			}

			const absolutePath = _path2.default.join(dirPath, file)
			const dirExistTimeInMinutes =
				(Date.now() -
					new Date(_fs2.default.statSync(absolutePath).atime).getTime()) /
				1000

			if (dirExistTimeInMinutes >= expiredTime) {
				try {
					_fs2.default.unlinkSync(absolutePath)
				} catch (err) {
					_ConsoleHandler2.default.error(err)
				}
			}
		}
	}
	// else {
	// res(null)
	// }
} // scanToCleanPages

const scanToCleanAPIDataCache = async (dirPath) => {
	if (!dirPath) {
		_ConsoleHandler2.default.error('You need to provide dirPath param!')
		return
	}

	const apiCacheList = _fs2.default.readdirSync(dirPath)

	if (!apiCacheList || !apiCacheList.length) return

	const chunkSize = 50

	const arrPromise = []
	const curTime = Date.now()

	for (let i = 0; i < apiCacheList.length; i += chunkSize) {
		arrPromise.push(
			new Promise(async (resolve) => {
				let timeout
				const arrChunked = apiCacheList.slice(i, i + chunkSize)
				for (const item of arrChunked) {
					if (item.includes('.fetch')) continue

					const absolutePath = _path2.default.join(dirPath, item)

					if (!_fs2.default.existsSync(absolutePath)) continue
					const fileInfo = await getFileInfo(absolutePath)

					if (!_optionalChain([fileInfo, 'optionalAccess', (_) => _.size]))
						continue

					const fileContent = (() => {
						const tmpContent = _fs2.default.readFileSync(absolutePath)

						return JSON.parse(
							_zlib.brotliDecompressSync.call(void 0, tmpContent).toString()
						)
					})()

					const expiredTime = fileContent.cache
						? fileContent.cache.expiredTime
						: 60000

					if (
						curTime - new Date(fileInfo.requestedAt).getTime() >=
						expiredTime
					) {
						if (timeout) clearTimeout(timeout)
						try {
							_fs2.default.unlink(absolutePath, () => {})
						} catch (err) {
							_ConsoleHandler2.default.error(err)
						} finally {
							timeout = setTimeout(() => {
								resolve('complete')
							}, 100)
						}
					}
				}

				if (timeout) clearTimeout(timeout)
				timeout = setTimeout(() => {
					resolve('complete')
				}, 100)
			})
		)
	}

	await Promise.all(arrPromise)

	return 'complete'
} // scanToCleanAPIDataCache

const scanToCleanAPIStoreCache = async (dirPath) => {
	if (!dirPath) {
		_ConsoleHandler2.default.error('You need to provide dirPath param!')
		return
	}

	const apiCacheList = _fs2.default.readdirSync(dirPath)

	if (!apiCacheList || !apiCacheList.length) return

	const chunkSize = 50

	const arrPromise = []
	const curTime = Date.now()

	for (let i = 0; i < apiCacheList.length; i += chunkSize) {
		arrPromise.push(
			new Promise(async (resolve) => {
				let timeout
				const arrChunked = apiCacheList.slice(i, i + chunkSize)
				for (const item of arrChunked) {
					const absolutePath = _path2.default.join(dirPath, item)

					if (!_fs2.default.existsSync(absolutePath)) continue
					const fileInfo = await getFileInfo(absolutePath)

					if (!_optionalChain([fileInfo, 'optionalAccess', (_2) => _2.size]))
						continue

					if (curTime - new Date(fileInfo.requestedAt).getTime() >= 300000) {
						if (timeout) clearTimeout(timeout)
						try {
							_fs2.default.unlink(absolutePath, () => {})
						} catch (err) {
							_ConsoleHandler2.default.error(err)
						} finally {
							timeout = setTimeout(() => {
								resolve('complete')
							}, 100)
						}
					}
				}

				if (timeout) clearTimeout(timeout)
				timeout = setTimeout(() => {
					resolve('complete')
				}, 100)
			})
		)
	}

	await Promise.all(arrPromise)

	return 'complete'
} // scanToCleanAPIStoreCache

_workerpool2.default.worker({
	checkToCleanFile,
	scanToCleanBrowsers,
	scanToCleanPages,
	scanToCleanAPIDataCache,
	scanToCleanAPIStoreCache,
	deleteResource,
	finish: () => {
		return 'finish'
	},
})
