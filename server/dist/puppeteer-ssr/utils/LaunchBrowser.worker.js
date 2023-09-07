'use strict'
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)
var _puppeteercore = require('puppeteer-core')
var _puppeteercore2 = _interopRequireDefault(_puppeteercore)

const chromium = require('@sparticuz/chromium-min')

const launch = async (executablePath) => {
	if (!executablePath) return
	const browser = await _puppeteercore2.default.launch({
		executablePath,
		args: chromium.args,
		defaultViewport: chromium.defaultViewport,
		headless: chromium.headless,
		ignoreHTTPSErrors: true,
	})

	return browser.wsEndpoint()
}
// create a worker and register public functions
_workerpool2.default.worker({
	launch,
})
