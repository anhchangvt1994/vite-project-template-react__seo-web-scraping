'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _store = require('../../store')
var _DetectDeviceuws = require('../../utils/DetectDevice.uws')
var _DetectDeviceuws2 = _interopRequireDefault(_DetectDeviceuws)
var _InitEnv = require('../../utils/InitEnv')

const DetectDeviceMiddle = (res, req) => {
	if (!res.cookies) res.cookies = {}

	res.cookies.deviceInfo = (() => {
		const tmpDeviceInfo =
			req.getHeader('deviceinfo') || req.getHeader('deviceInfo')

		if (tmpDeviceInfo) return JSON.parse(tmpDeviceInfo)

		return _DetectDeviceuws2.default.call(void 0, req)
	})()

	if (!_InitEnv.PROCESS_ENV.IS_REMOTE_CRAWLER) {
		const headersStore = _store.getStore.call(void 0, 'headers')
		headersStore.deviceInfo = JSON.stringify(res.cookies.deviceInfo)
		_store.setStore.call(void 0, 'headers', headersStore)
	}
}

exports.default = DetectDeviceMiddle
