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
import { brotliCompressSync } from 'zlib'
import { DISABLE_COMPRESS_HTML } from '../../constants'

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

	let file = `${pagesPath}/${key}.br`
	let isRaw = false

	switch (true) {
		case fs.existsSync(file):
			break
		default:
			file = `${pagesPath}/${key}.raw.br`
			isRaw = true
			break
	}

	if (!fs.existsSync(file)) {
		if (!options.autoCreateIfEmpty) return

		Console.log(`Tạo mới file ${file}`)

		try {
			fs.writeFileSync(file, '')
			Console.log(`File ${key}.br has been created.`)

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
			if (err) {
				Console.error(err)
				return {
					ttRenderMs: 200,
					available: false,
					isInit: true,
				} as ISSRResult
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
	const file = `${pagesPath}/${key}${isRaw ? '.raw' : ''}.br`

	if (!isRaw && fs.existsSync(`${pagesPath}/${key}.raw.br`)) {
		try {
			fs.renameSync(`${pagesPath}/${key}.raw.br`, file)
		} catch (err) {
			Console.error(err)
			return
		}
	}

	// NOTE - If file is exist and isRaw or not disable compress process, will be created new or updated
	if (fs.existsSync(file) && (isRaw || !DISABLE_COMPRESS_HTML)) {
		const contentCompression = Buffer.isBuffer(html)
			? html
			: brotliCompressSync(html)
		try {
			fs.writeFileSync(file, contentCompression)
			Console.log(`Cập nhật nội dung cho file ${file}`)
		} catch (err) {
			Console.error(err)
			return
		}
	}

	const result =
		(await get(url, {
			autoCreateIfEmpty: false,
		})) || ({ html, status: 200 } as ISSRResult)

	return result
} // set

const remove = (url: string) => {
	if (!url) return Console.log('Url can not empty!')
	const key = getKey(url)
	let file = `${pagesPath}/${key}.raw.br`
	if (!fs.existsSync(file)) file = `${pagesPath}/${key}.br`
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
