'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _DetectDeviceuws = require('../../utils/DetectDevice.uws')
var _DetectDeviceuws2 = _interopRequireDefault(_DetectDeviceuws)

const DetectDeviceMiddle = (res, req) => {
	if (!res.cookies) res.cookies = {}
	if (req.getHeader('service') === 'puppeteer') {
		res.cookies.deviceInfo = req.getHeader('deviceInfo')
			? JSON.parse(req.getHeader('deviceInfo'))
			: {}
	} else {
		res.cookies.deviceInfo = _DetectDeviceuws2.default.call(void 0, req)
	}
}

exports.default = DetectDeviceMiddle
