import fs from 'fs'
import path from 'path'
import WorkerPool from 'workerpool'
import { pagesPath } from '../../../constants'
import Console from '../../../utils/ConsoleHandler'
import { ISSRResult } from '../../types'
import {
	ICacheSetParams,
	getFileInfo,
	getKey,
	setRequestTimeInfo,
} from './utils'

const maintainFile = path.resolve(__dirname, '../../../../maintain.html')

interface IGetCacheOptionsParam {
	autoCreateIfEmpty: boolean
}

const get = async (
	url: string,
	options?: IGetCacheOptionsParam
): Promise<ISSRResult> => {
	options = options || {
		autoCreateIfEmpty: true,
	}

	if (!url) {
		Console.error('Need provide "url" param!')
		return
	}

	const key = getKey(url)
	let file = `${pagesPath}/${key}.html`
	let isRaw = false

	switch (true) {
		case fs.existsSync(file):
			break
		default:
			file = `${pagesPath}/${key}.raw.html`
			isRaw = true
			break
	}

	if (!fs.existsSync(file)) {
		if (!options.autoCreateIfEmpty) return

		Console.log(`Tạo mới file ${file}`)

		try {
			fs.writeFileSync(file, '')
			Console.log(`File ${key}.html has been created.`)

			return {
				file,
				response: maintainFile,
				status: 503,
				createdAt: new Date(),
				updatedAt: new Date(),
				requestedAt: new Date(),
				ttRenderMs: 200,
				available: false,
				isInit: true,
				isRaw,
			}
		} catch (err) {
			;(err) => {
				if (err) {
					Console.error(err)
					Console.log(err)
					return
				}
			}
		}
	}

	await setRequestTimeInfo(file, new Date())
	const info = await getFileInfo(file)

	if (!info || info.size === 0) {
		Console.log(`File ${file} chưa có thông tin`)
		return {
			file,
			response: maintainFile,
			status: 503,
			createdAt: info?.createdAt ?? new Date(),
			updatedAt: info?.updatedAt ?? new Date(),
			requestedAt: info?.requestedAt ?? new Date(),
			ttRenderMs: 200,
			available: false,
			isInit: false,
			isRaw,
		}
	}

	Console.log(`File ${file} đã có thông tin`)

	return {
		file,
		response: file,
		status: 200,
		createdAt: info.createdAt,
		updatedAt: info.updatedAt,
		requestedAt: info.requestedAt,
		ttRenderMs: 200,
		available: true,
		isInit: false,
		isRaw,
	}
} // get

const set = async ({
	html,
	url,
	isRaw = false,
}: ICacheSetParams): Promise<ISSRResult> => {
	if (!html) {
		Console.error('Need provide "html" param')
		return
	}

	const key = getKey(url)
	const file = `${pagesPath}/${key}${isRaw ? '.raw' : ''}.html`

	if (!isRaw && fs.existsSync(`${pagesPath}/${key}.raw.html`)) {
		try {
			fs.renameSync(`${pagesPath}/${key}.raw.html`, file)
		} catch (err) {
			Console.error(err)
			return
		}
	}

	if (fs.existsSync(file)) {
		try {
			fs.writeFileSync(file, html)
			Console.log(`Cập nhật nội dung cho file ${file}`)
		} catch (err) {
			Console.error(err)
			return
		}
	}

	const result = await get(url, {
		autoCreateIfEmpty: false,
	})

	return result
} // set

const remove = (url: string) => {
	if (!url) return Console.log('Url can not empty!')
	const key = getKey(url)
	let file = `${pagesPath}/${key}.raw.html`
	if (!fs.existsSync(file)) file = `${pagesPath}/${key}.html`
	if (!fs.existsSync(file))
		return Console.log('Does not exist file reference url!')

	try {
		fs.unlinkSync(file)
	} catch (err) {
		console.error(err)
		throw err
	}
} // remove

WorkerPool.worker({
	get,
	set,
	remove,
})
