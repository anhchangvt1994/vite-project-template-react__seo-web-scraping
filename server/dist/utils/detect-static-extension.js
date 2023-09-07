'use strict'
Object.defineProperty(exports, '__esModule', { value: true })

const detectStaticExtension = (req) => {
	const url = req.url

	if (!url) {
		return false
	}

	let isStatic = false

	// return /[A-zZ-a-0-9-]\.(vue|ts|js|css|gif|jpg|jpeg|png|ico|bmp|ogg|webp|mp4|webm|mp3|ttf|woff|json|rss|atom|gz|zip|rar|7z|css|js|gzip|exe|svg|pdf|docx|)+(|\?v=.*)+(?:$)/g.test(
	// 	url
	// )
	isStatic =
		/[A-Za-z0-9-]+\.(vue|ts|js|css|gif|jpg|jpeg|png|ico|bmp|ogg|webp|mp4|webm|mp3|ttf|woff|json|rss|atom|gz|zip|rar|7z|css|js|gzip|exe|svg|pdf|docx)(\?[^\/]*)?$/g.test(
			url
		)

	if (!isStatic && req.headers['accept']) {
		isStatic = /^(?!.*text\/html)/.test(req.headers['accept'])
	}

	if (!isStatic && req.headers['sec-fetch-dest']) {
		isStatic = req.headers['sec-fetch-dest'] !== 'document'
	}

	return isStatic
}

exports.default = detectStaticExtension
