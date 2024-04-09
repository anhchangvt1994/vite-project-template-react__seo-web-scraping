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
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _PortHandler = require('../../config/utils/PortHandler')
var _serverconfig = require('./server.config')
var _serverconfig2 = _interopRequireDefault(_serverconfig)
var _InitEnv = require('./utils/InitEnv')

require('events').EventEmitter.setMaxListeners(200)

// spawn('node', ['server/src/utils/GenerateServerInfo.js'], {
// 	stdio: 'inherit',
// 	shell: true,
// })

// const cleanResourceWithCondition = async () => {
// 	if (ENV_MODE === 'development') {
// 		// NOTE - Clean Browsers and Pages after start / restart
// 		const {
// 			deleteResource,
// 		} = require(`./puppeteer-ssr/utils/FollowResource.worker/utils.${resourceExtension}`)
// 		const browsersPath = path.resolve(__dirname, './puppeteer-ssr/browsers')

// 		return Promise.all([
// 			deleteResource(browsersPath),
// 			deleteResource(pagesPath),
// 		])
// 	}
// }

const startServer = async () => {
	// await cleanResourceWithCondition()
	let port =
		_InitEnv.ENV !== 'development'
			? _InitEnv.PROCESS_ENV.PORT ||
			  _PortHandler.getPort.call(void 0, 'PUPPETEER_SSR_PORT')
			: _PortHandler.getPort.call(void 0, 'PUPPETEER_SSR_PORT')
	port = await _PortHandler.findFreePort.call(
		void 0,
		port || _InitEnv.PROCESS_ENV.PUPPETEER_SSR_PORT || 8080
	)
	_PortHandler.setPort.call(void 0, port, 'PUPPETEER_SSR_PORT')

	if (_InitEnv.ENV !== 'development') {
		_InitEnv.PROCESS_ENV.PORT = port
	}

	const app = require('uWebSockets.js')./*SSL*/ App({
		key_file_name: 'misc/key.pem',
		cert_file_name: 'misc/cert.pem',
		passphrase: '1234',
	})

	if (
		_serverconfig2.default.crawler &&
		!_serverconfig2.default.isRemoteCrawler
	) {
		app.get('/robots.txt', (res, req) => {
			try {
				const body = _fs2.default.readFileSync(
					_path2.default.resolve(__dirname, '../robots.txt')
				)
				res.end(body)
			} catch (e) {
				res.writeStatus('404')
				res.end('File not found')
			}
		})
	}
	;(await require('./puppeteer-ssr/index.uws').default).init(app)

	app.listen(Number(port), (token) => {
		if (token) {
			console.log(`Server started port ${port}. Press Ctrl+C to quit`)
			_optionalChain([
				process,
				'access',
				(_) => _.send,
				'optionalCall',
				(_2) => _2('ready'),
			])
		} else {
			console.log(`Failed to listen to port ${port}`)
		}
	})

	process.on('SIGINT', async function () {
		await app.close()
		process.exit(0)
	})

	if (!_serverconfig2.default.isRemoteCrawler) {
		if (_InitEnv.ENV === 'development') {
			const serverIndexFilePath = _path2.default.resolve(
				__dirname,
				'./index.uws.ts'
			)
			// NOTE - restart server onchange
			// const watcher = chokidar.watch([path.resolve(__dirname, './**/*.ts')], {
			// 	ignored: /$^/,
			// 	persistent: true,
			// })

			if (!_InitEnv.PROCESS_ENV.REFRESH_SERVER) {
				if (_InitEnv.PROCESS_ENV.BUILD_TOOL === 'vite')
					_child_process.spawn.call(void 0, 'vite', [], {
						stdio: 'inherit',
						shell: true,
					})
				else if (_InitEnv.PROCESS_ENV.BUILD_TOOL === 'webpack')
					_child_process.spawn.call(
						void 0,
						'cross-env',
						['PORT=3000 IO_PORT=3030 npx webpack serve --mode=development'],
						{
							stdio: 'inherit',
							shell: true,
						}
					)
			}

			// watcher.on('change', async (path) => {
			// 	Console.log(`File ${path} has been changed`)
			// 	await app.close()
			// 	setTimeout(() => {
			// 		spawn(
			// 			'node',
			// 			[
			// 				`cross-env REFRESH_SERVER=1 --require sucrase/register ${serverIndexFilePath}`,
			// 			],
			// 			{
			// 				stdio: 'inherit',
			// 				shell: true,
			// 			}
			// 		)
			// 	})
			// 	process.exit(0)
			// })
		} else if (!_InitEnv.PROCESS_ENV.IS_SERVER) {
			if (_InitEnv.PROCESS_ENV.BUILD_TOOL === 'vite')
				_child_process.spawn.call(void 0, 'vite', ['preview'], {
					stdio: 'inherit',
					shell: true,
				})
			else if (_InitEnv.PROCESS_ENV.BUILD_TOOL === 'webpack')
				_child_process.spawn.call(
					void 0,
					'cross-env',
					[
						'PORT=1234 NODE_NO_WARNINGS=1 node ./config/webpack.serve.config.js',
					],
					{
						stdio: 'inherit',
						shell: true,
					}
				)
		}
	}
}

startServer()
