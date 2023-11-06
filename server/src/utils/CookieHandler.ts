import Console from './ConsoleHandler'

export const getCookieFromRequest = (req) => {
	if (!req) {
		Console.error('Need provide raw request headers!')
		return
	}

	const headers = req.headers
	const cookie = headers.cookie

	if (!cookie) return {}

	const cookieSplitted = cookie.split(';')
	const cookies = {}

	for (const cookieItem of cookieSplitted) {
		if (!cookieItem) continue
		const equalIndex = cookieItem.indexOf('=')
		if (equalIndex === -1) continue

		const key = cookieItem.slice(0, equalIndex)?.trim()
		if (!key) continue

		const value = cookieItem.slice(equalIndex + 1, cookieItem.length)

		cookies[key] = (() => {
			if (/^{(.|[\r\n])*?}$/.test(value)) return JSON.parse(value)
			return value || ''
		})()
	}

	return cookies
} // getCookieFromRequest

export const getCookieFromResponse = (res) => {
	if (!res) {
		Console.error('Need provide raw response headers!')
		return
	}

	const headers = res?.raws?.headers ?? res?.getHeaders?.() ?? {}
	const cookies = headers['set-cookie'] || []
	const result = {}

	for (const cookie of cookies) {
		if (cookie && cookie.includes('=')) {
			const cookieSplitted = cookie.split('=')
			result[cookieSplitted[0]] = (() => {
				const value = cookieSplitted[1].split(';')[0]
				if (/^{(.|[\r\n])*?}$/.test(value)) return JSON.parse(value)
				return value
			})()
		}
	}

	return result
} // getCookie

export const setCookie = (res, value) => {
	if (!res) {
		Console.error('Need provide raw response headers!')
		return
	} else if (!value) {
		Console.error('Need provide raw response value!')
	}

	const headers = res?.raws?.headers ?? res?.getHeaders?.() ?? {}

	const arrValue = typeof value === 'object' ? value : [value]
	const cookies = (headers['set-cookie'] || []).concat(arrValue)

	if (cookies.length) {
		if (res.setHeader) res.setHeader('Set-Cookie', cookies)
		else res.raw.setHeader('Set-Cookie', cookies)
	}
} // setCookie
