'use strict'
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
var _child_process = require('child_process')
var _cors = require('cors')
var _cors2 = _interopRequireDefault(_cors)
var _express = require('express')
var _express2 = _interopRequireDefault(_express)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _PortHandler = require('../../config/utils/PortHandler')

var _constants = require('./constants')
var _CookieHandler = require('./utils/CookieHandler')
var _DetectBot = require('./utils/DetectBot')
var _DetectBot2 = _interopRequireDefault(_DetectBot)
var _DetectDevice = require('./utils/DetectDevice')
var _DetectDevice2 = _interopRequireDefault(_DetectDevice)
var _DetectLocale = require('./utils/DetectLocale')
var _DetectLocale2 = _interopRequireDefault(_DetectLocale)
var _DetectRedirect = require('./utils/DetectRedirect')
var _DetectRedirect2 = _interopRequireDefault(_DetectRedirect)
var _DetectStaticExtension = require('./utils/DetectStaticExtension')
var _DetectStaticExtension2 = _interopRequireDefault(_DetectStaticExtension)
var _store = require('./store')

const dotenv = require('dotenv')
dotenv.config({
	path: _path2.default.resolve(__dirname, '../.env'),
})

if (_constants.ENV_MODE !== 'development') {
	dotenv.config({
		path: _path2.default.resolve(__dirname, '../.env.production'),
		override: true,
	})
}

const ServerConfig = _nullishCoalesce(
	_optionalChain([
		require,
		'call',
		(_) => _('./server.config'),
		'optionalAccess',
		(_2) => _2.default,
	]),
	() => ({})
)

const COOKIE_EXPIRED_SECOND = _constants.COOKIE_EXPIRED / 1000
const ENVIRONMENT = JSON.stringify({
	ENV: _constants.ENV,
	MODE: _constants.MODE,
	ENV_MODE: _constants.ENV_MODE,
})

require('events').EventEmitter.setMaxListeners(200)

const cleanResourceWithCondition = async () => {
	if (_constants.ENV_MODE === 'development') {
		// NOTE - Clean Browsers and Pages after start / restart
		const {
			deleteResource,
		} = require(`./puppeteer-ssr/utils/FollowResource.worker/utils.${_constants.resourceExtension}`)
		const browsersPath = _path2.default.resolve(
			__dirname,
			'./puppeteer-ssr/browsers'
		)

		return Promise.all([
			deleteResource(browsersPath),
			deleteResource(_constants.pagesPath),
		])
	}
}

