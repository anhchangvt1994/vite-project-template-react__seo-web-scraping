import { defaultServerConfig } from './constants'
import { IServerConfig, IServerConfigOptional } from './types'

export const defineServerConfig = (options: IServerConfigOptional) => {
	const serverConfigDefined = {}

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
				serverConfigDefined[key].routes = {}

				for (const localeRouteKey in routes) {
					if (routes[localeRouteKey]) {
						serverConfigDefined[key].routes[localeRouteKey] = {
							enable:
								routes[localeRouteKey] && routes[localeRouteKey].enable
									? true
									: false,
						}

						if (serverConfigDefined[key].routes[localeRouteKey].enable)
							serverConfigDefined[key].routes[localeRouteKey] = {
								...serverConfigDefined[key].routes[localeRouteKey],
								defaultLang: routes[localeRouteKey]?.defaultLang,
								defaultCountry: routes[localeRouteKey]?.defaultCountry,
								hideDefaultLocale:
									routes[localeRouteKey]?.hideDefaultLocale ?? true,
							}
					} else serverConfigDefined[key].routes[localeRouteKey] = true
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
					serverConfigDefined[key].routes = {}

					for (const localeRouteKey in routes) {
						if (routes[localeRouteKey]) {
							serverConfigDefined[key].routes[localeRouteKey] = {
								enable:
									routes[localeRouteKey] && routes[localeRouteKey].enable
										? true
										: false,
							}
						} else serverConfigDefined[key].routes[localeRouteKey] = true
					}
				}
			} else serverConfigDefined[key] = defaultServerConfig[key]
		} // isr
	}

	return serverConfigDefined as IServerConfig
}
