'use strict'
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)
var _puppeteercore = require('puppeteer-core')
var _puppeteercore2 = _interopRequireDefault(_puppeteercore)
var _ConsoleHandler = require('../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
const chromium = require('@sparticuz/chromium-min')

const launch = async () => {
	_ConsoleHandler2.default.log('Browser Worker')
	const browser = await _puppeteercore2.default.launch({
		args: chromium.args,
		defaultViewport: chromium.defaultViewport,
		executablePath: await chromium.executablePath(
			'https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v116.0.0-pack.tar'
		),
		headless: chromium.headless,
	})

	_ConsoleHandler2.default.log('browser endpoint: ', browser.wsEndpoint())

	return browser.wsEndpoint()
}

// create a worker and register public functions
_workerpool2.default.worker({
	launch,
})
