'use strict'
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
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
var _chokidar = require('chokidar')
var _chokidar2 = _interopRequireDefault(_chokidar)
var _cors = require('cors')
var _cors2 = _interopRequireDefault(_cors)
var _express = require('express')
var _express2 = _interopRequireDefault(_express)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _PortHandler = require('../../config/utils/PortHandler')
var _constants = require('./constants')
var _puppeteerssr = require('./puppeteer-ssr')
var _puppeteerssr2 = _interopRequireDefault(_puppeteerssr)
var _ConsoleHandler = require('./utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _DetectBot = require('./utils/DetectBot')
var _DetectBot2 = _interopRequireDefault(_DetectBot)
var _DetectDevice = require('./utils/DetectDevice')
var _DetectDevice2 = _interopRequireDefault(_DetectDevice)
var _DetectStaticExtension = require('./utils/DetectStaticExtension')
var _DetectStaticExtension2 = _interopRequireDefault(_DetectStaticExtension)
var _RedirectHandler = require('./utils/RedirectHandler')
var _RedirectHandler2 = _interopRequireDefault(_RedirectHandler)

require('events').EventEmitter.setMaxListeners(200)

const cleanResourceWithCondition = async () => {
	if (process.env.ENV === 'development') {
		// NOTE - Clean Browsers and Pages after start / restart
		const {
			deleteResource,
		} = require('./puppeteer-ssr/utils/FollowResource.worker/utils.ts')
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
	let port = _PortHandler.getPort.call(void 0, 'PUPPETEER_SSR_PORT')
	port = await _PortHandler.findFreePort.call(
		void 0,
		port || process.env.PUPPETEER_SSR_PORT || 8080
	)
	_PortHandler.setPort.call(void 0, port, 'PUPPETEER_SSR_PORT')

	const app = _express2.default.call(void 0)
	const server = require('http').createServer(app)

	app
		.use(_cors2.default.call(void 0))
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
			 * Cache-Control max-age is 3 months
			 * calc by using:
			 * https://www.inchcalculator.com/convert/month-to-second/
			 */
			if (isStatic) {
				if (_constants.ENV !== 'development') {
					res.set('Cache-Control', 'public, max-age=7889238')
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
		.use(function (req, res, next) {
			if (!process.env.BASE_URL)
				process.env.BASE_URL = `${req.protocol}://${req.get('host')}`
			next()
		})
		.use(function (req, res, next) {
			let botInfo
			if (req.headers.service === 'puppeteer') {
				botInfo = req.headers['bot_info'] || ''
			} else {
				botInfo = JSON.stringify(_DetectBot2.default.call(void 0, req))
			}

			res.setHeader('Bot-Info', botInfo)
			next()
		})
		.use(_RedirectHandler2.default)
		.use(function (req, res, next) {
			let deviceInfo
			if (req.headers.service === 'puppeteer') {
				deviceInfo = req.headers['device_info'] || ''
			} else {
				deviceInfo = JSON.stringify(_DetectDevice2.default.call(void 0, req))
			}

			res.setHeader('Device-Info', deviceInfo)
			next()
		})
	;(await _puppeteerssr2.default).init(app)

	server.listen(port, () => {
		_ConsoleHandler2.default.log('Server started. Press Ctrl+C to quit')
		_optionalChain([
			process,
			'access',
			(_) => _.send,
			'optionalCall',
			(_2) => _2('ready'),
		])
	})

	process.on('SIGINT', async function () {
		await server.close()
		process.exit(0)
	})

	if (process.env.ENV === 'development') {
		// NOTE - restart server onchange
		const watcher = _chokidar2.default.watch(
			[_path2.default.resolve(__dirname, './**/*.ts')],
			{
				ignored: /$^/,
				persistent: true,
			}
		)

		watcher.on('change', async (path) => {
			_ConsoleHandler2.default.log(`File ${path} has been changed`)
			await server.close()
			setTimeout(() => {
				_child_process.spawn.call(
					void 0,
					'node',
					['--require', 'sucrase/register', 'server/src/index.ts'],
					{
						stdio: 'inherit',
						shell: true,
					}
				)
			})
			process.exit(0)
		})
	}
}

startServer()
