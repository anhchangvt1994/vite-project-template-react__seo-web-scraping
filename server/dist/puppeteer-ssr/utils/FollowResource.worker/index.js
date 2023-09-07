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
var _constants = require('../../../constants')
var _ConsoleHandler = require('../../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _constants3 = require('../../constants')
var _utils = require('./utils')

const canUseLinuxChromium =
	_constants.serverInfo &&
	_constants.serverInfo.isServer &&
	_constants.serverInfo.platform.toLowerCase() === 'linux'

const puppeteer = (() => {
	if (canUseLinuxChromium) return require('puppeteer-core')
	return require('puppeteer')
})()

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

const scanToCleanBrowsers = async (dirPath, durationValidToKeep = 1) => {
	await new Promise(async (res) => {
		if (_fs2.default.existsSync(dirPath)) {
			let counter = 0
			const browserList = _fs2.default.readdirSync(dirPath)

			if (!browserList.length) return res(null)

			for (const file of browserList) {
				const absolutePath = _path2.default.join(dirPath, file)
				const dirExistDurationInMinutes =
					(Date.now() -
						new Date(_fs2.default.statSync(absolutePath).mtime).getTime()) /
					60000

				if (dirExistDurationInMinutes >= durationValidToKeep) {
					const browser = await puppeteer.launch({
						..._constants3.defaultBrowserOptions,
						userDataDir: absolutePath,
					})

					const pages = await browser.pages()

					if (pages.length <= 1) {
						await browser.close()
						try {
							_optionalChain([
								_workerpool2.default,
								'access',
								(_) => _.pool,
								'call',
								(_2) => _2(_path2.default.resolve(__dirname, './index.ts')),
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
						new Date(_fs2.default.statSync(absolutePath).mtime).getTime()) /
					60000

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

_workerpool2.default.worker({
	checkToCleanFile,
	scanToCleanBrowsers,
	scanToCleanPages,
	deleteResource,
})
