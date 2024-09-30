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
var _InitEnv = require('../InitEnv')
var _constants = require('./constants')

const defineServerConfig = (options) => {
	const serverConfigDefined = { ...options }

	for (const key in _constants.defaultServerConfig) {
		if (key === 'locale') {
			if (options[key]) {
				const tmpOptionCastingType = options[key]
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
								defaultLang: _optionalChain([
									serverConfigDefined,
									'access',
									(_) => _[key],
									'access',
									(_2) => _2.routes,
									'access',
									(_3) => _3[localeRouteKey],
									'optionalAccess',
									(_4) => _4.defaultLang,
								]),
								defaultCountry: _optionalChain([
									serverConfigDefined,
									'access',
									(_5) => _5[key],
									'access',
									(_6) => _6.routes,
									'access',
									(_7) => _7[localeRouteKey],
									'optionalAccess',
									(_8) => _8.defaultCountry,
								]),
								hideDefaultLocale: _nullishCoalesce(
									_optionalChain([
										serverConfigDefined,
										'access',
										(_9) => _9[key],
										'access',
										(_10) => _10.routes,
										'access',
										(_11) => _11[localeRouteKey],
										'optionalAccess',
										(_12) => _12.hideDefaultLocale,
									]),
									() => true
								),
							}

							if (serverConfigDefined[key].custom) {
								const customFunc = serverConfigDefined[key].custom
								serverConfigDefined[key].custom = (url) => {
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
							_constants.defaultServerConfig[key]
				}
			} else serverConfigDefined[key] = _constants.defaultServerConfig[key]
		} // locale

		if (key === 'crawl') {
			if (options[key]) {
				const tmpOptionCastingType = options[key]
				serverConfigDefined[key] = {
					enable: tmpOptionCastingType.enable,
					content:
						tmpOptionCastingType.content === undefined
							? _constants.defaultServerConfig[key].content
							: tmpOptionCastingType.content,
					optimize:
						tmpOptionCastingType.optimize === undefined
							? _constants.defaultServerConfig[key].optimize
							: tmpOptionCastingType.optimize,
					compress:
						tmpOptionCastingType.compress === undefined
							? _constants.defaultServerConfig[key].compress
							: Boolean(tmpOptionCastingType.compress) ||
							  !_InitEnv.PROCESS_ENV.DISABLE_COMPRESS,
					cache:
						tmpOptionCastingType.cache === undefined
							? _constants.defaultServerConfig[key].cache
							: {
									enable: tmpOptionCastingType.cache.enable,
									path:
										tmpOptionCastingType.cache.path ||
										_constants.defaultServerConfig[key].cache.path,
									time:
										tmpOptionCastingType.cache.time ||
										_constants.defaultServerConfig[key].cache.time,
									renewTime:
										tmpOptionCastingType.cache.renewTime ||
										_constants.defaultServerConfig[key].cache.renewTime,
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
									? _constants.defaultServerConfig[key].optimize
									: serverConfigDefined[key].routes[localeRouteKey].optimize,
							compress:
								serverConfigDefined[key].routes[localeRouteKey].compress ==
								undefined
									? _constants.defaultServerConfig[key].compress
									: Boolean(
											serverConfigDefined[key].routes[localeRouteKey].compress
									  ),
							cache: {
								enable: _nullishCoalesce(
									_optionalChain([
										serverConfigDefined,
										'access',
										(_13) => _13[key],
										'access',
										(_14) => _14.routes,
										'access',
										(_15) => _15[localeRouteKey],
										'access',
										(_16) => _16.cache,
										'optionalAccess',
										(_17) => _17.enable,
									]),
									() => serverConfigDefined[key].cache.enable
								),
								time: _nullishCoalesce(
									_optionalChain([
										serverConfigDefined,
										'access',
										(_18) => _18[key],
										'access',
										(_19) => _19.routes,
										'access',
										(_20) => _20[localeRouteKey],
										'access',
										(_21) => _21.cache,
										'optionalAccess',
										(_22) => _22.time,
									]),
									() => serverConfigDefined[key].cache.time
								),
								renewTime: _nullishCoalesce(
									_optionalChain([
										serverConfigDefined,
										'access',
										(_23) => _23[key],
										'access',
										(_24) => _24.routes,
										'access',
										(_25) => _25[localeRouteKey],
										'access',
										(_26) => _26.cache,
										'optionalAccess',
										(_27) => _27.renewTime,
									]),
									() => serverConfigDefined[key].cache.renewTime
								),
							},
						}
					} else
						serverConfigDefined[key].routes[localeRouteKey] =
							_constants.defaultServerConfig[key]
				}
			} else serverConfigDefined[key] = _constants.defaultServerConfig[key]
		} // crawl

		if (key === 'api') {
			if (options[key]) {
				const tmpOptionCastingType = options[key]

				serverConfigDefined[key] = {
					list:
						tmpOptionCastingType.list ||
						_constants.defaultServerConfig[key].list,
				}

				for (const apiKey in serverConfigDefined[key].list) {
					if (typeof serverConfigDefined[key].list[apiKey] === 'string') {
						serverConfigDefined[key].list[apiKey] = {
							secretKey: serverConfigDefined[key].list[apiKey],
							headerSecretKeyName: 'Authorization',
						}

						continue
					}

					if (!serverConfigDefined[key].list[apiKey].headerSecretKeyName) {
						serverConfigDefined[key].list[apiKey].headerSecretKeyName =
							'Authorization'
					}
				}
			} else serverConfigDefined[key] = _constants.defaultServerConfig[key]
		} // api
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
