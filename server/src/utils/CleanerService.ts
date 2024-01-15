import Chromium from '@sparticuz/chromium-min'
import path from 'path'
import WorkerPool from 'workerpool'
import {
	SERVER_LESS,
	pagesPath,
	resourceExtension,
	serverInfo,
	userDataPath,
} from '../constants'
import { canUseLinuxChromium, chromiumPath } from '../puppeteer-ssr/constants'
import { getStore, setStore } from '../store'
import Console from './ConsoleHandler'

const CleanerService = async () => {
	// NOTE - Browsers Cleaner
	const cleanBrowsers = (() => {
		return async (durationValidToKeep = 1) => {
			const browserStore = (() => {
				const tmpBrowserStore = getStore('browser')
				return tmpBrowserStore || {}
			})()

			if (!browserStore.executablePath) {
				Console.log('Create executablePath')
				browserStore.executablePath = await Chromium.executablePath(
					chromiumPath
				)
			}

			setStore('browser', browserStore)

			console.log('browserStore_1', browserStore)

			const pool = WorkerPool.pool(
				path.resolve(
					__dirname,
					`../puppeteer-ssr/utils/FollowResource.worker/index.${resourceExtension}`
				)
			)

			try {
				await pool.exec('scanToCleanBrowsers', [
					userDataPath,
					durationValidToKeep,
					{
						userDataPath: browserStore.userDataPath,
						executablePath: await browserStore.executablePath,
					},
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
	const cleanPages = async (durationValidToKeep = 1) => {
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
