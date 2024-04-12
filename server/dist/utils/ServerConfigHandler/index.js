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
				const tmpOptionCastingType = options[key]
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
						} else
							serverConfigDefined[key].routes[localeRouteKey] =
								_constants.defaultServerConfig[key]
					}
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
							: Boolean(tmpOptionCastingType.optimize),
					compress:
						tmpOptionCastingType.compress === undefined
							? _constants.defaultServerConfig[key].compress
							: Boolean(tmpOptionCastingType.compress),
					cache:
						tmpOptionCastingType.cache === undefined
							? _constants.defaultServerConfig[key].cache
							: {
									enable: tmpOptionCastingType.cache.enable,
									time:
										tmpOptionCastingType.cache.time ||
										_constants.defaultServerConfig[key].cache.time,
									renewTime:
										tmpOptionCastingType.cache.renewTime ||
										_constants.defaultServerConfig[key].cache.renewTime,
							  },
					routes: tmpOptionCastingType.routes || {},
				}

				for (const localeRouteKey in serverConfigDefined[key].routes) {
					if (serverConfigDefined[key].routes[localeRouteKey]) {
						serverConfigDefined[key].routes[localeRouteKey] = {
							enable: serverConfigDefined[key].routes[localeRouteKey].enable,
							optimize:
								serverConfigDefined[key].routes[localeRouteKey].optimize ===
								undefined
									? _constants.defaultServerConfig[key].optimize
									: Boolean(
											serverConfigDefined[key].routes[localeRouteKey].optimize
									  ),
							compress:
								serverConfigDefined[key].routes[localeRouteKey].compress ==
								undefined
									? _constants.defaultServerConfig[key].compress
									: Boolean(
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
