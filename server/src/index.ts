import { spawn } from 'child_process'
import cors from 'cors'
import express from 'express'
import path from 'path'
import { findFreePort, getPort, setPort } from '../../config/utils/PortHandler'
import { ENV, pagesPath, serverInfo } from './constants'
import puppeteerSSRService from './puppeteer-ssr'
import { COOKIE_EXPIRED } from './puppeteer-ssr/constants'
import ServerConfig from './server.config'
import { setCookie } from './utils/CookieHandler'
import detectBot from './utils/DetectBot'
import detectDevice from './utils/DetectDevice'
import detectLocale from './utils/DetectLocale'
import DetectRedirect from './utils/DetectRedirect'
import detectStaticExtension from './utils/DetectStaticExtension'

const COOKIE_EXPIRED_SECOND = COOKIE_EXPIRED / 1000

require('events').EventEmitter.setMaxListeners(200)

const cleanResourceWithCondition = async () => {
	if (process.env.ENV === 'development') {
		// NOTE - Clean Browsers and Pages after start / restart
		const {
			deleteResource,
		} = require('./puppeteer-ssr/utils/FollowResource.worker/utils.ts')
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
			? process.env.PORT || getPort('PUPPETEER_SSR_PORT')
			: getPort('PUPPETEER_SSR_PORT')
	port = await findFreePort(port || process.env.PUPPETEER_SSR_PORT || 8080)
	setPort(port, 'PUPPETEER_SSR_PORT')

	if (ENV !== 'development') {
		process.env.PORT = port
	}

	const app = express()
	const server = require('http').createServer(app)

	app
		.use(cors())
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
				if (ENV !== 'development') {
					res.set('Cache-Control', 'public, max-age=31556952')
				}

				try {
					res
						.status(200)
						.sendFile(path.resolve(__dirname, `../../dist/${req.url}`))
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
				botInfo = req.headers['botInfo'] || ''
			} else {
				botInfo = JSON.stringify(detectBot(req))
			}

			setCookie(res, `BotInfo=${botInfo};Max-Age=${COOKIE_EXPIRED_SECOND}`)
			next()
		})
		.use(function (req, res, next) {
			const localeInfo = detectLocale(req)
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
		.use(function (req, res, next) {
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
		.use(function (req, res, next) {
			let deviceInfo
			if (req.headers.service === 'puppeteer') {
				deviceInfo = req.headers['deviceInfo'] || ''
			} else {
				deviceInfo = JSON.stringify(detectDevice(req))
			}

			setCookie(
				res,
				`DeviceInfo=${deviceInfo};Max-Age=${COOKIE_EXPIRED_SECOND}`
			)
			next()
		})
	;(await puppeteerSSRService).init(app)

	server.listen(port, () => {
		console.log(`Server started port ${port}. Press Ctrl+C to quit`)
		process.send?.('ready')
	})

	process.on('SIGINT', async function () {
		await server.close()
		process.exit(0)
	})

	if (process.env.ENV === 'development') {
		// NOTE - restart server onchange
		// const watcher = chokidar.watch([path.resolve(__dirname, './**/*.ts')], {
		// 	ignored: /$^/,
		// 	persistent: true,
		// })

		if (!process.env.REFRESH_SERVER) {
			spawn('vite', [], {
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
	} else if (!serverInfo.isServer) {
		spawn('vite', ['preview'], {
			stdio: 'inherit',
			shell: true,
		})
	}
}

startServer()
