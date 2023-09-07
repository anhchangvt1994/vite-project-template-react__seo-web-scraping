import fs from 'fs'
import path from 'path'

const serverInfoPath = path.resolve(__dirname, '../server-info.json')

let serverInfoStringify

if (fs.existsSync(serverInfoPath)) {
	serverInfoStringify = fs.readFileSync(serverInfoPath)
}

let serverInfo
if (serverInfoStringify) {
	try {
		serverInfo = JSON.parse(serverInfoStringify)
	} catch (err) {
		console.error(err)
	}
}

export { serverInfo }

export const pagesPath =
	!serverInfo || serverInfo.isServer
		? (() => {
				const tmpPath = '/tmp'
				if (fs.existsSync(tmpPath)) return tmpPath + '/pages'

				return path.resolve(
					__dirname,
					'./puppeteer-ssr/utils/Cache.worker/pages'
				)
		  })()
		: path.resolve(__dirname, './puppeteer-ssr/utils/Cache.worker/pages')

export const userDataPath =
	!serverInfo || serverInfo.isServer
		? (() => {
				const tmpPath = '/tmp'
				if (fs.existsSync(tmpPath)) return tmpPath + '/browsers'

				return path.resolve(__dirname, './puppeteer-ssr/browsers')
		  })()
		: path.resolve(__dirname, './puppeteer-ssr/browsers')

export const resourceExtension =
	!serverInfo || serverInfo.isServer ? 'js' : 'ts'

export const SERVER_LESS = !!process.env.SERVER_LESS
export const ENV = ['development', 'production'].includes(
	process.env.ENV as string
)
	? process.env.ENV
	: 'production'
