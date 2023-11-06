import { HttpRequest } from 'uWebSockets.js'
import Console from './ConsoleHandler'

export const getCookieFromRequest = (req: HttpRequest) => {
	if (!req) {
		Console.error('Need provide raw request headers!')
		return
	}

	const cookie = req.getHeader('cookie')

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
