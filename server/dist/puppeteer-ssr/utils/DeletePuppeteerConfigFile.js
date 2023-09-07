'use strict'
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)
var _path = require('path')
var _ConsoleHandler = require('../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)

const targetPath = _path.resolve.call(
	void 0,
	__dirname,
	'../../../.puppeteerrc.js'
)

setTimeout(() => {
	try {
		_fs2.default.unlinkSync(targetPath)
		_ConsoleHandler2.default.log(`File ${targetPath} was permanently deleted`)
	} catch (err) {
		_ConsoleHandler2.default.error(err)
	}
}, 500)
