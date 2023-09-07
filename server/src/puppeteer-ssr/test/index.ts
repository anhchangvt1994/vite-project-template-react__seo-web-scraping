import WokerPool from 'workerpool'
import { urlList } from './constants'

const testPuppeteerSSRService = (() => {
	const _init = () => {
		const TestPool = WokerPool.pool(__dirname + '/test.worker.ts', {
			minWorkers: 1,
			maxWorkers: 10,
		})

		const domain = 'https://webpack-vue-puppeteer-ssr.onrender.com/'
		urlList.forEach(async (url) => {
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

export default testPuppeteerSSRService
