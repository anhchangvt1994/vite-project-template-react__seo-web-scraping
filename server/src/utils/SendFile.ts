import fs from 'fs'
import Console from './ConsoleHandler'
import serveStatic from 'serve-static'

const sendFile = async (path, res, statusCode?) => {
	if (!path) return

	try {
		await new Promise((resolve, reject) => {
			fs.readFile(path, (err, buf) => {
				if (err) {
					reject(err)
					return Console.error(err)
				}

				const mimeType = serveStatic.mime.lookup(path)
				res.statusCode = statusCode || 200
				if (!res.getHeader('Content-Type'))
					res.setHeader('Content-Type', mimeType as string)
				res.end(buf)

				resolve(null)
			})
		})
	} catch (err) {
		res.statusCode = 404
		res.end('File not found')
	}
}

export default sendFile
