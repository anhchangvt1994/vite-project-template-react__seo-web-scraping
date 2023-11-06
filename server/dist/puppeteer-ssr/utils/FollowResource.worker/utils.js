'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _fsextra = require('fs-extra')
var _fsextra2 = _interopRequireDefault(_fsextra)

var _ConsoleHandler = require('../../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)

const deleteResource = (path, WorkerPool) => {
	if (!path || !_fsextra2.default.existsSync(path))
		return _ConsoleHandler2.default.log('Path can not empty!')

	_fsextra2.default.emptyDirSync(path)
	_fsextra2.default
		.remove(path)
		.then(() => {
			if (WorkerPool) {
				WorkerPool.pool().terminate()
			}
		})
		.catch((err) => {
			if (err) {
				console.error(err)
				if (WorkerPool) {
					WorkerPool.pool().terminate()
				}
			}
		})
}
exports.deleteResource = deleteResource
