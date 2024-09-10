import fs from 'fs'
import path from 'path'
import serveStatic from 'serve-static'
import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import { brotliCompressSync, gzipSync } from 'zlib'
import ServerConfig from '../../server.config'
import detectStaticExtension from '../../utils/DetectStaticExtension.uws'
import { ENV } from '../../utils/InitEnv'

const DetectStaticMiddle = (res: HttpResponse, req: HttpRequest) => {
	const isStatic = detectStaticExtension(req)
	/**
	 * NOTE
	 * Cache-Control max-age is 1 year
	 * calc by using:
	 * https://www.inchcalculator.com/convert/month-to-second/
	 */

	if (isStatic && !ServerConfig.isRemoteCrawler) {
		const staticPath = path.resolve(
			__dirname,
			`../../../../dist/${req.getUrl()}`
		)

		try {
			if (ENV === 'development') {
				const body = fs.readFileSync(staticPath)
				const mimeType = serveStatic.mime.lookup(staticPath)
				res
					.writeStatus('200')
					.writeHeader('Cache-Control', 'public, max-age=31556952')
					.writeHeader('Content-Type', mimeType as string)
					.end(body, true)
			} else {
				const contentEncoding = (() => {
					const tmpHeaderAcceptEncoding = req.getHeader('accept-encoding') || ''
					if (tmpHeaderAcceptEncoding.indexOf('br') !== -1) return 'br'
					else if (tmpHeaderAcceptEncoding.indexOf('gzip') !== -1) return 'gzip'
					return '' as 'br' | 'gzip' | ''
				})()
				const body = (() => {
					const content = fs.readFileSync(staticPath)
					const tmpBody =
						contentEncoding === 'br'
							? brotliCompressSync(content)
							: contentEncoding === 'gzip'
							? gzipSync(content)
							: content

					return tmpBody
				})()

				const mimeType = serveStatic.mime.lookup(staticPath)

				res
					.writeStatus('200')
					.writeHeader('Cache-Control', 'public, max-age=31556952')
					.writeHeader('Content-Encoding', contentEncoding as string)
					.writeHeader('Content-Type', mimeType as string)
					.end(body, true)
			}
		} catch {
			res.writeStatus('404').end('File not found', true)
		}

		res.writableEnded = true
	}
}

export default DetectStaticMiddle
