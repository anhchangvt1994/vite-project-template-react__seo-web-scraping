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
var _constants = require('./constants')
var _express = require('express')
var _express2 = _interopRequireDefault(_express)
var _puppeteerssr = require('./puppeteer-ssr')
var _puppeteerssr2 = _interopRequireDefault(_puppeteerssr)
var _PortHandler = require('../../config/utils/PortHandler')
var _ConsoleHandler = require('./utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _chokidar = require('chokidar')
var _chokidar2 = _interopRequireDefault(_chokidar)
var _child_process = require('child_process')
var _path = require('path')
var _path2 = _interopRequireDefault(_path)

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

	;(await _puppeteerssr2.default).init(app)

	server.listen(port, () => {
		_ConsoleHandler2.default.log(
			`Server started with port ${port}. Press Ctrl+C to quit`
		)
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
