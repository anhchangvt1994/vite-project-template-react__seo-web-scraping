import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import { IBotInfo } from '../../types'
import { PROCESS_ENV } from '../../utils/InitEnv'
import ServerConfig from '../../server.config'

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

	const deviceInfoStringify = JSON.stringify({
		...(res.cookies?.deviceInfo ?? {}),
		isMobile: ServerConfig.crawl.content === 'mobile',
		type: ServerConfig.crawl.content,
	})
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

export const getPathname = (res: HttpResponse, req: HttpRequest) => {
	if (!res || !req) return

	return res.urlForCrawler || req.getUrl()
} // getPathname
