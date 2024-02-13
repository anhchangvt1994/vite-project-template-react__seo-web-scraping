import { ENV_MODE, PROCESS_ENV } from '../InitEnv'
import { defaultServerConfig } from './constants'
import { IServerConfig, IServerConfigOptional } from './types'

export const defineServerConfig = (options: IServerConfigOptional) => {
	const serverConfigDefined = { ...options } as IServerConfig

	for (const key in defaultServerConfig) {
		if (key === 'locale') {
			if (options[key]) {
				serverConfigDefined[key] = {
					enable: !!options[key]?.enable,
				}

				if (serverConfigDefined[key].enable)
					serverConfigDefined[key] = {
						...serverConfigDefined[key],
						defaultLang: options[key]?.defaultLang,
						defaultCountry: options[key]?.defaultCountry,
						hideDefaultLocale: !!options[key]?.hideDefaultLocale,
					}
			} else serverConfigDefined[key] = defaultServerConfig[key]

			const routes = options[key]?.routes

			if (routes) {
				let tmpRoutes = (serverConfigDefined[key].routes = {})

				for (const localeRouteKey in routes) {
					if (routes[localeRouteKey]) {
						tmpRoutes[localeRouteKey] = {
							enable:
								routes[localeRouteKey] && routes[localeRouteKey].enable
									? true
									: false,
						}

						if (tmpRoutes[localeRouteKey].enable)
							tmpRoutes[localeRouteKey] = {
								...tmpRoutes[localeRouteKey],
								defaultLang: routes[localeRouteKey]?.defaultLang,
								defaultCountry: routes[localeRouteKey]?.defaultCountry,
								hideDefaultLocale:
									routes[localeRouteKey]?.hideDefaultLocale ?? true,
							}
					} else tmpRoutes[localeRouteKey] = true
				}
			}
		} // locale

		if (key === 'isr') {
			if (options[key]) {
				serverConfigDefined[key] = {
					enable: options.isr && options.isr.enable ? true : false,
				}

				const routes = options[key]?.routes

				if (routes) {
					const tmpRoutes = (serverConfigDefined[key].routes = {})

					for (const localeRouteKey in routes) {
						if (routes[localeRouteKey]) {
							tmpRoutes[localeRouteKey] = {
								enable:
									routes[localeRouteKey] && routes[localeRouteKey].enable
										? true
										: false,
							}
						} else tmpRoutes[localeRouteKey] = true
					}
				}
			} else serverConfigDefined[key] = defaultServerConfig[key]
		} // isr
	}

	serverConfigDefined.crawler = PROCESS_ENV.IS_REMOTE_CRAWLER
		? ''
		: ENV_MODE === 'development'
		? serverConfigDefined.crawler
		: PROCESS_ENV.CRAWLER || serverConfigDefined.crawler

	serverConfigDefined.crawlerSecretKey = PROCESS_ENV.IS_REMOTE_CRAWLER
		? ''
		: ENV_MODE === 'development'
		? serverConfigDefined.crawlerSecretKey
		: PROCESS_ENV.CRAWLER_SECRET_KEY || undefined

	return serverConfigDefined as IServerConfig
}
