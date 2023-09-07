import path from 'path'
import WorkerPool from 'workerpool'
import {
	pagesPath,
	userDataPath,
	resourceExtension,
	SERVER_LESS,
} from '../constants'
import Console from './ConsoleHandler'

const CleanerService = async () => {
	// NOTE - Browsers Cleaner
	const cleanBrowsers = async (durationValidToKeep = 1) => {
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
