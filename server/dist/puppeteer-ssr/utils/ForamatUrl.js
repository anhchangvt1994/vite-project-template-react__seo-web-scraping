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

var _CookieHandler = require('../../utils/CookieHandler')

const convertUrlHeaderToQueryString = (url, res, simulateBot = false) => {
	if (!url) return ''

	const cookies = _CookieHandler.getCookieFromResponse.call(void 0, res)
	let botInfoStringify

	if (simulateBot) {
		botInfoStringify = JSON.stringify({
			isBot: true,
			name: 'puppeteer-ssr',
		})
	} else {
		botInfoStringify = JSON.stringify(
			_optionalChain([cookies, 'optionalAccess', (_) => _['BotInfo']])
		)
	}

	const deviceInfoStringify = JSON.stringify(
		_optionalChain([cookies, 'optionalAccess', (_2) => _2['DeviceInfo']])
	)

	let urlFormatted = `${url}${
		url.indexOf('?') === -1 ? '?' : '&'
	}botInfo=${botInfoStringify}&deviceInfo=${deviceInfoStringify}`.trim()

	return urlFormatted
}
exports.convertUrlHeaderToQueryString = convertUrlHeaderToQueryString // formatUrl

const getUrl = (req) => {
	if (!req) return ''

	const pathname = _optionalChain([
		req,
		'access',
		(_3) => _3.url,
		'optionalAccess',
		(_4) => _4.split,
		'call',
		(_5) => _5('?'),
		'access',
		(_6) => _6[0],
	])

	return (
		req.query.urlTesting ||
		(process.env.BASE_URL
			? process.env.BASE_URL + pathname
			: req.protocol + '://' + req.get('host') + pathname)
	).trim()
}
exports.getUrl = getUrl // getUrl
