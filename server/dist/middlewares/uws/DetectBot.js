'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _DetectBotuws = require('../../utils/DetectBot.uws')
var _DetectBotuws2 = _interopRequireDefault(_DetectBotuws)
var _store = require('../../store')

const DetectBotMiddle = (res, req) => {
	if (!res.cookies) res.cookies = {}

	res.cookies.botInfo = (() => {
		const tmpBotInfo = req.getHeader('botinfo') || req.getHeader('botInfo')

		if (tmpBotInfo) return JSON.parse(tmpBotInfo)
		return _DetectBotuws2.default.call(void 0, req)
	})()

	if (!process.env.IS_REMOTE_CRAWLER) {
		const headersStore = _store.getStore.call(void 0, 'headers')
		headersStore.botInfo = JSON.stringify(res.cookies.botInfo)
		_store.setStore.call(void 0, 'headers', headersStore)
	}
}

exports.default = DetectBotMiddle
