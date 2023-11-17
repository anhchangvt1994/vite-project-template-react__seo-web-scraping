import Chromium from '@sparticuz/chromium-min'
import path from 'path'
import { Browser, Page } from 'puppeteer-core'
import WorkerPool from 'workerpool'
import {
	resourceExtension,
	userDataPath,
	serverInfo,
	SERVER_LESS,
} from '../../constants'
import Console from '../../utils/ConsoleHandler'
import {
	POWER_LEVEL,
	POWER_LEVEL_LIST,
	defaultBrowserOptions,
} from '../constants'

const canUseLinuxChromium =
	serverInfo &&
	serverInfo.isServer &&
	serverInfo.platform.toLowerCase() === 'linux'

const puppeteer = (() => {
	if (canUseLinuxChromium) return require('puppeteer-core')
	return require('puppeteer')
})()

export interface IBrowser {
	get: () => Promise<Browser | undefined>
	newPage: () => Promise<Page | undefined>
	isReady: () => boolean
}

export const deleteUserDataDir = async (dir: string) => {
	if (dir) {
		try {
			WorkerPool.pool(
				path.resolve(
					__dirname,
					`./FollowResource.worker/index.${resourceExtension}`
				)
			)?.exec('deleteResource', [dir])
		} catch (err) {
			Console.error(err)
		}
	}
} // deleteUserDataDir

const BrowserManager = (
	userDataDir: () => string = () => `${userDataPath}/user_data`
): IBrowser => {
	let executablePath: string

	const maxRequestPerBrowser = 20
	let totalRequests = 0
	let browserLaunch: Promise<Browser | undefined>

	const __launch = async () => {
		totalRequests = 0

		const selfUserDataDirPath = userDataDir()

		browserLaunch = new Promise(async (res, rej) => {
			let isError = false
			let promiseBrowser
			try {
				if (canUseLinuxChromium && !executablePath) {
					Console.log('Tạo executablePath')
					executablePath = await Chromium.executablePath(
						'https://github.com/Sparticuz/chromium/releases/download/v119.0.0/chromium-v119.0.0-pack.tar'
					)
				}

				if (executablePath) {
					Console.log('Khởi động browser với executablePath')
					promiseBrowser = puppeteer.launch({
						...defaultBrowserOptions,
						userDataDir: selfUserDataDirPath,
						args: Chromium.args,
						executablePath,
					})
				} else {
					promiseBrowser = puppeteer.launch({
						...defaultBrowserOptions,
						userDataDir: selfUserDataDirPath,
					})
				}
			} catch (err) {
				isError = true
				Console.error(err)
			} finally {
				if (isError) return rej(undefined)
				res(promiseBrowser)
			}
		})

		if (browserLaunch) {
			try {
				let tabsClosed = 0
				const browser: Browser = (await browserLaunch) as Browser

				browser.on('createNewPage', (async (page: Page) => {
					await new Promise((resolveCloseTab) => {
						const timeoutCloseTab = setTimeout(() => {
							if (!page.isClosed()) {
								page.close({
									runBeforeUnload: true,
								})
							}
							resolveCloseTab(null)
						}, 180000)
						page.once('close', () => {
							clearTimeout(timeoutCloseTab)
							resolveCloseTab(null)
						})
					})

					tabsClosed++

					if (!SERVER_LESS && tabsClosed === 20) {
						browser.close()
						deleteUserDataDir(selfUserDataDirPath)
					}
				}) as any)
			} catch (err) {
				Console.error(err)
			}
		}
	} // __launch()

	if (POWER_LEVEL === POWER_LEVEL_LIST.THREE) {
		__launch()
	}

	const _get = async () => {
		if (!browserLaunch || !_isReady()) {
			__launch()
		}

		totalRequests++
		const curBrowserLaunch = browserLaunch

		await new Promise((res) => setTimeout(res, (totalRequests - 1) * 1000))

		return curBrowserLaunch
	} // _get

	const _newPage = async () => {
		let browser
		let page
		try {
			browser = await _get()
			page = await browser?.newPage?.()
		} catch (err) {
			return
		}

		if (page) browser.emit('createNewPage', page)
		return page
	} // _newPage

	const _isReady = () => {
		return totalRequests <= maxRequestPerBrowser
	} // _isReady

	return {
		get: _get,
		newPage: _newPage,
		isReady: _isReady,
	}
}

export default BrowserManager
