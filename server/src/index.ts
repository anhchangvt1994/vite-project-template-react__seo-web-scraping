import { spawn } from 'child_process'
import chokidar from 'chokidar'
import cors from 'cors'
import express from 'express'
import path from 'path'
import { findFreePort, getPort, setPort } from '../../config/utils/PortHandler'
import { ENV, pagesPath } from './constants'
import puppeteerSSRService from './puppeteer-ssr'
import Console from './utils/ConsoleHandler'
import detectBot from './utils/DetectBot'
import detectDevice from './utils/DetectDevice'
import detectStaticExtension from './utils/DetectStaticExtension'
import RedirectHandler from './utils/RedirectHandler'

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
	let port = getPort('PUPPETEER_SSR_PORT')
	port = await findFreePort(port || process.env.PUPPETEER_SSR_PORT || 8080)
	setPort(port, 'PUPPETEER_SSR_PORT')

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
			 * Cache-Control max-age is 3 months
			 * calc by using:
			 * https://www.inchcalculator.com/convert/month-to-second/
			 */
			if (isStatic) {
				if (ENV !== 'development') {
					res.set('Cache-Control', 'public, max-age=7889238')
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
				botInfo = req.headers['bot_info'] || ''
			} else {
				botInfo = JSON.stringify(detectBot(req))
			}

			res.setHeader('Bot-Info', botInfo)
			next()
		})
		.use(RedirectHandler)
		.use(function (req, res, next) {
			let deviceInfo
			if (req.headers.service === 'puppeteer') {
				deviceInfo = req.headers['device_info'] || ''
			} else {
				deviceInfo = JSON.stringify(detectDevice(req))
			}

			res.setHeader('Device-Info', deviceInfo)
			next()
		})
	;(await puppeteerSSRService).init(app)

	server.listen(port, () => {
		Console.log('Server started. Press Ctrl+C to quit')
		process.send?.('ready')
	})

	process.on('SIGINT', async function () {
		await server.close()
		process.exit(0)
	})

	if (process.env.ENV === 'development') {
		// NOTE - restart server onchange
		const watcher = chokidar.watch([path.resolve(__dirname, './**/*.ts')], {
			ignored: /$^/,
			persistent: true,
		})

		watcher.on('change', async (path) => {
			Console.log(`File ${path} has been changed`)
			await server.close()
			setTimeout(() => {
				spawn(
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
