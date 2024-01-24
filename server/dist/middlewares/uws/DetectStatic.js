'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _servestatic = require('serve-static')
var _servestatic2 = _interopRequireDefault(_servestatic)

var _constants = require('../../constants')
var _serverconfig = require('../../server.config')
var _serverconfig2 = _interopRequireDefault(_serverconfig)
var _DetectStaticExtensionuws = require('../../utils/DetectStaticExtension.uws')
var _DetectStaticExtensionuws2 = _interopRequireDefault(
	_DetectStaticExtensionuws
)
var _InitEnv = require('../../utils/InitEnv')

const DetectStaticMiddle = (res, req) => {
	const isStatic = _DetectStaticExtensionuws2.default.call(void 0, req)
	/**
	 * NOTE
	 * Cache-Control max-age is 1 year
	 * calc by using:
	 * https://www.inchcalculator.com/convert/month-to-second/
	 */

	if (
		isStatic &&
		_serverconfig2.default.crawler &&
		!_InitEnv.PROCESS_ENV.IS_REMOTE_CRAWLER
	) {
		const filePath = _path2.default.resolve(
			__dirname,
			`../../../../dist/${req.getUrl()}`
		)

		if (_constants.ENV !== 'development') {
			res.writeHeader('Cache-Control', 'public, max-age=31556952')
		}

		try {
			const mimeType = _servestatic2.default.mime.lookup(filePath)
			const body = _fs2.default.readFileSync(filePath)
			res.writeHeader('Content-Type', mimeType).end(body)
		} catch (e) {
			res.writeStatus('404')
			res.end('File not found')
		}

		res.writableEnded = true
	}
}

exports.default = DetectStaticMiddle
