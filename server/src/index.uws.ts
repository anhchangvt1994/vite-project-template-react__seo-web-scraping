import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { findFreePort, getPort, setPort } from '../../config/utils/PortHandler'
import { pagesPath, resourceExtension } from './constants'
import ServerConfig from './server.config'
import { ENV, ENV_MODE, PROCESS_ENV } from './utils/InitEnv'

require('events').EventEmitter.setMaxListeners(200)

const cleanResourceWithCondition = async () => {
	if (ENV_MODE === 'development') {
		// NOTE - Clean Browsers and Pages after start / restart
		const {
			deleteResource,
		} = require(`./puppeteer-ssr/utils/FollowResource.worker/utils.${resourceExtension}`)
		const browsersPath = path.resolve(__dirname, './puppeteer-ssr/browsers')

		return Promise.all([
			deleteResource(browsersPath),
			deleteResource(pagesPath),
		])
	}
}

const startServer = async () => {
	await cleanResourceWithCondition()
	let port =
		ENV !== 'development'
			? PROCESS_ENV.PORT || getPort('PUPPETEER_SSR_PORT')
			: getPort('PUPPETEER_SSR_PORT')
	port = await findFreePort(port || PROCESS_ENV.PUPPETEER_SSR_PORT || 8080)
	setPort(port, 'PUPPETEER_SSR_PORT')

	if (ENV !== 'development') {
		PROCESS_ENV.PORT = port
	}

	const app = require('uWebSockets.js')./*SSL*/ App({
		key_file_name: 'misc/key.pem',
		cert_file_name: 'misc/cert.pem',
		passphrase: '1234',
	})

	if (ServerConfig.crawler && !PROCESS_ENV.IS_REMOTE_CRAWLER) {
		app.get('/robots.txt', (res, req) => {
			try {
				const body = fs.readFileSync(path.resolve(__dirname, '../robots.txt'))
				res.end(body)
			} catch {
				res.writeStatus('404')
				res.end('File not found')
			}
		})
	}
	;(await require('./puppeteer-ssr/index.uws').default).init(app)

	app.listen(Number(port), (token) => {
		if (token) {
			console.log(`Server started port ${port}. Press Ctrl+C to quit`)
			process.send?.('ready')
		} else {
			console.log(`Failed to listen to port ${port}`)
		}
	})

	process.on('SIGINT', async function () {
		await app.close()
		process.exit(0)
	})

	if (!PROCESS_ENV.IS_REMOTE_CRAWLER) {
		if (ENV === 'development') {
			const serverIndexFilePath = path.resolve(__dirname, './index.uws.ts')
			// NOTE - restart server onchange
			// const watcher = chokidar.watch([path.resolve(__dirname, './**/*.ts')], {
			// 	ignored: /$^/,
			// 	persistent: true,
			// })

			if (!PROCESS_ENV.REFRESH_SERVER) {
				if (PROCESS_ENV.BUILD_TOOL === 'vite')
					spawn('vite', [], {
						stdio: 'inherit',
						shell: true,
					})
				else if (PROCESS_ENV.BUILD_TOOL === 'webpack')
					spawn(
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
		} else if (!PROCESS_ENV.IS_SERVER) {
			if (PROCESS_ENV.BUILD_TOOL === 'vite')
				spawn('vite', ['preview'], {
					stdio: 'inherit',
					shell: true,
				})
			else if (PROCESS_ENV.BUILD_TOOL === 'webpack')
				spawn(
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
