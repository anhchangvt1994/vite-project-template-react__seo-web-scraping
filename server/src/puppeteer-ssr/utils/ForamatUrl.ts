import { Response } from 'express'
import { IBotInfo } from '../../types'

export const convertUrlHeaderToQueryString = (
	url: string,
	res: Response,
	simulateBot: boolean = false
) => {
	if (!url) return ''

	let botInfoStringify

	if (simulateBot) {
		botInfoStringify = JSON.stringify({
			isBot: true,
			name: 'puppeteer-ssr',
		} as IBotInfo)
	} else {
		botInfoStringify = res.getHeader('Bot-Info') as string
	}

	const deviceInfoStringify = res.getHeader('Device-Info') as string

	let urlFormatted = `${url}${
		url.indexOf('?') === -1 ? '?' : '&'
	}botInfo=${botInfoStringify}&deviceInfo=${deviceInfoStringify}`.trim()

	return urlFormatted
} // formatUrl

export const getUrl = (req) => {
	if (!req) return ''

	return (
		req.query.urlTesting ||
		(process.env.BASE_URL
			? process.env.BASE_URL + req.originalUrl
			: req.protocol + '://' + req.get('host') + req.originalUrl)
	).trim()
} // getUrl
