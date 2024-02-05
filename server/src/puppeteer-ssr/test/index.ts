import WokerPool from 'workerpool'
import { urlList } from './constants'
import { resourceExtension } from '../../constants'

const minWorkers = 1
const maxWorkers = 10

const testPuppeteerSSRService = (() => {
	const _init = () => {
		const TestPool = WokerPool.pool(
			__dirname + `/test.worker.${resourceExtension}`,
			{
				minWorkers,
				maxWorkers,
			}
		)

		const domain = 'http://localhost:8080'
		console.log('total urls: ', urlList.length)
		console.log('max workers: ', maxWorkers)
		console.log('========================>')
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
