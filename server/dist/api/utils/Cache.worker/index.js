'use strict'
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
function _nullishCoalesce(lhs, rhsFn) {
	if (lhs != null) {
		return lhs
	} else {
		return rhsFn()
	}
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
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)
var _zlib = require('zlib')
var _ConsoleHandler = require('../../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)

var _utils = require('./utils')

const getStatus = (directory, key, extension) => {
	switch (true) {
		case _fs2.default.existsSync(`${directory}/${key}.${extension}`):
			return 'ready'
		case _fs2.default.existsSync(`${directory}/${key}.fetch.${extension}`):
			return 'fetch'
		default:
			return
	}
} // getStatus

const updateStatus = (directory, key, extension, newStatus) => {
	const status = getStatus(directory, key, extension)

	const file = `${directory}/${key}${
		!status || status === 'ready' ? '' : '.' + status
	}.${extension}`
	const newFile = `${directory}/${key}${
		!newStatus || newStatus === 'ready' ? '' : '.' + newStatus
	}.${extension}`

	if (file !== newFile) _fs2.default.rename(file, newFile, () => {})
} // updateStatus

const get = async (directory, key, extension, options) => {
	options = {
		autoCreateIfEmpty: {
			enable: false,
		},
		...(options || {}),
	}

	if (!directory) {
		_ConsoleHandler2.default.error('Need provide "directory" param!')
		return
	}

	if (!key) {
		_ConsoleHandler2.default.error('Need provide "key" param!')
		return
	}

	const status = getStatus(directory, key, extension)
	const file = `${directory}/${key}${
		!status || status === 'ready'
			? !options.autoCreateIfEmpty.status ||
			  options.autoCreateIfEmpty.status === 'ready'
				? ''
				: '.' + options.autoCreateIfEmpty.status
			: '.' + status
	}.${extension}`

	if (!status) {
		if (!options.autoCreateIfEmpty.enable) return

		_ConsoleHandler2.default.log(`Create file ${file}`)

		try {
			_fs2.default.writeFileSync(file, '')
			_ConsoleHandler2.default.log(`File ${key}.br has been created.`)

			const curTime = new Date()

			return {
				createdAt: curTime,
				updatedAt: curTime,
				requestedAt: curTime,
				status: status || options.autoCreateIfEmpty.status,
			}
		} catch (err) {
			if (err) {
				_ConsoleHandler2.default.error(err)
				return
			}
		}
	}

	await _utils.setRequestTimeInfo.call(void 0, file, new Date())
	const info = await _utils.getFileInfo.call(void 0, file)

	if (!info || info.size === 0) {
		const curTime = new Date()
		_ConsoleHandler2.default.log(`File ${file} is empty`)
		return {
			createdAt: _nullishCoalesce(
				_optionalChain([info, 'optionalAccess', (_) => _.createdAt]),
				() => curTime
			),
			updatedAt: _nullishCoalesce(
				_optionalChain([info, 'optionalAccess', (_2) => _2.updatedAt]),
				() => curTime
			),
			requestedAt: _nullishCoalesce(
				_optionalChain([info, 'optionalAccess', (_3) => _3.requestedAt]),
				() => curTime
			),
			status: status || options.autoCreateIfEmpty.status,
		}
	}

	_ConsoleHandler2.default.log(`File ${file} is ready!`)

	const content = (() => {
		let tmpContent = _fs2.default.readFileSync(file)

		if (extension === 'br') {
			tmpContent = _zlib.brotliDecompressSync
				.call(void 0, tmpContent)
				.toString()
		} else tmpContent = tmpContent.toString('utf8')

		return JSON.parse(tmpContent)
	})()

	const objContent =
		!content || Array.isArray(content)
			? {
					data: content,
			  }
			: content

	return {
		createdAt: info.createdAt,
		updatedAt: info.updatedAt,
		requestedAt: info.requestedAt,
		status: status || options.autoCreateIfEmpty.status,
		...objContent,
	}
} // get

const set = async (directory, key, extension, content, options) => {
	if (!directory) {
		_ConsoleHandler2.default.error('Need provide "directory" param')
		return
	}

	if (!key) {
		_ConsoleHandler2.default.error('Need provide "key" param')
		return
	}

	options = {
		isCompress: true,
		status: 'ready',
		...(options ? options : {}),
	}

	const status = getStatus(directory, key, extension)
	const file = `${directory}/${key}${
		!status || status === 'ready' ? '' : '.' + status
	}.${extension}`

	// NOTE - If file is exist and isInit or not disable compress process, will be created new or updated
	const contentToSave = (() => {
		const contentToString =
			typeof content === 'string' || content instanceof Buffer
				? content
				: JSON.stringify(content)

		if (options.isCompress) {
			return Buffer.isBuffer(content)
				? content
				: _zlib.brotliCompressSync.call(void 0, contentToString)
		}

		return contentToString
	})()

	try {
		_fs2.default.writeFileSync(file, contentToSave)
		const fileTarget = `${directory}/${key}${
			!options.status || options.status === 'ready' ? '' : '.' + options.status
		}.${extension}`

		if (file !== fileTarget) _fs2.default.renameSync(file, fileTarget)
		_ConsoleHandler2.default.log(`File ${file} was updated!`)
	} catch (err) {
		_ConsoleHandler2.default.error(err)
		return
	}

	const result =
		(await get(directory, key, extension, {
			autoCreateIfEmpty: {
				enable: false,
			},
		})) ||
		(() => {
			const curTime = new Date()
			return {
				createdAt: curTime,
				updatedAt: curTime,
				requestedAt: curTime,
				status: options.status,
				...(typeof content === 'string'
					? {
							cache: content,
					  }
					: content),
			}
		})()

	return result
} // set

const remove = (directory, key, extension) => {
	if (!directory)
		return _ConsoleHandler2.default.log('Key param can not empty!')
	if (!key) return _ConsoleHandler2.default.log('Key param can not empty!')

	const status = getStatus(directory, key, extension)
	const file = `${directory}/${key}${
		!status || status === 'ready' ? '' : '.' + status
	}.${extension}`

	if (!_fs2.default.existsSync(file)) return

	try {
		_fs2.default.unlinkSync(file)
	} catch (err) {
		console.error(err)
		throw err
	}
} // remove

_workerpool2.default.worker({
	getStatus,
	updateStatus,
	get,
	set,
	remove,
	finish: () => {
		return 'finish'
	},
})
