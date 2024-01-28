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
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)
var _constants = require('../../../constants')
var _ConsoleHandler = require('../../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)

var _utils = require('./utils')
var _zlib = require('zlib')
var _constants3 = require('../../constants')

const maintainFile = _path2.default.resolve(
	__dirname,
	'../../../../maintain.html'
)

const get = async (url, options) => {
	options = options || {
		autoCreateIfEmpty: true,
	}

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
		default:
			file = `${_constants.pagesPath}/${key}.raw.br`
			isRaw = true
			break
	}

	if (!_fs2.default.existsSync(file)) {
		if (!options.autoCreateIfEmpty) return

		_ConsoleHandler2.default.log(`Tạo mới file ${file}`)

		try {
			_fs2.default.writeFileSync(file, '')
			_ConsoleHandler2.default.log(`File ${key}.br has been created.`)

			return {
				file,
				response: maintainFile,
				status: 503,
				createdAt: new Date(),
				updatedAt: new Date(),
				requestedAt: new Date(),
				ttRenderMs: 200,
				available: false,
				isInit: true,
				isRaw,
			}
		} catch (err) {
			if (err) {
				_ConsoleHandler2.default.error(err)
				return {
					ttRenderMs: 200,
					available: false,
					isInit: true,
				}
			}
		}
	}

	await _utils.setRequestTimeInfo.call(void 0, file, new Date())
	const info = await _utils.getFileInfo.call(void 0, file)

	if (!info || info.size === 0) {
		_ConsoleHandler2.default.log(`File ${file} chưa có thông tin`)
		return {
			file,
			response: maintainFile,
			status: 503,
			createdAt: _nullishCoalesce(
				_optionalChain([info, 'optionalAccess', (_) => _.createdAt]),
				() => new Date()
			),
			updatedAt: _nullishCoalesce(
				_optionalChain([info, 'optionalAccess', (_2) => _2.updatedAt]),
				() => new Date()
			),
			requestedAt: _nullishCoalesce(
				_optionalChain([info, 'optionalAccess', (_3) => _3.requestedAt]),
				() => new Date()
			),
			ttRenderMs: 200,
			available: false,
			isInit: false,
			isRaw,
		}
	}

	_ConsoleHandler2.default.log(`File ${file} đã có thông tin`)

	return {
		file,
		response: file,
		status: 200,
		createdAt: info.createdAt,
		updatedAt: info.updatedAt,
		requestedAt: info.requestedAt,
		ttRenderMs: 200,
		available: true,
		isInit: false,
		isRaw,
	}
} // get

const set = async ({ html, url, isRaw = false }) => {
	if (!html) {
		_ConsoleHandler2.default.error('Need provide "html" param')
		return
	}

	const key = _utils.getKey.call(void 0, url)
	const file = `${_constants.pagesPath}/${key}${isRaw ? '.raw' : ''}.br`

	if (
		!isRaw &&
		_fs2.default.existsSync(`${_constants.pagesPath}/${key}.raw.br`)
	) {
		try {
			_fs2.default.renameSync(`${_constants.pagesPath}/${key}.raw.br`, file)
		} catch (err) {
			_ConsoleHandler2.default.error(err)
			return
		}
	}

	// NOTE - If file is exist and isRaw or not disable compress process, will be created new or updated
	if (
		_fs2.default.existsSync(file) &&
		(isRaw || !_constants3.DISABLE_COMPRESS_HTML)
	) {
		const contentCompression = Buffer.isBuffer(html)
			? html
			: _zlib.brotliCompressSync.call(void 0, html)
		try {
			_fs2.default.writeFileSync(file, contentCompression)
			_ConsoleHandler2.default.log(`Cập nhật nội dung cho file ${file}`)
		} catch (err) {
			_ConsoleHandler2.default.error(err)
			return
		}
	}

	const result = (await get(url, {
		autoCreateIfEmpty: false,
	})) || { html, status: 200 }

	return result
} // set

const remove = (url) => {
	if (!url) return _ConsoleHandler2.default.log('Url can not empty!')
	const key = _utils.getKey.call(void 0, url)
	let file = `${_constants.pagesPath}/${key}.raw.br`
	if (!_fs2.default.existsSync(file)) file = `${_constants.pagesPath}/${key}.br`
	if (!_fs2.default.existsSync(file))
		return _ConsoleHandler2.default.log('Does not exist file reference url!')

	try {
		_fs2.default.unlinkSync(file)
	} catch (err) {
		console.error(err)
		throw err
	}
} // remove

_workerpool2.default.worker({
	get,
	set,
	remove,
})
