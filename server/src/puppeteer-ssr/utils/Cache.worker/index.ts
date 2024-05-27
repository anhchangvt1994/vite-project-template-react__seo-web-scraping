import fs from 'fs'
import path from 'path'
import WorkerPool from 'workerpool'
import { brotliCompressSync } from 'zlib'
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

	let file = `${pagesPath}/${key}.br`
	let isRaw = false

	switch (true) {
		case fs.existsSync(file):
			break
		case fs.existsSync(`${pagesPath}/${key}.renew.br`):
			file = `${pagesPath}/${key}.renew.br`
			break
		default:
			file = `${pagesPath}/${key}.raw.br`
			isRaw = true
			break
	}

	if (!fs.existsSync(file)) {
		if (!options.autoCreateIfEmpty) return

		Console.log(`Create file ${file}`)

		try {
			fs.writeFileSync(file, '')
			Console.log(`File ${key}.br has been created.`)

			const curTime = new Date()

			return {
				file,
				response: maintainFile,
				status: 503,
				createdAt: curTime,
				updatedAt: curTime,
				requestedAt: curTime,
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
		const curTime = new Date()
		Console.log(`File ${file} chưa có thông tin`)
		return {
			file,
			response: maintainFile,
			status: 503,
			createdAt: info?.createdAt ?? curTime,
			updatedAt: info?.updatedAt ?? curTime,
			requestedAt: info?.requestedAt ?? curTime,
			ttRenderMs: 200,
			available: false,
			isInit: false,
			isRaw,
		}
	}

	Console.log(`File ${file} is ready!`)

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

const set = async (
	{ html, url, isRaw }: ICacheSetParams = {
		html: '',
		url: '',
		isRaw: false,
	}
): Promise<ISSRResult> => {
	const key = getKey(url)

	if (!html) {
		Console.error('Need provide "html" param')
		return
	}

	const file = `${pagesPath}/${key}${isRaw ? '.raw' : ''}.br`

	if (!isRaw) {
		if (fs.existsSync(`${pagesPath}/${key}.renew.br`))
			try {
				fs.renameSync(`${pagesPath}/${key}.renew.br`, file)
			} catch (err) {
				Console.error(err)
				return
			}
		else if (fs.existsSync(`${pagesPath}/${key}.raw.br`))
			try {
				fs.renameSync(`${pagesPath}/${key}.raw.br`, file)
			} catch (err) {
				Console.error(err)
				return
			}
	}

	// NOTE - If file is exist and isRaw or not disable compress process, will be created new or updated
	if (fs.existsSync(file)) {
		const contentCompression = Buffer.isBuffer(html)
			? html
			: brotliCompressSync(html)

		try {
			fs.writeFileSync(file, contentCompression)
			Console.log(`File ${file} was updated!`)
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

const renew = async (url) => {
	const key = getKey(url)
	let hasRenew = true

	const file = `${pagesPath}/${key}.renew.br`

	if (!fs.existsSync(file)) {
		hasRenew = false
		const curFile = (() => {
			let tmpCurFile = `${pagesPath}/${key}.br`

			switch (true) {
				case fs.existsSync(tmpCurFile):
					break
				default:
					tmpCurFile = `${pagesPath}/${key}.raw.br`
			}

			return tmpCurFile
		})()

		try {
			fs.renameSync(curFile, file)
		} catch (err) {
			Console.error(err)
			return
		}
	}

	return hasRenew
} // renew

const remove = (url: string) => {
	if (!url) return Console.log('Url can not empty!')
	const key = getKey(url)
	let file = `${pagesPath}/${key}.raw.br`

	if (!fs.existsSync(file)) {
		Console.log('Does not exist file reference url!')
		return
	}

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
	renew,
	remove,
	finish: () => {
		return 'finish'
	},
})
