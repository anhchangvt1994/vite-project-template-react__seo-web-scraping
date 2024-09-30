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

				serverConfigDefined[key] = {
					...serverConfigDefined[key],
					defaultLang: tmpOptionCastingType.defaultLang,
					defaultCountry: tmpOptionCastingType.defaultCountry,
					hideDefaultLocale: tmpOptionCastingType.hideDefaultLocale,
					routes: tmpOptionCastingType.routes || {},
					custom: tmpOptionCastingType.custom,
				}

				for (const localeRouteKey in serverConfigDefined[key].routes) {
					if (serverConfigDefined[key].routes[localeRouteKey]) {
						serverConfigDefined[key].routes[localeRouteKey] = {
							enable:
								serverConfigDefined[key].routes[localeRouteKey].enable ||
								serverConfigDefined.locale.enable,
						}

						if (serverConfigDefined[key].routes[localeRouteKey].enable) {
							serverConfigDefined[key].routes[localeRouteKey] = {
								...serverConfigDefined[key].routes[localeRouteKey],
								defaultLang:
									serverConfigDefined[key].routes[localeRouteKey]?.defaultLang,
								defaultCountry:
									serverConfigDefined[key].routes[localeRouteKey]
										?.defaultCountry,
								hideDefaultLocale:
									serverConfigDefined[key].routes[localeRouteKey]
										?.hideDefaultLocale ?? true,
							}

							if (serverConfigDefined[key].custom) {
								const customFunc = serverConfigDefined[key].custom
								serverConfigDefined[key].custom = (url: string) => {
									const tmpConfig = customFunc(url)

									return {
										enable: serverConfigDefined[key].enable,
										...tmpConfig,
									}
								}
							}
						}
					} else
						serverConfigDefined[key].routes[localeRouteKey] =
							defaultServerConfig[key]
				}
			} else serverConfigDefined[key] = defaultServerConfig[key]
		} // locale

		if (key === 'crawl') {
			if (options[key]) {
				const tmpOptionCastingType = options[key] as IServerConfig['crawl']
				serverConfigDefined[key] = {
					enable: tmpOptionCastingType.enable,
					content:
						tmpOptionCastingType.content === undefined
							? defaultServerConfig[key].content
							: tmpOptionCastingType.content,
					optimize:
						tmpOptionCastingType.optimize === undefined
							? defaultServerConfig[key].optimize
							: tmpOptionCastingType.optimize,
					compress:
						tmpOptionCastingType.compress === undefined
							? defaultServerConfig[key].compress
							: Boolean(tmpOptionCastingType.compress) ||
							  !PROCESS_ENV.DISABLE_COMPRESS,
					cache:
						tmpOptionCastingType.cache === undefined
							? defaultServerConfig[key].cache
							: {
									enable: tmpOptionCastingType.cache.enable,
									path:
										tmpOptionCastingType.cache.path ||
										defaultServerConfig[key].cache.path,
									time:
										tmpOptionCastingType.cache.time ||
										defaultServerConfig[key].cache.time,
									renewTime:
										tmpOptionCastingType.cache.renewTime ||
										defaultServerConfig[key].cache.renewTime,
							  },
					routes: tmpOptionCastingType.routes || {},
					custom: tmpOptionCastingType.custom,
				}

				for (const localeRouteKey in serverConfigDefined[key].routes) {
					if (serverConfigDefined[key].routes[localeRouteKey]) {
						serverConfigDefined[key].routes[localeRouteKey] = {
							enable:
								serverConfigDefined[key].routes[localeRouteKey].enable ||
								serverConfigDefined[key].enable,
							optimize:
								serverConfigDefined[key].routes[localeRouteKey].optimize ===
								undefined
									? defaultServerConfig[key].optimize
									: serverConfigDefined[key].routes[localeRouteKey].optimize,
							compress:
								serverConfigDefined[key].routes[localeRouteKey].compress ==
								undefined
									? defaultServerConfig[key].compress
									: Boolean(
											serverConfigDefined[key].routes[localeRouteKey].compress
									  ),
							cache: {
								enable:
									serverConfigDefined[key].routes[localeRouteKey].cache
										?.enable ?? serverConfigDefined[key].cache.enable,
								time:
									serverConfigDefined[key].routes[localeRouteKey].cache?.time ??
									serverConfigDefined[key].cache.time,
								renewTime:
									serverConfigDefined[key].routes[localeRouteKey].cache
										?.renewTime ?? serverConfigDefined[key].cache.renewTime,
							},
						}
					} else
						serverConfigDefined[key].routes[localeRouteKey] =
							defaultServerConfig[key]
				}
			} else serverConfigDefined[key] = defaultServerConfig[key]
		} // crawl

		if (key === 'api') {
			if (options[key]) {
				const tmpOptionCastingType = options[key] as IServerConfig['api']

				serverConfigDefined[key] = {
					list: tmpOptionCastingType.list || defaultServerConfig[key].list,
				}

				for (const apiKey in serverConfigDefined[key].list) {
					if (typeof serverConfigDefined[key].list[apiKey] === 'string') {
						serverConfigDefined[key].list[apiKey] = {
							secretKey: serverConfigDefined[key].list[
								apiKey
							] as unknown as string,
							headerSecretKeyName: 'Authorization',
						}

						continue
					}

					if (!serverConfigDefined[key].list[apiKey].headerSecretKeyName) {
						serverConfigDefined[key].list[apiKey].headerSecretKeyName =
							'Authorization'
					}
				}
			} else serverConfigDefined[key] = defaultServerConfig[key]
		} // api
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

	return serverConfigDefined as IServerConfig
}
