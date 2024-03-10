import ServerConfig from '../../server.config'
import { ENV_MODE, PROCESS_ENV } from '../InitEnv'
import { defaultServerConfig } from './constants'
import { IServerConfig, IServerConfigOptional } from './types'

export const defineServerConfig = (options: IServerConfigOptional) => {
	const serverConfigDefined = { ...options } as IServerConfig

	for (const key in defaultServerConfig) {
		if (key === 'locale') {
			if (options[key]) {
				const tmpOptionCastingType = options[key] as IServerConfig['locale']
				serverConfigDefined[key] = {
					enable: tmpOptionCastingType.enable,
					routes: {},
				}

				if (serverConfigDefined[key].enable) {
					serverConfigDefined[key] = {
						...serverConfigDefined[key],
						defaultLang: tmpOptionCastingType.defaultLang,
						defaultCountry: tmpOptionCastingType.defaultCountry,
						hideDefaultLocale: tmpOptionCastingType.hideDefaultLocale,
						routes: tmpOptionCastingType.routes || {},
					}

					for (const localeRouteKey in serverConfigDefined[key].routes) {
						if (serverConfigDefined[key].routes[localeRouteKey]) {
							serverConfigDefined[key].routes[localeRouteKey] = {
								enable: serverConfigDefined[key].routes[localeRouteKey].enable,
							}

							if (serverConfigDefined[key].routes[localeRouteKey].enable)
								serverConfigDefined[key].routes[localeRouteKey] = {
									...serverConfigDefined[key].routes[localeRouteKey],
									defaultLang:
										serverConfigDefined[key].routes[localeRouteKey]
											?.defaultLang,
									defaultCountry:
										serverConfigDefined[key].routes[localeRouteKey]
											?.defaultCountry,
									hideDefaultLocale:
										serverConfigDefined[key].routes[localeRouteKey]
											?.hideDefaultLocale ?? true,
								}
						} else
							serverConfigDefined[key].routes[localeRouteKey] =
								defaultServerConfig[key]
					}
				}
			} else serverConfigDefined[key] = defaultServerConfig[key]
		} // locale

		if (key === 'crawl') {
			if (options[key]) {
				const tmpOptionCastingType = options[key] as IServerConfig['crawl']
				serverConfigDefined[key] = {
					enable: tmpOptionCastingType.enable,
					optimize: Boolean(tmpOptionCastingType.optimize),
					compress: Boolean(tmpOptionCastingType.compress),
					cache:
						tmpOptionCastingType.cache === undefined
							? defaultServerConfig[key].cache
							: {
									enable: tmpOptionCastingType.cache.enable,
									time:
										tmpOptionCastingType.cache.time ||
										defaultServerConfig[key].cache.time,
									renewTime:
										tmpOptionCastingType.cache.renewTime ||
										defaultServerConfig[key].cache.renewTime,
							  },
					routes: tmpOptionCastingType.routes || {},
				}

				for (const localeRouteKey in serverConfigDefined[key].routes) {
					if (serverConfigDefined[key].routes[localeRouteKey]) {
						serverConfigDefined[key].routes[localeRouteKey] = {
							enable: serverConfigDefined[key].routes[localeRouteKey].enable,
							optimize: Boolean(
								serverConfigDefined[key].routes[localeRouteKey].optimize
							),
							compress: Boolean(
								serverConfigDefined[key].routes[localeRouteKey].compress
							),
							cache: {
								enable:
									serverConfigDefined[key].routes[localeRouteKey].cache.enable,
								renewTime:
									serverConfigDefined[key].routes[localeRouteKey].cache
										.renewTime || defaultServerConfig[key].cache.renewTime,
							},
						}
					} else
						serverConfigDefined[key].routes[localeRouteKey] =
							defaultServerConfig[key]
				}
			} else serverConfigDefined[key] = defaultServerConfig[key]
		} // crawl
	}

	serverConfigDefined.isRemoteCrawler =
		PROCESS_ENV.IS_REMOTE_CRAWLER === undefined
			? serverConfigDefined.isRemoteCrawler === undefined
				? defaultServerConfig.isRemoteCrawler
				: serverConfigDefined.isRemoteCrawler
			: PROCESS_ENV.IS_REMOTE_CRAWLER

	serverConfigDefined.crawler = serverConfigDefined.isRemoteCrawler
		? ''
		: ENV_MODE === 'development'
		? serverConfigDefined.crawler
		: PROCESS_ENV.CRAWLER || serverConfigDefined.crawler

	serverConfigDefined.crawlerSecretKey = serverConfigDefined.isRemoteCrawler
		? ''
		: ENV_MODE === 'development'
		? serverConfigDefined.crawlerSecretKey
		: PROCESS_ENV.CRAWLER_SECRET_KEY || undefined

	console.log(JSON.stringify(serverConfigDefined))

	return serverConfigDefined as IServerConfig
}
