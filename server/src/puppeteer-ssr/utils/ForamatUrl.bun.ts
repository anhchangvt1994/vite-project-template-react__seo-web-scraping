import { IBotInfo } from '../../types'

export const convertUrlHeaderToQueryString = (
	url: string,
	[botInfoStringify, deviceInfoStringify]: Array<string>,
	simulateBot: boolean = false
) => {
	if (!url) return ''

	if (simulateBot) {
		botInfoStringify = JSON.stringify({
			isBot: true,
			name: 'puppeteer-ssr',
		} as IBotInfo)
	}

	let urlFormatted = `${url}${
		url.indexOf('?') === -1 ? '?' : '&'
	}botInfo=${botInfoStringify}&deviceInfo=${deviceInfoStringify}`.trim()

	return urlFormatted
} // formatUrl

export const getUrl = (url) => {
	if (!url) return ''

	return (
		url.searchParams.urlTesting ||
		(process.env.BASE_URL ? process.env.BASE_URL + url.pathname : url.href)
	).trim()
} // getUrl
