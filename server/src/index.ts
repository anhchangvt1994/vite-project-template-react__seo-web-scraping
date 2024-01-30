import { spawn } from 'child_process'
import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import serveStatic from 'serve-static'
import { brotliCompressSync, gzipSync } from 'zlib'
import { findFreePort, getPort, setPort } from '../../config/utils/PortHandler'
import { COOKIE_EXPIRED, pagesPath, resourceExtension } from './constants'
import { setCookie } from './utils/CookieHandler'
import detectBot from './utils/DetectBot'
import detectDevice from './utils/DetectDevice'
import detectLocale from './utils/DetectLocale'
import DetectRedirect from './utils/DetectRedirect'
import detectStaticExtension from './utils/DetectStaticExtension'
import { ENV, ENV_MODE, MODE, PROCESS_ENV } from './utils/InitEnv'

const ServerConfig = require('./server.config')?.default ?? {}

const COOKIE_EXPIRED_SECOND = COOKIE_EXPIRED / 1000

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

	const app = express()
	const server = require('http').createServer(app)

	app.use(cors())
	if (ServerConfig.crawler && !PROCESS_ENV.IS_REMOTE_CRAWLER) {
		app
			.use(
				'/robots.txt',
				express.static(path.resolve(__dirname, '../robots.txt'))
			)
			.use(function (req, res, next) {
				const isStatic = detectStaticExtension(req)
				/**
				 * NOTE
				 * Cache-Control max-age is 1 year
				 * calc by using:
				 * https://www.inchcalculator.com/convert/month-to-second/
				 */
				if (isStatic) {
					const staticPath = path.resolve(__dirname, `../../dist/${req.url}`)

					try {
						if (ENV === 'development') {
							res
								.status(200)
								.set('Cache-Control', 'public, max-age=31556952')
								.sendFile(staticPath)
						} else {
							const contentEncoding = (() => {
								const tmpHeaderAcceptEncoding =
									req.headers['accept-encoding'] || ''
								if (tmpHeaderAcceptEncoding.indexOf('br') !== -1) return 'br'
								else if (tmpHeaderAcceptEncoding.indexOf('gzip') !== -1)
									return 'gzip'
								return '' as 'br' | 'gzip' | ''
							})()
							res.set({
								'Content-Encoding': contentEncoding,
							})
							const body = (() => {
								const content = fs.readFileSync(staticPath)
								const tmpBody =
									contentEncoding === 'br'
										? brotliCompressSync(content)
										: contentEncoding === 'gzip'
										? gzipSync(content)
										: content

								return tmpBody
							})()

							const mimeType = serveStatic.mime.lookup(staticPath)

							res
								.status(200)
								.set('Cache-Control', 'public, max-age=31556952')
								.set({
									'Content-type': mimeType,
								})
								.send(body)
						}
					} catch {
						res.status(404).send('File not found!')
					}
				} else {
					next()
				}
			})
	}

	app
		.use(function (req, res, next) {
			if (!PROCESS_ENV.BASE_URL)
				PROCESS_ENV.BASE_URL = `${req.protocol}://${req.get('host')}`
			next()
		})
		.use(function (req, res, next) {
			const botInfo =
				req.headers['botinfo'] ||
				req.headers['botInfo'] ||
				JSON.stringify(detectBot(req))

			setCookie(
				res,
				`BotInfo=${botInfo};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
			)

			next()
		})
		.use(function (req, res, next) {
			const localeInfo = (() => {
				let tmpLocaleInfo =
					req.headers['localeinfo'] || req.headers['localeInfo']

				if (tmpLocaleInfo) return JSON.parse(tmpLocaleInfo as string)

				return detectLocale(req)
			})()

			const enableLocale =
				ServerConfig.locale.enable &&
				Boolean(
					!ServerConfig.locale.routes ||
						!ServerConfig.locale.routes[req.url as string] ||
						ServerConfig.locale.routes[req.url as string].enable
				)

			setCookie(
				res,
				`LocaleInfo=${JSON.stringify(
					localeInfo
				)};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
			)

			if (enableLocale) {
				setCookie(
					res,
					`lang=${
						localeInfo?.langSelected ?? ServerConfig.locale.defaultLang
					};Path=/`
				)

				if (ServerConfig.locale.defaultCountry) {
					setCookie(
						res,
						`country=${
							localeInfo?.countrySelected ?? ServerConfig.locale.defaultCountry
						};Path=/`
					)
				}
			}
			next()
		})
	if (!PROCESS_ENV.IS_REMOTE_CRAWLER) {
		app.use(function (req, res, next) {
			const redirectResult = DetectRedirect(req, res)

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
	}
	app
		.use(function (req, res, next) {
			const environmentInfo = (() => {
				const tmpEnvironmentInfo =
					req.headers['environmentinfo'] || req.headers['environmentInfo']

				if (tmpEnvironmentInfo) return tmpEnvironmentInfo

				return JSON.stringify({
					ENV,
					MODE,
					ENV_MODE,
				})
			})()
			setCookie(
				res,
				`EnvironmentInfo=${environmentInfo};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
			)
			next()
		})
		.use(function (req, res, next) {
			const deviceInfo =
				req.headers['deviceinfo'] ||
				req.headers['deviceInfo'] ||
				JSON.stringify(detectDevice(req))

			setCookie(
				res,
				`DeviceInfo=${deviceInfo};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
			)

			next()
		})
	;(await require('./puppeteer-ssr').default).init(app)

	server.listen(port, () => {
		console.log(`Server started port ${port}. Press Ctrl+C to quit`)
		process.send?.('ready')
	})

	process.on('SIGINT', async function () {
		await server.close()
		process.exit(0)
	})

	if (!PROCESS_ENV.IS_REMOTE_CRAWLER) {
		if (ENV === 'development') {
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
