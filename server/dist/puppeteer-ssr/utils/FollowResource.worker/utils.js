'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)

var _ConsoleHandler = require('../../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)

const deleteResource = (path, WorkerPool) => {
	if (!path || !_fs2.default.existsSync(path))
		return _ConsoleHandler2.default.log('Path can not empty!')

	_fs2.default.rm(path, { recursive: true }, (err) => {
		if (err) {
			console.error(err)
			if (WorkerPool) {
				WorkerPool.pool().terminate()
			}

			throw err
		}

		if (WorkerPool) {
			WorkerPool.pool().terminate()
		}
	})
}
exports.deleteResource = deleteResource
