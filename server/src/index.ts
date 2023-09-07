import { pagesPath } from './constants'
import express from 'express'
import puppeteerSSRService from './puppeteer-ssr'
import { findFreePort, getPort, setPort } from '../../config/utils/PortHandler'
import Console from './utils/ConsoleHandler'
import chokidar from 'chokidar'
import { spawn } from 'child_process'
import path from 'path'

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

	;(await puppeteerSSRService).init(app)

	server.listen(port, () => {
		Console.log(`Server started with port ${port}. Press Ctrl+C to quit`)
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
