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
var _chromiummin = require('@sparticuz/chromium-min')
var _chromiummin2 = _interopRequireDefault(_chromiummin)
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)

var _zlib = require('zlib')
var _constants = require('../../constants')
var _constants3 = require('../../puppeteer-ssr/constants')
var _ConsoleHandler = require('../ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _utils = require('./utils')

const deleteResource = (path) => {
	return _utils.deleteResource.call(void 0, path, _workerpool2.default)
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

const scanToCleanBrowsers = async (
	dirPath,
	durationValidToKeep = 1,
	browserStore
) => {
	await new Promise(async (res) => {
		if (_fs2.default.existsSync(dirPath)) {
			let counter = 0
			const browserList = _fs2.default.readdirSync(dirPath)

			if (!browserList.length) return res(null)

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
					counter++
					if (counter === browserList.length) return res(null)
					continue
				}

				const dirExistDurationInMinutes =
					(Date.now() -
						new Date(_fs2.default.statSync(absolutePath).mtime).getTime()) /
					60000

				if (dirExistDurationInMinutes >= durationValidToKeep) {
					const browser = await new Promise(async (res) => {
						let promiseBrowser
						if (browserStore.executablePath) {
							promiseBrowser = await _constants3.puppeteer.launch({
								..._constants3.defaultBrowserOptions,
								userDataDir: absolutePath,
								args: _chromiummin2.default.args,
								executablePath: browserStore.executablePath,
							})
						} else {
							promiseBrowser = await _constants3.puppeteer.launch({
								..._constants3.defaultBrowserOptions,
								userDataDir: absolutePath,
							})
						}

						res(promiseBrowser)
					})

					const pages = await browser.pages()

					if (pages.length <= 1) {
						await browser.close()
						try {
							await _optionalChain([
								_workerpool2.default,
								'access',
								(_) => _.pool,
								'call',
								(_2) =>
									_2(
										_path2.default.resolve(
											__dirname,
											`./index.${_constants.resourceExtension}`
										)
									),
								'optionalAccess',
								(_3) => _3.exec,
								'call',
								(_4) => _4('deleteResource', [absolutePath]),
							])
						} catch (err) {
							_ConsoleHandler2.default.error(err)
						} finally {
							counter++

							if (counter === browserList.length) res(null)
						}
					} else {
						counter++
						if (counter === browserList.length) res(null)
					}
				} else {
					counter++
					if (counter === browserList.length) res(null)
				}
			}
		} else {
			res(null)
		}
	})
} // scanToCleanBrowsers

const scanToCleanPages = async (dirPath, durationValidToKeep = 1) => {
	await new Promise(async (res) => {
		if (_fs2.default.existsSync(dirPath)) {
			let counter = 0
			const pageList = _fs2.default.readdirSync(dirPath)

			if (!pageList.length) return res(null)

			for (const file of pageList) {
				const absolutePath = _path2.default.join(dirPath, file)
				const dirExistDurationInMinutes =
					(Date.now() -
						new Date(_fs2.default.statSync(absolutePath).atime).getTime()) /
					1000

				if (dirExistDurationInMinutes >= durationValidToKeep) {
					try {
						_fs2.default.unlinkSync(absolutePath)
					} catch (err) {
						_ConsoleHandler2.default.error(err)
					} finally {
						counter++

						if (counter === pageList.length) res(null)
					}
				} else {
					counter++
					if (counter === pageList.length) res(null)
				}
			}
		} else {
			res(null)
		}
	})
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

					if (!_optionalChain([fileInfo, 'optionalAccess', (_5) => _5.size]))
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

					if (!_optionalChain([fileInfo, 'optionalAccess', (_6) => _6.size]))
						continue

					if (curTime - new Date(fileInfo.requestedAt).getTime() >= 300000) {
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
