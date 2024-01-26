import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import { IBotInfo } from '../../types'
import { PROCESS_ENV } from '../../utils/InitEnv'

export const convertUrlHeaderToQueryString = (
	url: string,
	res: HttpResponse,
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
		botInfoStringify = JSON.stringify(res.cookies?.botInfo)
	}

	const deviceInfoStringify = JSON.stringify(res.cookies?.deviceInfo)
	const localeInfoStringify = JSON.stringify(res.cookies?.localeInfo)
	const environmentInfoStringify = JSON.stringify(res.cookies?.environmentInfo)

	let urlFormatted = `${url}${
		url.indexOf('?') === -1 ? '?' : '&'
	}botInfo=${botInfoStringify}&deviceInfo=${deviceInfoStringify}&localeInfo=${localeInfoStringify}&environmentInfo=${environmentInfoStringify}`.trim()

	return urlFormatted
} // formatUrl

export const getUrl = (res: HttpResponse, req: HttpRequest) => {
	if (!res) return ''

	const pathname = res.urlForCrawler

	return (
		req.getQuery('urlTesting') ||
		req.getQuery('url') ||
		PROCESS_ENV.BASE_URL + pathname
	).trim()
} // getUrl
