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
var _express = require('express')
var _express2 = _interopRequireDefault(_express)
var _puppeteercore = require('puppeteer-core')
var _puppeteercore2 = _interopRequireDefault(_puppeteercore)
var _ConsoleHandler = require('../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _PortHandler = require('../../../config/utils/PortHandler')

require('events').EventEmitter.setMaxListeners(200)

const browserService = (async () => {
	const chromium = require('@sparticuz/chromium-min')
	let _app
	// const executablePath = await chromium.executablePath(
	// 	'https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v116.0.0-pack.tar'
	// )
	// console.log('executablePath', executablePath)

	const _getBrowserRequest = () => {
		_app.get('*', async function (req, res, next) {
			const browser = await _puppeteercore2.default.launch({
				args: chromium.args,
				defaultViewport: chromium.defaultViewport,
				executablePath: await chromium.executablePath(
					'https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v116.0.0-pack.tar'
				),
				headless: chromium.headless,
			})

			const page = await browser.newPage()
			let isError = false

			try {
				await page.goto('https://www.go2joy.vn', {
					waitUntil: 'networkidle2',
					timeout: 2500,
				})
			} catch (err) {
				isError = err.name !== 'TimeoutError'
			} finally {
				if (isError) return res.status(502).send('Đã xảy ra lỗi')
				const browserVersion = await browser.version()
				const title = await page.title()
				const html = await page.content()
				await page.close()

				res.status(200).send(html)
			}
		})
	} // _getBrowserRequest

	return {
		init(app) {
			if (!app)
				return _ConsoleHandler2.default.warn('You need provide express app!')

			_app = app
			_getBrowserRequest()
		},
	}
})() // browserService

const startServer = async () => {
	const port = await _PortHandler.findFreePort.call(void 0, 8080)
	const app = _express2.default.call(void 0)
	const server = require('http').createServer(app)

	const service = await browserService
	service.init(app)

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
}

startServer()
