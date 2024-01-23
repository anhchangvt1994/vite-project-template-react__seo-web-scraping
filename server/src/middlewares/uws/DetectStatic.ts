import fs from 'fs'
import path from 'path'
import serveStatic from 'serve-static'
import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import { ENV } from '../../constants'
import detectStaticExtension from '../../utils/DetectStaticExtension.uws'
import ServerConfig from '../../server.config'

const DetectStaticMiddle = (res: HttpResponse, req: HttpRequest) => {
	const isStatic = detectStaticExtension(req)
	/**
	 * NOTE
	 * Cache-Control max-age is 1 year
	 * calc by using:
	 * https://www.inchcalculator.com/convert/month-to-second/
	 */

	if (isStatic && ServerConfig.crawler && !process.env.IS_REMOTE_CRAWLER) {
		const filePath = path.resolve(__dirname, `../../../../dist/${req.getUrl()}`)

		if (ENV !== 'development') {
			res.writeHeader('Cache-Control', 'public, max-age=31556952')
		}

		try {
			const mimeType = serveStatic.mime.lookup(filePath)
			const body = fs.readFileSync(filePath)
			res.writeHeader('Content-Type', mimeType as string).end(body)
		} catch {
			res.writeStatus('404')
			res.end('File not found')
		}

		res.writableEnded = true
	}
}

export default DetectStaticMiddle
