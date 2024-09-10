// import lighthouse from 'lighthouse/core/index.cjs'
import { Page } from 'puppeteer-core'
import WorkerPool from 'workerpool'
import { puppeteer } from '../../../../puppeteer-ssr/constants'
import Console from '../../../../utils/ConsoleHandler'

const _getSafePage = (page: Page | undefined) => {
	const SafePage = page

	return () => {
		if (SafePage && SafePage.isClosed()) return
		return SafePage
	}
} // _getSafePage

// const runLightHouse = async (url: string, wsEndpoint: string) => {
// 	if (!url || !wsEndpoint) return

// 	if (!_browser || !_browser.connected) {
// 		_browser = await puppeteer.connect({
// 			browserWSEndpoint: wsEndpoint,
// 		})
// 	}

// 	if (!_browser) return

// 	const page = await _browser.newPage()

// 	const safePage = _getSafePage(page)

// 	const lighthouseResult = await lighthouse(
// 		url,
// 		{
// 			output: 'html',
// 			emulatedUserAgent:
// 				'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/118.0.0.0 Safari/537.36',
// 		},
// 		undefined,
// 		safePage()
// 	)

// 	await safePage()?.close()

// 	return lighthouseResult
// } // runLighthouse

const runPageSpeed = async (url: string, wsEndpoint: string) => {
	if (!url || !wsEndpoint) return

	const browser = await puppeteer.connect({
		browserWSEndpoint: wsEndpoint,
	})

	if (!browser || !browser.connected) return

	const page = await browser.newPage()

	const safePage = _getSafePage(page)

	let pageSpeedResponse
	try {
		safePage()?.goto(url, {
			timeout: 120000,
		})

		pageSpeedResponse = await safePage()?.waitForResponse(
			(res) =>
				res.url().startsWith('https://www.googleapis.com/pagespeedonline') &&
				res.status() === 200
		)
	} catch (err) {
		Console.log(err.message)
	}

	const lighthouseResult = await new Promise(async (res) => {
		const response = await pageSpeedResponse?.json()

		if (response) res(response.lighthouseResult)
		else res(undefined)
	})

	await safePage()?.close()

	return lighthouseResult
} // runPageSpeed

const getPageSpeedUrl = async (url: string, wsEndpoint: string) => {
	if (!url || !wsEndpoint) return

	const browser = await puppeteer.connect({
		browserWSEndpoint: wsEndpoint,
	})

	if (!browser || !browser.connected) return

	const page = await browser.newPage()
	const safePage = _getSafePage(page)

	try {
		await safePage()?.goto(`https://pagespeed.web.dev/analysis?url=${url}`, {
			waitUntil: 'load',
			timeout: 0,
		})

		await new Promise((res) => setTimeout(res, 10000))

		const pageSpeedUrl = await page.url()

		await safePage()?.close()

		return { pageSpeedUrl }
	} catch (err) {
		Console.log(err.message)
		await safePage()?.close()
		return { pageSpeedUrl: '' }
	}
} // getPageSpeedUrl

WorkerPool.worker({
	// runLightHouse,
	runPageSpeed,
	getPageSpeedUrl,
	finish: () => {
		return 'finish'
	},
})