const startServer = async () => {
	await cleanResourceWithCondition()
	let port =
		_constants.ENV !== 'development'
			? process.env.PORT ||
			  _PortHandler.getPort.call(void 0, 'PUPPETEER_SSR_PORT')
			: _PortHandler.getPort.call(void 0, 'PUPPETEER_SSR_PORT')
	port = await _PortHandler.findFreePort.call(
		void 0,
		port || process.env.PUPPETEER_SSR_PORT || 8080
	)
	_PortHandler.setPort.call(void 0, port, 'PUPPETEER_SSR_PORT')

	if (_constants.ENV !== 'development') {
		process.env.PORT = port
	}

	const app = _express2.default.call(void 0)
	const server = require('http').createServer(app)

	app.use(_cors2.default.call(void 0))
	if (ServerConfig.crawler && !process.env.IS_REMOTE_CRAWLER) {
		app
			.use(
				'/robots.txt',
				_express2.default.static(
					_path2.default.resolve(__dirname, '../robots.txt')
				)
			)
			.use(function (req, res, next) {
				const isStatic = _DetectStaticExtension2.default.call(void 0, req)
				/**
				 * NOTE
				 * Cache-Control max-age is 1 year
				 * calc by using:
				 * https://www.inchcalculator.com/convert/month-to-second/
				 */
				if (isStatic) {
					if (_constants.ENV !== 'development') {
						res.set('Cache-Control', 'public, max-age=31556952')
					}

					try {
						res
							.status(200)
							.sendFile(
								_path2.default.resolve(__dirname, `../../dist/${req.url}`)
							)
					} catch (err) {
						res.status(404).send('File not found')
					}
				} else {
					next()
				}
			})
	}

	app
		.use(function (req, res, next) {
			if (!process.env.BASE_URL)
				process.env.BASE_URL = `${req.protocol}://${req.get('host')}`
			next()
		})
		.use(function (req, res, next) {
			const botInfo =
				req.headers['botinfo'] ||
				req.headers['botInfo'] ||
				JSON.stringify(_DetectBot2.default.call(void 0, req))

			_CookieHandler.setCookie.call(
				void 0,
				res,
				`BotInfo=${botInfo};Max-Age=${COOKIE_EXPIRED_SECOND}`
			)

			if (!process.env.IS_REMOTE_CRAWLER) {
				const headersStore = _store.getStore.call(void 0, 'headers')
				headersStore.botInfo = botInfo
				_store.setStore.call(void 0, 'headers', headersStore)
			}

			next()
		})
		.use(function (req, res, next) {
			const localeInfo = (() => {
				let tmpLocaleInfo = req['localeinfo'] || req['localeInfo']

				if (tmpLocaleInfo) JSON.parse(tmpLocaleInfo)
				else tmpLocaleInfo = _DetectLocale2.default.call(void 0, req)

				return tmpLocaleInfo
			})()

			const enableLocale =
				ServerConfig.locale.enable &&
				Boolean(
					!ServerConfig.locale.routes ||
						!ServerConfig.locale.routes[req.url] ||
						ServerConfig.locale.routes[req.url].enable
				)

			_CookieHandler.setCookie.call(
				void 0,
				res,
				`LocaleInfo=${JSON.stringify(
					localeInfo
				)};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
			)

			if (!process.env.IS_REMOTE_CRAWLER) {
				const headersStore = _store.getStore.call(void 0, 'headers')
				headersStore.localeInfo = JSON.stringify(localeInfo)
				_store.setStore.call(void 0, 'headers', headersStore)
			}

			if (enableLocale) {
				_CookieHandler.setCookie.call(
					void 0,
					res,
					`lang=${_nullishCoalesce(
						_optionalChain([
							localeInfo,
							'optionalAccess',
							(_3) => _3.langSelected,
						]),
						() => ServerConfig.locale.defaultLang
					)};Path=/`
				)

				if (ServerConfig.locale.defaultCountry) {
					_CookieHandler.setCookie.call(
						void 0,
						res,
						`country=${_nullishCoalesce(
							_optionalChain([
								localeInfo,
								'optionalAccess',
								(_4) => _4.countrySelected,
							]),
							() => ServerConfig.locale.defaultCountry
						)};Path=/`
					)
				}
			}
			next()
		})
		.use(function (req, res, next) {
			const redirectResult = _DetectRedirect2.default.call(void 0, req, res)

			if (redirectResult.status !== 200) {
				if (req.headers.accept === 'application/json') {
					req.headers['redirect'] = JSON.stringify(redirectResult)
				} else {
					if (redirectResult.path.length > 1)
						redirectResult.path = redirectResult.path.replace(
							/\/$|\/(\?)/,
							'$1'
						)
					res.writeHead(redirectResult.status, {
						Location: `${redirectResult.path}${
							redirectResult.search ? redirectResult.search : ''
						}`,
						'cache-control': 'no-store',
					})
					return res.end()
				}
			}
			next()
		})
		.use(function (req, res, next) {
			_CookieHandler.setCookie.call(
				void 0,
				res,
				`EnvironmentInfo=${ENVIRONMENT};Max-Age=${COOKIE_EXPIRED_SECOND}`
			)
			next()
		})
		.use(function (req, res, next) {
			const deviceInfo =
				req.headers['deviceinfo'] ||
				req.headers['deviceInfo'] ||
				JSON.stringify(_DetectDevice2.default.call(void 0, req))

			_CookieHandler.setCookie.call(
				void 0,
				res,
				`DeviceInfo=${deviceInfo};Max-Age=${COOKIE_EXPIRED_SECOND}`
			)

			if (!process.env.IS_REMOTE_CRAWLER) {
				const headersStore = _store.getStore.call(void 0, 'headers')
				headersStore.deviceInfo = deviceInfo
				_store.setStore.call(void 0, 'headers', headersStore)
			}

			next()
		})
	;(await require('./puppeteer-ssr').default).init(app)

	server.listen(port, () => {
		console.log(`Server started port ${port}. Press Ctrl+C to quit`)
		_optionalChain([
			process,
			'access',
			(_5) => _5.send,
			'optionalCall',
			(_6) => _6('ready'),
		])
	})

	process.on('SIGINT', async function () {
		await server.close()
		process.exit(0)
	})

	if (!process.env.IS_REMOTE_CRAWLER) {
		if (_constants.ENV === 'development') {
			// NOTE - restart server onchange
			// const watcher = chokidar.watch([path.resolve(__dirname, './**/*.ts')], {
			// 	ignored: /$^/,
			// 	persistent: true,
			// })

			if (!process.env.REFRESH_SERVER) {
				_child_process.spawn.call(void 0, 'vite', [], {
					stdio: 'inherit',
					shell: true,
				})
			}

			// watcher.on('change', async (path) => {
			// 	Console.log(`File ${path} has been changed`)
			// 	await server.close()
			// 	spawn(
			// 		'node',
			// 		[
			// 			'cross-env REFRESH_SERVER=1 --require sucrase/register server/src/index.ts',
			// 		],
			// 		{
			// 			stdio: 'inherit',
			// 			shell: true,
			// 		}
			// 	)
			// 	process.exit(0)
			// })
		} else if (!_constants.serverInfo.isServer) {
			_child_process.spawn.call(void 0, 'vite', ['preview'], {
				stdio: 'inherit',
				shell: true,
			})
		}
	}
}

startServer()
