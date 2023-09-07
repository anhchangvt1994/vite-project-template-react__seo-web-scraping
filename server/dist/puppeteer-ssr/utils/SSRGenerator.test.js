'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _puppeteercore = require('puppeteer-core')
var _puppeteercore2 = _interopRequireDefault(_puppeteercore)
var _constants = require('../../constants')
const chromium = require('@sparticuz/chromium-min')

exports.default = (() => {
	const _init = ({
		userDataDir = () => `${_constants.userDataPath}/user_data`,
	}) => {
		const browserInit = (() => {
			const _launch = async () => {
				console.log('Khởi động browser')
				const browser = await _puppeteercore2.default.launch({
					args: chromium.args,
					defaultViewport: chromium.defaultViewport,
					executablePath: await chromium.executablePath(
						'https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v116.0.0-pack.tar'
					),
					headless: chromium.headless,
				})

				const browserVersion = await browser.version()

				console.log('browser version: ', browserVersion)
			}

			_launch()
		})()
	} // _init

	return {
		init: _init,
	}
})()
