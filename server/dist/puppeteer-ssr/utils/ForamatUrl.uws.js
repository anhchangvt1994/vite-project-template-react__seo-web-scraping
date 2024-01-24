'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _optionalChain(ops) {
	let lastAccessLHS = undefined
	let value = ops[0]
	let i = 1
	while (i < ops.length) {
		const op = ops[i]
		const fn = ops[i + 1]
		i += 2
		if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) {
			return undefined
		}
		if (op === 'access' || op === 'optionalAccess') {
			lastAccessLHS = value
			value = fn(value)
		} else if (op === 'call' || op === 'optionalCall') {
			value = fn((...args) => value.call(lastAccessLHS, ...args))
			lastAccessLHS = undefined
		}
	}
	return value
}

var _InitEnv = require('../../utils/InitEnv')

const convertUrlHeaderToQueryString = (url, res, simulateBot = false) => {
	if (!url) return ''

	let botInfoStringify

	if (simulateBot) {
		botInfoStringify = JSON.stringify({
			isBot: true,
			name: 'puppeteer-ssr',
		})
	} else {
		botInfoStringify = JSON.stringify(
			_optionalChain([
				res,
				'access',
				(_) => _.cookies,
				'optionalAccess',
				(_2) => _2.botInfo,
			])
		)
	}

	const deviceInfoStringify = JSON.stringify(
		_optionalChain([
			res,
			'access',
			(_3) => _3.cookies,
			'optionalAccess',
			(_4) => _4.deviceInfo,
		])
	)

	const urlFormatted = `${url}${
		url.indexOf('?') === -1 ? '?' : '&'
	}botInfo=${botInfoStringify}&deviceInfo=${deviceInfoStringify}`.trim()

	return urlFormatted
}
exports.convertUrlHeaderToQueryString = convertUrlHeaderToQueryString // formatUrl

const getUrl = (res, req) => {
	if (!res) return ''

	const pathname = res.urlForCrawler

	return (
		req.getQuery('urlTesting') ||
		req.getQuery('url') ||
		_InitEnv.PROCESS_ENV.BASE_URL + pathname
	).trim()
}
exports.getUrl = getUrl // getUrl
