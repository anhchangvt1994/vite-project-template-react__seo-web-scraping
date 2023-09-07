'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)
var _constants = require('./constants')

const testPuppeteerSSRService = (() => {
	const _init = () => {
		const TestPool = _workerpool2.default.pool(__dirname + '/test.worker.ts', {
			minWorkers: 1,
			maxWorkers: 10,
		})

		const domain = 'https://webpack-vue-puppeteer-ssr.onrender.com/'
		_constants.urlList.forEach(async (url) => {
			let tmpUrl = `${domain}?urlTesting=${url}`
			try {
				TestPool.exec('loadCapacityTest', [tmpUrl])
			} catch (err) {
				console.error(err)
			}
		})
	}

	return {
		init: _init,
	}
})()

testPuppeteerSSRService.init()

exports.default = testPuppeteerSSRService
