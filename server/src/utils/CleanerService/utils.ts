import Chromium from '@sparticuz/chromium-min'
import path from 'path'
import {
	dataPath,
	pagesPath,
	resourceExtension,
	SERVER_LESS,
	storePath,
	userDataPath,
	workerManagerPath,
} from '../../constants'
import {
	canUseLinuxChromium,
	chromiumPath,
} from '../../puppeteer-ssr/constants'
import { getStore, setStore } from '../../store'
import Console from '../ConsoleHandler'
import { PROCESS_ENV } from '../InitEnv'
import WorkerManager from '../WorkerManager'
import ServerConfig from '../../server.config'

const { isMainThread } = require('worker_threads')

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

export const cleanBrowsers = (() => {
	let executablePath: string
	return async (expiredTime = PROCESS_ENV.RESET_RESOURCE ? 0 : 1) => {
		if (!isMainThread || process.env.DISABLE_INTERNAL_CRAWLER || !workerManager)
			return

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
				expiredTime,
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

		if (process.env.MODE === 'development') cleanBrowsers?.(0)
		else cleanBrowsers?.(360)
	}
})() // cleanBrowsers

export const cleanPages = (() => {
	return async () => {
		if (!isMainThread || !workerManager) return

		const freePool = await workerManager.getFreePool()
		const pool = freePool.pool

		try {
			await pool.exec('scanToCleanPages', [pagesPath])
		} catch (err) {
			Console.error(err)
		}

		freePool.terminate({
			force: true,
		})

		if (!SERVER_LESS) {
			setTimeout(() => {
				cleanPages()
			}, 1800000)
		}
	}
})() // cleanPages

export const cleanAPIDataCache = (() => {
	return async () => {
		if (!isMainThread || !workerManager) return

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
})() // cleanAPIDataCache

export const cleanAPIStoreCache = (() => {
	return async () => {
		if (!isMainThread || !workerManager) return

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
})() // cleanAPIStoreCache

export const cleanOther = (() => {
	return async () => {
		if (!isMainThread || !workerManager) return

		const clean = async (path) => {
			if (!path) return

			const freePool = await workerManager.getFreePool()
			const pool = freePool.pool

			return pool.exec('deleteResource', [path]).finally(() => {
				freePool.terminate({
					force: true,
				})
			})
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
})()
