import Chromium from '@sparticuz/chromium-min'
import path from 'path'
import WorkerPool from 'workerpool'
import {
	SERVER_LESS,
	pagesPath,
	resourceExtension,
	userDataPath,
} from '../constants'
import { canUseLinuxChromium, chromiumPath } from '../puppeteer-ssr/constants'
import { getStore, setStore } from '../store'
import Console from './ConsoleHandler'

const CleanerService = async () => {
	// NOTE - Browsers Cleaner
	const cleanBrowsers = (() => {
		let executablePath: string
		return async (durationValidToKeep = process.env.RESET_RESOURCE ? 0 : 1) => {
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

			const pool = WorkerPool.pool(
				path.resolve(
					__dirname,
					`../puppeteer-ssr/utils/FollowResource.worker/index.${resourceExtension}`
				)
			)

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
				pool.terminate()

				if (!SERVER_LESS)
					setTimeout(() => {
						cleanBrowsers(5)
					}, 300000)
			}
		}
	})()

	if (!SERVER_LESS) cleanBrowsers()

	// NOTE - Pages Cleaner
	const cleanPages = async (
		durationValidToKeep = process.env.RESET_RESOURCE ? 0 : 1
	) => {
		const pool = WorkerPool.pool(
			path.resolve(
				__dirname,
				`../puppeteer-ssr/utils/FollowResource.worker/index.${resourceExtension}`
			)
		)

		try {
			await pool.exec('scanToCleanPages', [pagesPath, durationValidToKeep])
		} catch (err) {
			Console.error(err)
		} finally {
			pool.terminate()

			if (!SERVER_LESS)
				setTimeout(() => {
					cleanPages(5)
				}, 300000)
		}
	}

	if (SERVER_LESS) cleanPages(10)
	else await cleanPages()
}

if (!SERVER_LESS) CleanerService()

export default CleanerService
