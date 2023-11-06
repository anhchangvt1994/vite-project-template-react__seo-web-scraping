'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _DetectBotuws = require('../../utils/DetectBot.uws')
var _DetectBotuws2 = _interopRequireDefault(_DetectBotuws)

const DetectBotMiddle = (res, req) => {
	if (!res.cookies) res.cookies = {}

	if (req.getHeader('service') === 'puppeteer') {
		res.cookies.botInfo = req.getHeader('botInfo')
			? JSON.parse(req.getHeader('botInfo'))
			: {}
	} else {
		res.cookies.botInfo = _DetectBotuws2.default.call(void 0, req)
	}
}

exports.default = DetectBotMiddle
