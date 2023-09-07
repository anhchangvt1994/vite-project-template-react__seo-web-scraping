import fs from 'fs'
import path from 'path'
import puppeteer, { Browser, Page } from 'puppeteer-core'
import WorkerPool from 'workerpool'
import { pagesPath, resourceExtension, userDataPath } from '../../constants'
import Console from '../../utils/ConsoleHandler'
import {
	defaultBrowserOptions,
	regexQueryStringSpecialInfo,
} from '../constants'
import { ISSRResult } from '../types'
import {
	ICacheSetParams,
	getKey as getCacheKey,
	getFileInfo,
	setRequestTimeInfo,
} from './Cache.worker/utils'
import {
	ICheckToCleanFileOptionsParam,
	ICheckToCleanResult,
} from './FollowResource.worker'
const chromium = require('@sparticuz/chromium-min')

const MAX_WORKERS = process.env.MAX_WORKERS
	? Number(process.env.MAX_WORKERS)
	: 7

const serverInfoPath = path.resolve(__dirname, '../../../server-info.json')
let serverInfoStringify

if (fs.existsSync(serverInfoPath)) {
	serverInfoStringify = fs.readFileSync(serverInfoPath)
}

let serverInfo
if (serverInfoStringify) {
	try {
		serverInfo = JSON.parse(serverInfoStringify)
	} catch (err) {
		console.error(err)
	}
}

export interface ISSRGeneratorInitParams {
	userDataDir: () => string
	isMainThread: boolean
}

