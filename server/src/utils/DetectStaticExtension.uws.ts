import { HttpRequest } from 'uWebSockets.js'

const detectStaticExtension = (req: HttpRequest) => {
	const url = req.getUrl()

	if (!url) {
		return false
	}

	let isStatic = false
	isStatic =
		/[A-Za-z0-9-]+\.(vue|ts|js|css|gif|jpg|jpeg|png|ico|bmp|ogg|webp|mp4|webm|mp3|ttf|woff|json|rss|atom|gz|zip|rar|7z|css|js|gzip|exe|svg|pdf|docx)(\?[^\/]*)?$/g.test(
			url
		)

	if (!isStatic) {
		isStatic = /^(?!.*(text\/html|application\/json))/.test(
			req.getHeader('accept') as string
		)
	}

	return isStatic
}

export default detectStaticExtension
