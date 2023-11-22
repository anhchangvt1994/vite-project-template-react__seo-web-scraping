'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _nullishCoalesce(lhs, rhsFn) {
	if (lhs != null) {
		return lhs
	} else {
		return rhsFn()
	}
}
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
var _constants = require('../../constants')
var _constants3 = require('./constants')

const defineServerConfig = (options) => {
	const serverConfigDefined = { ...options }

	for (const key in _constants3.defaultServerConfig) {
		if (key === 'locale') {
			if (options[key]) {
				serverConfigDefined[key] = {
					enable: !!_optionalChain([
						options,
						'access',
						(_) => _[key],
						'optionalAccess',
						(_2) => _2.enable,
					]),
				}

				if (serverConfigDefined[key].enable)
					serverConfigDefined[key] = {
						...serverConfigDefined[key],
						defaultLang: _optionalChain([
							options,
							'access',
							(_3) => _3[key],
							'optionalAccess',
							(_4) => _4.defaultLang,
						]),
						defaultCountry: _optionalChain([
							options,
							'access',
							(_5) => _5[key],
							'optionalAccess',
							(_6) => _6.defaultCountry,
						]),
						hideDefaultLocale: !!_optionalChain([
							options,
							'access',
							(_7) => _7[key],
							'optionalAccess',
							(_8) => _8.hideDefaultLocale,
						]),
					}
			} else serverConfigDefined[key] = _constants3.defaultServerConfig[key]

			const routes = _optionalChain([
				options,
				'access',
				(_9) => _9[key],
				'optionalAccess',
				(_10) => _10.routes,
			])

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
								defaultLang: _optionalChain([
									routes,
									'access',
									(_11) => _11[localeRouteKey],
									'optionalAccess',
									(_12) => _12.defaultLang,
								]),
								defaultCountry: _optionalChain([
									routes,
									'access',
									(_13) => _13[localeRouteKey],
									'optionalAccess',
									(_14) => _14.defaultCountry,
								]),
								hideDefaultLocale: _nullishCoalesce(
									_optionalChain([
										routes,
										'access',
										(_15) => _15[localeRouteKey],
										'optionalAccess',
										(_16) => _16.hideDefaultLocale,
									]),
									() => true
								),
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

				const routes = _optionalChain([
					options,
					'access',
					(_17) => _17[key],
					'optionalAccess',
					(_18) => _18.routes,
				])

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
			} else serverConfigDefined[key] = _constants3.defaultServerConfig[key]
		} // isr
	}

	serverConfigDefined.crawler =
		_constants.ENV === 'development'
			? serverConfigDefined.crawler
			: process.env.CRAWLER || serverConfigDefined.crawler

	serverConfigDefined.crawlerSecretKey =
		_constants.ENV === 'development'
			? serverConfigDefined.crawlerSecretKey
			: process.env.CRAWLER_SECRET_KEY || undefined

	return serverConfigDefined
}
exports.defineServerConfig = defineServerConfig
