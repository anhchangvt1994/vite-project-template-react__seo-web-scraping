import Chromium from '@sparticuz/chromium-min'
import path from 'path'
import {
	SERVER_LESS,
	dataPath,
	pagesPath,
	resourceExtension,
	storePath,
	userDataPath,
} from '../constants'
import { canUseLinuxChromium, chromiumPath } from '../puppeteer-ssr/constants'
import ServerConfig from '../server.config'
import { getStore, setStore } from '../store'
import Console from './ConsoleHandler'
import { PROCESS_ENV } from './InitEnv'
import WorkerManager from './WorkerManager'

const workerManager = WorkerManager.init(
	path.resolve(__dirname, `./FollowResource.worker/index.${resourceExtension}`),
	{
		minWorkers: 1,
		maxWorkers: 4,
	},
	['scanToCleanBrowsers', 'scanToCleanPages', 'scanToCleanAPIDataCache']
)

const CleanerService = async () => {
	// NOTE - Browsers Cleaner
	const cleanBrowsers = (() => {
		let executablePath: string
		return async (durationValidToKeep = PROCESS_ENV.RESET_RESOURCE ? 0 : 1) => {
			const browserStore = (() => {
				const tmpBrowserStore = getStore('browser')
				return tmpBrowserStore || {}
			})()
			const promiseStore = (() => {
				const tmpPromiseStore = getStore('promise')
				return tmpPromiseStore || {}
			})()

			if (canUseLinuxChromium && !promiseStore.executablePath) {
				Console.log('Create executablePath')
				promiseStore.executablePath = Chromium.executablePath(chromiumPath)
			}

			setStore('browser', browserStore)
			setStore('promise', promiseStore)

			if (!executablePath && promiseStore.executablePath) {
				executablePath = await promiseStore.executablePath
			}

			const freePool = workerManager.getFreePool()
			const pool = freePool.pool

			browserStore.executablePath = executablePath

			try {
				await pool.exec('scanToCleanBrowsers', [
					userDataPath,
					durationValidToKeep,
					browserStore,
				])
			} catch (err) {
				Console.error(err)
			} finally {
				freePool.terminate()

				if (!SERVER_LESS)
					setTimeout(() => {
						cleanBrowsers(5)
					}, 300000)
			}
		}
	})()

	// if (!SERVER_LESS) cleanBrowsers()
	if (process.env.MODE === 'development') cleanBrowsers(0)
	else cleanBrowsers(360)

	// NOTE - Pages Cleaner
	const cleanPages = async (
		durationValidToKeep = PROCESS_ENV.RESET_RESOURCE ? 0 : 1
	) => {
		const freePool = workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanPages', [pagesPath, durationValidToKeep])
		} catch (err) {
			Console.error(err)
		} finally {
			freePool.terminate()

			if (!SERVER_LESS) {
				const cacheTimeHour = ServerConfig.crawl.cache.time / 3600

				setTimeout(() => {
					cleanPages(cacheTimeHour)
				}, 21600000)
			}
		}
	}

	if (process.env.MODE === 'development') cleanPages(0)
	else cleanPages(360)

	// NOTE - API Data Cache Cleaner
	const cleanAPIDataCache = async () => {
		const freePool = workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanAPIDataCache', [dataPath])
		} catch (err) {
			Console.error(err)
		} finally {
			freePool.terminate()

			if (!SERVER_LESS) {
				setTimeout(() => {
					cleanAPIDataCache()
				}, 10000)
			}
		}
	}

	if (process.env.MODE === 'development') cleanAPIDataCache()
	else cleanAPIDataCache()

	// NOTE - API Store Cache Cleaner
	const cleanAPIStoreCache = async () => {
		const freePool = workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanAPIStoreCache', [storePath])
		} catch (err) {
			Console.error(err)
		} finally {
			freePool.terminate()

			if (!SERVER_LESS) {
				setTimeout(() => {
					cleanAPIStoreCache()
				}, 10000)
			}
		}
	}

	if (process.env.MODE === 'development') cleanAPIStoreCache()
	else cleanAPIStoreCache()
}

if (!SERVER_LESS) CleanerService()

export default CleanerService
