'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
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
var _InitEnv = require('../InitEnv')
var _constants = require('./constants')

const defineServerConfig = (options) => {
	const serverConfigDefined = { ...options }

	for (const key in _constants.defaultServerConfig) {
		if (key === 'locale') {
			if (options[key]) {
				serverConfigDefined[key] = {
					enable: Boolean(
						_optionalChain([
							options,
							'access',
							(_) => _[key],
							'optionalAccess',
							(_2) => _2.enable,
						])
					),
					routes: {},
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
						hideDefaultLocale: Boolean(
							_optionalChain([
								options,
								'access',
								(_7) => _7[key],
								'optionalAccess',
								(_8) => _8.hideDefaultLocale,
							])
						),
					}

				for (const localeRouteKey in serverConfigDefined[key].routes) {
					if (serverConfigDefined[key].routes[localeRouteKey]) {
						serverConfigDefined[key].routes[localeRouteKey] = {
							enable: serverConfigDefined[key].routes[localeRouteKey].enable,
						}

						if (serverConfigDefined[key].routes[localeRouteKey].enable)
							serverConfigDefined[key].routes[localeRouteKey] = {
								...serverConfigDefined[key].routes[localeRouteKey],
								defaultLang: _optionalChain([
									serverConfigDefined,
									'access',
									(_9) => _9[key],
									'access',
									(_10) => _10.routes,
									'access',
									(_11) => _11[localeRouteKey],
									'optionalAccess',
									(_12) => _12.defaultLang,
								]),
								defaultCountry: _optionalChain([
									serverConfigDefined,
									'access',
									(_13) => _13[key],
									'access',
									(_14) => _14.routes,
									'access',
									(_15) => _15[localeRouteKey],
									'optionalAccess',
									(_16) => _16.defaultCountry,
								]),
								hideDefaultLocale: _nullishCoalesce(
									_optionalChain([
										serverConfigDefined,
										'access',
										(_17) => _17[key],
										'access',
										(_18) => _18.routes,
										'access',
										(_19) => _19[localeRouteKey],
										'optionalAccess',
										(_20) => _20.hideDefaultLocale,
									]),
									() => true
								),
							}
					} else
						serverConfigDefined[key].routes[localeRouteKey] =
							_constants.defaultServerConfig[key]
				}
			} else serverConfigDefined[key] = _constants.defaultServerConfig[key]
		} // locale

		if (key === 'crawl') {
			if (options[key]) {
				serverConfigDefined[key] = {
					enable: Boolean(
						_optionalChain([
							options,
							'access',
							(_21) => _21.crawl,
							'optionalAccess',
							(_22) => _22.enable,
						])
					),
					optimize: Boolean(
						_optionalChain([
							options,
							'access',
							(_23) => _23.crawl,
							'optionalAccess',
							(_24) => _24.optimize,
						])
					),
					compress: Boolean(
						_optionalChain([
							options,
							'access',
							(_25) => _25.crawl,
							'optionalAccess',
							(_26) => _26.compress,
						])
					),
					cache:
						_optionalChain([
							options,
							'access',
							(_27) => _27.crawl,
							'optionalAccess',
							(_28) => _28.cache,
						]) === undefined
							? _constants.defaultServerConfig[key].cache
							: {
									enable: options.crawl.cache.enable,
									time:
										options.crawl.cache.time ||
										_constants.defaultServerConfig[key].cache.time,
									renewTime:
										options.crawl.cache.renewTime ||
										_constants.defaultServerConfig[key].cache.renewTime,
							  },
					routes: {},
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
										.renewTime ||
									_constants.defaultServerConfig[key].cache.renewTime,
							},
						}
					} else
						serverConfigDefined[key].routes[localeRouteKey] =
							_constants.defaultServerConfig[key]
				}
			} else serverConfigDefined[key] = _constants.defaultServerConfig[key]
		} // crawl
	}

	serverConfigDefined.isRemoteCrawler =
		_InitEnv.PROCESS_ENV.IS_REMOTE_CRAWLER === undefined
			? serverConfigDefined.isRemoteCrawler === undefined
				? _constants.defaultServerConfig.isRemoteCrawler
				: serverConfigDefined.isRemoteCrawler
			: _InitEnv.PROCESS_ENV.IS_REMOTE_CRAWLER

	serverConfigDefined.crawler = serverConfigDefined.isRemoteCrawler
		? ''
		: _InitEnv.ENV_MODE === 'development'
		? serverConfigDefined.crawler
		: _InitEnv.PROCESS_ENV.CRAWLER || serverConfigDefined.crawler

	serverConfigDefined.crawlerSecretKey = serverConfigDefined.isRemoteCrawler
		? ''
		: _InitEnv.ENV_MODE === 'development'
		? serverConfigDefined.crawlerSecretKey
		: _InitEnv.PROCESS_ENV.CRAWLER_SECRET_KEY || undefined

	return serverConfigDefined
}
exports.defineServerConfig = defineServerConfig
