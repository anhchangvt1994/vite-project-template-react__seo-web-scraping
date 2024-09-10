import Chromium from '@sparticuz/chromium-min'
import path from 'path'
import {
	SERVER_LESS,
	dataPath,
	pagesPath,
	resourceExtension,
	storePath,
	userDataPath,
	workerManagerPath,
} from '../constants'
import { canUseLinuxChromium, chromiumPath } from '../puppeteer-ssr/constants'
import ServerConfig from '../server.config'
import { getStore, setStore } from '../store'
import Console from './ConsoleHandler'
import { PROCESS_ENV } from './InitEnv'
import WorkerManager from './WorkerManager'

const { isMainThread } = require('worker_threads')

let isFirstInitCompleted = false

const workerManager = (() => {
	if (!isMainThread) return
	return WorkerManager.init(
		path.resolve(
			__dirname,
			`./FollowResource.worker/index.${resourceExtension}`
		),
		{
			minWorkers: 1,
			maxWorkers: 5,
		},
		[
			'scanToCleanBrowsers',
			'scanToCleanPages',
			'scanToCleanAPIDataCache',
			'deleteResource',
		]
	)
})()

const CleanerService = async (force = false) => {
	if (isFirstInitCompleted && !force) return
	if (!process.env.PUPPETEER_SKIP_DOWNLOAD && !canUseLinuxChromium) {
		if (!workerManager) return

		// NOTE - Browsers Cleaner
		const cleanBrowsers = (() => {
			let executablePath: string
			return async (
				durationValidToKeep = PROCESS_ENV.RESET_RESOURCE ? 0 : 1
			) => {
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

				const freePool = await workerManager.getFreePool()
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
				}

				freePool.terminate({
					force: true,
				})

				if (!SERVER_LESS)
					setTimeout(() => {
						cleanBrowsers(5)
					}, 300000)
			}
		})()

		if (process.env.MODE === 'development') cleanBrowsers(0)
		else cleanBrowsers(360)
	}

	// NOTE - Pages Cleaner
	const cleanPages = async (
		durationValidToKeep = PROCESS_ENV.RESET_RESOURCE ? 0 : 1
	) => {
		if (!workerManager) return

		const freePool = await workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanPages', [pagesPath, durationValidToKeep])
		} catch (err) {
			Console.error(err)
		}

		freePool.terminate({
			force: true,
		})

		if (!SERVER_LESS) {
			setTimeout(() => {
				cleanPages(ServerConfig.crawl.cache.time)
			}, ServerConfig.crawl.cache.time)
		}
	}

	if (process.env.MODE === 'development') cleanPages(0)
	else cleanPages(ServerConfig.crawl.cache.time)

	// NOTE - API Data Cache Cleaner
	const cleanAPIDataCache = async () => {
		if (!workerManager) return

		const freePool = await workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanAPIDataCache', [dataPath])
		} catch (err) {
			Console.error(err)
		}

		freePool.terminate({
			force: true,
		})

		if (!SERVER_LESS) {
			setTimeout(() => {
				cleanAPIDataCache()
			}, 30000)
		}
	}

	cleanAPIDataCache()

	// NOTE - API Store Cache Cleaner
	const cleanAPIStoreCache = async () => {
		if (!workerManager) return

		const freePool = await workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanAPIStoreCache', [storePath])
		} catch (err) {
			Console.error(err)
		}

		freePool.terminate({
			force: true,
		})

		if (!SERVER_LESS) {
			setTimeout(() => {
				cleanAPIStoreCache()
			}, 30000)
		}
	}

	cleanAPIStoreCache()

	// NOTE - Other cleaner
	const cleanOther = async () => {
		if (!workerManager) return

		const clean = async (path) => {
			if (!path) return

			const freePool = await workerManager.getFreePool()
			const pool = freePool.pool

			return pool.exec('deleteResource', [path])
		}

		try {
			await Promise.all([
				clean(`${userDataPath}/wsEndpoint.txt`),
				clean(`${workerManagerPath}/counter.txt`),
			])
		} catch (err) {
			Console.error(err)
		}
	}

	cleanOther()

	isFirstInitCompleted = true
}

if (!SERVER_LESS) CleanerService()

export default CleanerService
