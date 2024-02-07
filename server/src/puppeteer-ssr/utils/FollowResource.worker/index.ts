import Chromium from '@sparticuz/chromium-min'
import fs from 'fs'
import path from 'path'
import WorkerPool from 'workerpool'

import { Browser } from 'puppeteer-core'
import { resourceExtension } from '../../../constants'
import Console from '../../../utils/ConsoleHandler'
import { defaultBrowserOptions, puppeteer } from '../../constants'
import { deleteResource as deleteResourceWithWorker } from './utils'

type IFileInfo =
	| {
			size: number
			createdAt: number
			updatedAt: number
			requestedAt: number
	  }
	| undefined

const deleteResource = (path: string) => {
	return deleteResourceWithWorker(path, WorkerPool)
} //  deleteResource

const getFileInfo = async (file: string): Promise<IFileInfo> => {
	if (!file) {
		Console.error('Need provide "file" param!')
		return
	}

	const result = await new Promise<IFileInfo>((res) => {
		fs.stat(file, (err, stats) => {
			if (err) {
				Console.error(err)
				res(undefined)
				return
			}

			res({
				size: stats.size,
				createdAt: stats.birthtimeMs,
				updatedAt: stats.mtimeMs,
				requestedAt: stats.atimeMs,
			})
		})
	})

	return result
} // getFileInfo

export interface ICheckToCleanFileOptionsParam {
	schedule?: number
	validRequestAtDuration?: number
}

export type ICheckToCleanResult = boolean | 'update'

const checkToCleanFile = async (
	file: string,
	{ schedule, validRequestAtDuration }: ICheckToCleanFileOptionsParam
): Promise<ICheckToCleanResult> => {
	if (!file) {
		Console.error('Need provide "file" to delete!')
		return false
	}

	schedule = schedule || 30000

	const result = await new Promise(async (res) => {
		file = fs.existsSync(file) ? file : file.replace('.raw', '')
		if (fs.existsSync(file)) {
			const info = await getFileInfo(file)
			validRequestAtDuration =
				validRequestAtDuration || (schedule as number) / 2

			if (!info) {
				// WorkerPool.pool().terminate()
				return res(false)
			}

			const curTime = Date.now()
			const requestedAt = new Date(info.requestedAt).getTime()
			const updatedAt = new Date(info.updatedAt).getTime()
			const duration =
				curTime - (requestedAt > updatedAt ? requestedAt : updatedAt)

			if (duration > validRequestAtDuration) {
				let unlinkFinish = true
				try {
					deleteResource(file)
					Console.log(`File ${file} was permanently deleted`)
				} catch (err) {
					Console.error(err)
					unlinkFinish = false
				}

				return res(unlinkFinish)
			} else {
				return res('update')
			}
		}
	})

	return result as ICheckToCleanResult
	// WorkerPool.pool().terminate()
} // checkToCleanFile

const scanToCleanBrowsers = async (
	dirPath: string,
	durationValidToKeep = 1,
	browserStore
) => {
	await new Promise(async (res) => {
		if (fs.existsSync(dirPath)) {
			let counter = 0
			const browserList = fs.readdirSync(dirPath)

			if (!browserList.length) return res(null)

			const curUserDataPath = browserStore.userDataPath
				? path.join('', browserStore.userDataPath)
				: ''
			const reserveUserDataPath = browserStore.reserveUserDataPath
				? path.join('', browserStore.reserveUserDataPath)
				: ''

			for (const file of browserList) {
				const absolutePath = path.join(dirPath, file)
				if (
					absolutePath === curUserDataPath ||
					absolutePath === reserveUserDataPath
				) {
					counter++
					if (counter === browserList.length) return res(null)
					continue
				}

				const dirExistDurationInMinutes =
					(Date.now() - new Date(fs.statSync(absolutePath).mtime).getTime()) /
					60000

				if (dirExistDurationInMinutes >= durationValidToKeep) {
					const browser = await new Promise<Browser>(async (res) => {
						let promiseBrowser
						if (browserStore.executablePath) {
							promiseBrowser = await puppeteer.launch({
								...defaultBrowserOptions,
								userDataDir: absolutePath,
								args: Chromium.args,
								executablePath: browserStore.executablePath,
							})
						} else {
							promiseBrowser = await puppeteer.launch({
								...defaultBrowserOptions,
								userDataDir: absolutePath,
							})
						}

						res(promiseBrowser)
					})

					const pages = await browser.pages()

					if (pages.length <= 1) {
						await browser.close()
						try {
							await WorkerPool.pool(
								path.resolve(__dirname, `./index.${resourceExtension}`)
							)?.exec('deleteResource', [absolutePath])
						} catch (err) {
							Console.error(err)
						} finally {
							counter++

							if (counter === browserList.length) res(null)
						}
					} else {
						counter++
						if (counter === browserList.length) res(null)
					}
				} else {
					counter++
					if (counter === browserList.length) res(null)
				}
			}
		} else {
			res(null)
		}
	})
} // scanToCleanBrowsers

const scanToCleanPages = async (dirPath: string, durationValidToKeep = 1) => {
	await new Promise(async (res) => {
		if (fs.existsSync(dirPath)) {
			let counter = 0
			const pageList = fs.readdirSync(dirPath)

			if (!pageList.length) return res(null)

			for (const file of pageList) {
				const absolutePath = path.join(dirPath, file)
				const dirExistDurationInMinutes =
					(Date.now() - new Date(fs.statSync(absolutePath).atime).getTime()) /
					60000

				if (dirExistDurationInMinutes >= durationValidToKeep) {
					try {
						fs.unlinkSync(absolutePath)
					} catch (err) {
						Console.error(err)
					} finally {
						counter++

						if (counter === pageList.length) res(null)
					}
				} else {
					counter++
					if (counter === pageList.length) res(null)
				}
			}
		} else {
			res(null)
		}
	})
} // scanToCleanPages

WorkerPool.worker({
	checkToCleanFile,
	scanToCleanBrowsers,
	scanToCleanPages,
	deleteResource,
})
