import fs from 'fs'
import crypto from 'crypto'
import Console from '../../../utils/ConsoleHandler'
import { pagesPath } from '../../../constants'

export interface ICacheSetParams {
	html: string
	url: string
	isRaw: boolean
}

export type IFileInfo =
	| {
			size: number
			createdAt: Date
			updatedAt: Date
			requestedAt: Date
	  }
	| undefined

if (!fs.existsSync(pagesPath)) {
	fs.mkdirSync(pagesPath)
}

export const regexKeyConverter =
	/^https?:\/\/(www\.)?|^www\.|botInfo=([^&]*)&deviceInfo=([^&]*)&localeInfo=([^&]*)&environmentInfo=([^&]*)/g

export const getKey = (url) => {
	if (!url) {
		Console.error('Need provide "url" param!')
		return
	}

	// return url
	// 	.replace(regexKeyConverter, '')
	// 	.replace(/\//g, '|')
	// 	.replace('?|?&', '')
	// return url.split('?')[0].replace(/^https?:\/\/(www\.)?|^www\.|\/$/, '')
	return crypto
		.createHash('md5')
		.update(url.replace(regexKeyConverter, ''))
		.digest('hex')
} // getKey

export const getFileInfo = async (file: string): Promise<IFileInfo> => {
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
				createdAt: stats.birthtime,
				updatedAt: stats.mtime,
				requestedAt: stats.atime,
			})
		})
	})

	return result
} // getFileInfo

export const setRequestTimeInfo = async (file: string, value: unknown) => {
	if (!file || !fs.existsSync(file)) {
		Console.error('File does not exist!')
		return
	}

	let stats
	try {
		stats = fs.statSync(file)
	} catch (err) {
		Console.error(err)
	}

	try {
		const info = await getFileInfo(file)
		Console.log('file info', info)
		const fd = fs.openSync(file, 'r')
		fs.futimesSync(
			fd,
			value as typeof stats.atime,
			info?.updatedAt ?? new Date()
		)
		fs.close(fd)
		Console.log('File access time updated.')
	} catch (err) {
		Console.error(err)
	}
} // setRequestTimeInfo
