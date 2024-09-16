import { Request } from 'express'

const detectStaticExtension = (req: Request) => {
	const url = req.url

	if (
		!url ||
		/^.*(text\/html|application\/json)/.test(req.headers['accept'] as string)
	) {
		return false
	}

	let isStatic = false
	isStatic =
		/[A-Za-z0-9-]+\.(vue|ts|js|css|gif|jpg|jpeg|png|ico|bmp|ogg|webp|mp4|webm|mp3|ttf|woff|json|rss|atom|gz|zip|rar|7z|css|js|gzip|exe|svg|pdf|docx)(\?[^\/]*)?$/g.test(
			url
		) ||
		/\/(image|asset|video|audio|mp3|mp4|movie|font|css|js|lib|util|plugin|page|component)+(|s)+\//g.test(
			url
		)

	return isStatic
}

export default detectStaticExtension