export default (() => {
	const litmitEmptyContentDuration = process.env.BROWSERLESS_API_KEY
		? 1800000
		: 150000

	const _init = ({
		userDataDir = () => `${userDataPath}/user_data`,
	}: ISSRGeneratorInitParams) => {
		const deleteUserDataDir = async (path: string) => {
			if (path) {
				try {
					WorkerPool.pool(
						__dirname + `./FollowResource.worker/index.${resourceExtension}`
					)?.exec('deleteResource', [path])
				} catch (err) {
					Console.error(err)
				}
			}
		} // deleteUserDataDir

		const cache = (() => {
			const get = async (url: string) => {
				const pool = WorkerPool.pool(
					__dirname + `/Cache.worker/index.${resourceExtension}`,
					{
						minWorkers: 1,
						maxWorkers: MAX_WORKERS,
					}
				)

				try {
					const result = await pool.exec('get', [url])
					return result
				} catch (err) {
					Console.error(err)
					return
				} finally {
					pool.terminate()
				}
			} // get

			const achieve = async (url: string): Promise<ISSRResult> => {
				if (!url) {
					Console.error('Need provide "url" param!')
					return
				}

				const key = getCacheKey(url)
				let file = `${pagesPath}/${key}.html`
				let isRaw = false

				if (!fs.existsSync(file)) {
					file = `${pagesPath}/${key}.raw.html`
					isRaw = true
				}

				if (!fs.existsSync(file)) return

				const info = await getFileInfo(file)

				if (!info || info.size === 0) return

				await setRequestTimeInfo(file, new Date())

				return {
					file,
					response: file,
					createdAt: info.createdAt,
					updatedAt: info.updatedAt,
					requestedAt: new Date(),
					ttRenderMs: 200,
					available: true,
					isInit: false,
					isRaw,
				}
			} // achieve

			const set = async (params: ICacheSetParams) => {
				const pool = WorkerPool.pool(
					__dirname + `/Cache.worker/index.${resourceExtension}`,
					{
						minWorkers: 1,
						maxWorkers: MAX_WORKERS,
					}
				)

				try {
					const result = await pool.exec('set', [params])
					return result
				} catch (err) {
					Console.error(err)
					return
				} finally {
					pool.terminate()
				}
			} // set

			const clean = async (
				file: string,
				options: ICheckToCleanFileOptionsParam & {
					fail?: (
						result: ICheckToCleanResult,
						retry: ReturnType<typeof clean>
					) => void
				}
			) => {
				const { fail, ...restOfOptions } = options

				const schedule = options.schedule || 30000

				setTimeout(async () => {
					const followFileWithSchedulePool = WorkerPool.pool(
						__dirname + `./FollowResource.worker/index.${resourceExtension}`,
						{
							minWorkers: 1,
							maxWorkers: MAX_WORKERS,
						}
					)

					try {
						const result = await followFileWithSchedulePool.exec(
							'checkToCleanFile',
							[file, restOfOptions]
						)
						followFileWithSchedulePool.terminate()
						fail?.(result, () => clean(file, options))
						return result
					} catch (err) {
						Console.error(err)
						followFileWithSchedulePool.terminate()
						fail?.(false, () => clean(file, options))
						return false
					}
				}, schedule)
			} // clean

			return {
				achieve,
				get,
				set,
				clean,
			}
		})() // cache

		interface IBrowser {
			get: () => Promise<Browser | undefined>
			newPage: () => Promise<Page | undefined>
			isReady: () => boolean
		}

		const browserInit = ((): IBrowser => {
			const maxRequestPerBrowser = 20
			let totalRequests = 0
			let browserLaunch: Promise<Browser | undefined>
			// puppeteer.defaultArgs(defaultBrowserOptions)

			const __launch = async () => {
				totalRequests = 0
				// if (process.env.BROWSERLESS_API_KEY && Boolean(browserLaunch)) return

				const selfUserDataDirPath = userDataDir()

				browserLaunch = new Promise(async (res, rej) => {
					let isError = false
					let promiseBrowser
					try {
						// if (process.env.BROWSERLESS_API_KEY) {
						// 	promiseBrowser = puppeteer.connect({
						// 		browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`,
						// 	})
						// } else {
						// 	promiseBrowser = puppeteer.launch({
						// 		...defaultBrowserOptions,
						// 		userDataDir: selfUserDataDirPath,
						// 	})
						// }
						Console.log('Khởi động browser')
						promiseBrowser = await puppeteer.launch({
							args: chromium.args,
							defaultViewport: await chromium.executablePath(
								'https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v116.0.0-pack.tar'
							),
							executablePath: serverInfo.chromiumExecutablePath,
							headless: chromium.headless,
						})

						console.log(await promiseBrowser.version())
					} catch (err) {
						isError = true
						Console.log('Khởi động browser thất bại')
						Console.error(err)
					} finally {
						if (isError) return rej(undefined)
						res(promiseBrowser)
					}
				})

				Console.log(browserLaunch)

				if (browserLaunch) {
					try {
						let tabsClosed = 0
						const browser: Browser = (await browserLaunch) as Browser

						browser.on('createNewPage', async (page: Page) => {
							await new Promise((resolveCloseTab) => {
								const timeoutCloseTab = setTimeout(() => {
									if (!page.isClosed()) {
										page.close({
											runBeforeUnload: true,
										})
									}
									resolveCloseTab(null)
								}, 30000)
								page.once('close', () => {
									clearTimeout(timeoutCloseTab)
									resolveCloseTab(null)
								})
							})

							tabsClosed++

							if (tabsClosed === 20) {
								browser.close()
								deleteUserDataDir(selfUserDataDirPath)
							}
						})
					} catch (err) {
						Console.error(err)
					}
				}
			} // __launch()

			__launch()

			const _get = async () => {
				if (!_isReady()) {
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
					Console.log(await browser.version())
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
		})() // browserInit

		const autoScroll = (() => {
			const _run = async (page: Page) => {
				await page.evaluate(async () => {
					await new Promise((resolve) => {
						let totalHeight = 0
						const distance = 150
						let scrollHeight = document.body.scrollHeight
						const viewportHeight = document.documentElement.clientHeight

						if (scrollHeight - viewportHeight <= 150) resolve(null)

						const timer = setInterval(async () => {
							scrollHeight = document.body.scrollHeight
							window.scrollBy(0, distance)
							totalHeight += distance

							if (totalHeight >= scrollHeight) {
								clearInterval(timer)
								resolve(null)
							}
						}, 25)
					})
				})
			}

			return {
				run: _run,
			}
		})() // autoScroll

		const waitResponse = async (page: Page, duration: number) => {
			await new Promise((resolve) => {
				let timeout: NodeJS.Timeout
				const startTimeout = (customDuration = 0) => {
					if (timeout) clearTimeout(timeout)
					timeout = setTimeout(resolve, customDuration || duration)
				}

				startTimeout(500)

				page.on('requestfinished', () => {
					startTimeout()
				})
				page.on('requestservedfromcache', () => {
					startTimeout()
				})
				page.on('requestfailed', () => {
					startTimeout()
				})
			})
		} // waitResponse

		const handleRequest = async (
			url: string,
			isFirstRequest: boolean = false
		) => {
			Console.log('Bắt đầu tạo page mới')
			// const browser = await browserInit.get()
			const page = await browserInit?.newPage?.()

			if (!page) return
			// const page = await browserServerLessInit.newPage()
			Console.log('Tạo page mới thành công')

			let html = ''
			let status = 200
			let isGetHtmlProcessError = false
			let isCompleteGetHtmlProcess = false

			const start = Date.now()
			try {
				// networkidle0 waits for the network to be idle (no requests for 500ms).
				// The page's JS has likely produced markup by this point, but wait longer
				// if your site lazy loads, etc.
				page.waitForNetworkIdle({ idleTime: 150 })
				await page.setRequestInterception(true)
				page.on('request', (req) => {
					const resourceType = req.resourceType()

					if (resourceType === 'stylesheet') {
						req.respond({ status: 200, body: 'aborted' })
					} else if (
						/(socket.io.min.js)+(?:$)|data:image\/[a-z]*.?\;base64/.test(url) ||
						/font|image|media|imageset/.test(resourceType)
					) {
						req.abort()
					} else {
						req.continue()
					}
				})

				const specialInfo = regexQueryStringSpecialInfo.exec(url)?.groups ?? {}

				await page.setExtraHTTPHeaders({
					...specialInfo,
					service: 'puppeteer',
				})

				isCompleteGetHtmlProcess = await new Promise(async (res) => {
					Console.log(`Bắt đầu crawl url: ${url}`)

					let response
					try {
						response = await page.goto(url, {
							waitUntil: 'domcontentloaded',
							timeout: 2500,
						})
					} catch (err) {
						page.close()
						isGetHtmlProcessError = true
						res(false)
						return Console.error(err)
					}

					status = response?.status()

					Console.log('Domcontentloaded thành công!')
					Console.log(`Response status là: ${status}`)

					if (status !== 200) {
						return res(false)
					}

					if (isFirstRequest) {
						try {
							await page.waitForNavigation({
								waitUntil: 'load',
								timeout: 2500,
							})
						} catch (err) {
							if (err.name !== 'TimeoutError') {
								isGetHtmlProcessError = true
								Console.error(err)
							}
						} finally {
							if (isGetHtmlProcessError) {
								page.close()
								return res(false)
							}

							res(false)
						}
					}

					try {
						await page.waitForNavigation({
							waitUntil: 'networkidle2',
							timeout: 5000,
						})
					} catch (err) {
						if (err.name !== 'TimeoutError') {
							isGetHtmlProcessError = true
							Console.error(err)
						}
					} finally {
						if (isGetHtmlProcessError) {
							page.close()
							return res(false)
						}

						await new Promise((resolveAfterTimeout) => {
							const timeout = setTimeout(resolveAfterTimeout, 5000)
							waitResponse(page, 250).then(() => {
								clearTimeout(timeout)
								resolveAfterTimeout(null)
							})
						})

						if (!isFirstRequest) return res(true)

						try {
							html = await page.content() // serialized HTML of page DOM.
							page.close()
						} catch (err) {
							Console.error(err)
							page.close()
							isGetHtmlProcessError = true
							return res(false)
						}

						const optimizeHTMLContentPool = WorkerPool.pool(
							__dirname + `/OptimizeHtml.worker.${resourceExtension}`,
							{
								minWorkers: 1,
								maxWorkers: MAX_WORKERS,
							}
						)

						try {
							html = await optimizeHTMLContentPool.exec('compressContent', [
								html,
							])
							html = await optimizeHTMLContentPool.exec('optimizeContent', [
								html,
								true,
							])

							cache.set({
								html,
								url,
								isRaw: false,
							})
							optimizeHTMLContentPool.terminate()
						} catch (err) {
							Console.error(err)
							status = 500
							res(false)
							optimizeHTMLContentPool.terminate()
						}
					}
				})
			} catch (err) {
				Console.log('Page mới đã bị lỗi')
				Console.error(err)
				// throw new Error('page.goto/waitForSelector timed out.')
				return
			}

			if (isGetHtmlProcessError) return

			Console.log('Bắt đầu optimize nội dung file')

			const optimizeHTMLContentPool = WorkerPool.pool(
				__dirname + `/OptimizeHtml.worker.${resourceExtension}`,
				{
					minWorkers: 1,
					maxWorkers: MAX_WORKERS,
				}
			)

			try {
				html = await page.content() // serialized HTML of page DOM.
				if (isCompleteGetHtmlProcess) {
					page.close()
					html = await optimizeHTMLContentPool.exec('compressContent', [html])
				}
				html = await optimizeHTMLContentPool.exec('optimizeContent', [
					html,
					isCompleteGetHtmlProcess,
				])
			} catch (err) {
				Console.error(err)
			} finally {
				optimizeHTMLContentPool.terminate()
			}

			const ttRenderMs = Date.now() - start
			Console.info(`Headless rendered page in: ${ttRenderMs}ms`)

			const result = cache.set({
				html,
				url,
				isRaw: !isCompleteGetHtmlProcess,
			})

			return result
		} // handleRequest

		const SSRGenerator = async (url: string): Promise<ISSRResult> => {
			let result: ISSRResult
			result = await cache.achieve(url)

			if (result && !result.available) {
				const emptyContentDuration =
					Date.now() - new Date(result.updatedAt).getTime()
				if (emptyContentDuration > litmitEmptyContentDuration) {
					handleRequest(url)
				}
			} else if (!result) {
				result = await cache.get(url)

				Console.log('Kiểm tra có đủ điều kiện tạo page mới không ?')
				Console.log('result.available', result?.available)

				if (result) {
					if (result.isInit && !result.available) {
						Console.log('Chuẩn bị tạo page mới')
						handleRequest(url, true)
					}

					if (result.isInit) {
						// NOTE - Cache will be cleaned 10 minutes if requestAt time to current time larger than 30 seconds
						cache.clean(result.file, {
							schedule: process.env.BROWSERLESS_API_KEY ? 1800000 : 300000,
							validRequestAtDuration: 120000,
							fail: (result, retry) => {
								if (result === 'update') {
									handleRequest(url)
									retry()
								}
							},
						})
					}
				}
			}

			Console.log('result', result)

			return result
		} // SSRGenerator

		return SSRGenerator
	} // _init

	return {
		init: _init,
	}
})()
