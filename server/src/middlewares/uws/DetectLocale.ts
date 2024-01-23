import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import detectLocale from '../../utils/DetectLocale.uws'
import ServerConfig from '../../server.config'
import { getStore, setStore } from '../../store'

const DetectLocaleMiddle = (res: HttpResponse, req: HttpRequest) => {
	if (!res.cookies) res.cookies = {}

	res.cookies.localeInfo = (() => {
		const tmpLocaleInfo =
			req.getHeader('localeinfo') || req.getHeader('localeInfo')

		if (tmpLocaleInfo) return JSON.parse(tmpLocaleInfo)
		return detectLocale(req)
	})()

	if (!process.env.IS_REMOTE_CRAWLER) {
		const headersStore = getStore('headers')
		headersStore.localeInfo = JSON.stringify(res.cookies.localeInfo)
		setStore('headers', headersStore)
	}

	const enableLocale =
		ServerConfig.locale.enable &&
		Boolean(
			!ServerConfig.locale.routes ||
				!ServerConfig.locale.routes[req.getUrl() as string] ||
				ServerConfig.locale.routes[req.getUrl() as string].enable
		)

	if (enableLocale) {
		res.cookies.lang =
			res.cookies.localeInfo?.langSelected ?? ServerConfig.locale.defaultLang

		if (ServerConfig.locale.defaultCountry) {
			res.cookies.country =
				res.cookies.localeInfo?.countrySelected ??
				ServerConfig.locale.defaultCountry
		}
	}
}

export default DetectLocaleMiddle
