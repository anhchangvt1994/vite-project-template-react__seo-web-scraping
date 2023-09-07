'use strict'
Object.defineProperty(exports, '__esModule', { value: true })

const convertUrlHeaderToQueryString = (url, res, simulateBot = false) => {
	if (!url) return ''

	let botInfoStringify

	if (simulateBot) {
		botInfoStringify = JSON.stringify({
			isBot: true,
			name: 'puppeteer-ssr',
		})
	} else {
		botInfoStringify = res.getHeader('Bot-Info')
	}

	const deviceInfoStringify = res.getHeader('Device-Info')

	let urlFormatted = `${url}${
		url.indexOf('?') === -1 ? '?' : '&'
	}botInfo=${botInfoStringify}&deviceInfo=${deviceInfoStringify}`.trim()

	return urlFormatted
}
exports.convertUrlHeaderToQueryString = convertUrlHeaderToQueryString // formatUrl

const getUrl = (req) => {
	if (!req) return ''

	return (
		req.query.urlTesting ||
		(process.env.BASE_URL
			? process.env.BASE_URL + req.originalUrl
			: req.protocol + '://' + req.get('host') + req.originalUrl)
	).trim()
}
exports.getUrl = getUrl // getUrl
