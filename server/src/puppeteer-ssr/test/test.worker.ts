import puppeteer from 'puppeteer-core'
import WorkerPool from 'workerpool'
import { defaultBrowserOptions, optionArgs } from '../constants'
import { resolve } from 'path'

const _deleteUserDataDir = async (path: string) => {
	if (path) {
		try {
			await WorkerPool.pool(
				resolve(__dirname, '../utils/FollowResource.worker/index.ts')
			)?.exec('deleteResource', [path])
		} catch (err) {
			console.error(err)
		}
	}
} // _deleteUserDataDir

const loadCapacityTest = async (url) => {
	const userDataDir = `server/src/puppeteer-ssr/test/browsers/user_data_${Date.now()}`
	const browser = await puppeteer.launch({
		...defaultBrowserOptions,
		headless: 'new',
		userDataDir,
		args: [
			...optionArgs,
			'--user-agent=Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
			'--headless',
		],
	})

	if (browser.isConnected()) {
		const page = await browser.newPage()
		const response = await page.goto(url)
		console.log('-------------')
		if (response?.status() === 200) {
			console.log('\x1b[32m', 'Success!')
			console.log('url :', url)
		} else {
			console.log('\x1b[31m', 'Fail!')
			console.log('url :', url)
		}
		console.log('-------------')
		await browser.close()
		_deleteUserDataDir(userDataDir)
	}
}

WorkerPool.worker({
	loadCapacityTest,
})
