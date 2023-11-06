'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
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

var _constants = require('../../constants')
var _ConsoleHandler = require('../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)

var _constants3 = require('../constants')

var _BrowserManager = require('./BrowserManager')
var _BrowserManager2 = _interopRequireDefault(_BrowserManager)
var _CacheManager = require('./CacheManager')
var _CacheManager2 = _interopRequireDefault(_CacheManager)

const browserManager = (() => {
	if (_constants.ENV === 'development') return undefined
	if (_constants3.POWER_LEVEL === _constants3.POWER_LEVEL_LIST.THREE)
		return _BrowserManager2.default.call(
			void 0,
			() => `${_constants.userDataPath}/user_data_${Date.now()}`
		)
	return _BrowserManager2.default.call(void 0)
})()

const getRestOfDuration = (startGenerating, gapDuration = 0) => {
	if (!startGenerating) return 0

	return (
		_constants3.DURATION_TIMEOUT - gapDuration - (Date.now() - startGenerating)
	)
} // getRestOfDuration

const waitResponse = async (page, url, duration) => {
	const timeoutDuration = (() => {
		const maxDuration =
			_constants3.BANDWIDTH_LEVEL === _constants3.BANDWIDTH_LEVEL_LIST.TWO
				? 2000
				: _constants3.DURATION_TIMEOUT

		return duration > maxDuration ? maxDuration : duration
	})()
	const startWaiting = Date.now()
	let response
	try {
		response = await page.goto(url.split('?')[0], {
			waitUntil: 'networkidle2',
			timeout: timeoutDuration,
		})
	} catch (err) {
		throw err
	}

	const waitingDuration = Date.now() - startWaiting
	const restOfDuration = timeoutDuration - waitingDuration

	if (restOfDuration <= 0) return response

	await new Promise((res) => {
		let duration = _constants.ENV === 'development' ? 3000 : 250
		const maxLimitTimeout = restOfDuration > 3000 ? 3000 : restOfDuration
		let limitTimeout = setTimeout(
			() => {
				if (responseTimeout) clearTimeout(responseTimeout)
				res(undefined)
			},
			_constants.ENV === 'development'
				? 10000
				: restOfDuration > maxLimitTimeout
				? maxLimitTimeout
				: restOfDuration
		)
		let responseTimeout
		const handleTimeout = () => {
			if (responseTimeout) clearTimeout(responseTimeout)
			responseTimeout = setTimeout(() => {
				if (limitTimeout) clearTimeout(limitTimeout)
				res(undefined)
			}, duration)

			duration = _constants.ENV === 'development' ? 3000 : 150
		}

		handleTimeout()

		page.on('requestfinished', () => {
			handleTimeout()
		})
		page.on('requestservedfromcache', () => {
			handleTimeout()
		})
		page.on('requestfailed', () => {
			handleTimeout()
		})
	})

	return response
} // waitResponse

const gapDurationDefault = 1500

const ISRHandler = async ({ isFirstRequest, url }) => {
	const startGenerating = Date.now()
	if (getRestOfDuration(startGenerating, gapDurationDefault) <= 0) return

	const cacheManager = _CacheManager2.default.call(void 0)

	_ConsoleHandler2.default.log('Bắt đầu tạo page mới')

	const page = await browserManager.newPage()

	let restOfDuration = getRestOfDuration(startGenerating, gapDurationDefault)

	if (!page || restOfDuration <= 0) {
		if (!page && !isFirstRequest) {
			const tmpResult = await cacheManager.achieve(url)

			return tmpResult
		}
		return
	}

	_ConsoleHandler2.default.log('Số giây còn lại là: ', restOfDuration / 1000)
	_ConsoleHandler2.default.log('Tạo page mới thành công')

	let html = ''
	let status = 200
	let isGetHtmlProcessError = false

	try {
		// await page.waitForNetworkIdle({ idleTime: 250 })
		await page.setRequestInterception(true)
		page.on('request', (req) => {
			const resourceType = req.resourceType()

			if (resourceType === 'stylesheet') {
				req.respond({ status: 200, body: 'aborted' })
			} else if (
				/(socket.io.min.js)+(?:$)|data:image\/[a-z]*.?\;base64/.test(url) ||
				/font|image|media|imageset/.test(resourceType)
			) {
				req.abort()
			} else {
				req.continue()
			}
		})

		const specialInfo = _nullishCoalesce(
			_optionalChain([
				_constants3.regexQueryStringSpecialInfo,
				'access',
				(_) => _.exec,
				'call',
				(_2) => _2(url),
				'optionalAccess',
				(_3) => _3.groups,
			]),
			() => ({})
		)

		await page.setExtraHTTPHeaders({
			...specialInfo,
			service: 'puppeteer',
		})

		await new Promise(async (res) => {
			_ConsoleHandler2.default.log(`Bắt đầu crawl url: ${url}`)

			let response

			try {
				response = await waitResponse(page, url, restOfDuration)
			} catch (err) {
				if (err.name !== 'TimeoutError') {
					isGetHtmlProcessError = true
					res(false)
					return _ConsoleHandler2.default.error(err)
				}
			} finally {
				status = _nullishCoalesce(
					_optionalChain([
						response,
						'optionalAccess',
						(_4) => _4.status,
						'optionalCall',
						(_5) => _5(),
					]),
					() => status
				)
				_ConsoleHandler2.default.log('Crawl thành công!')
				_ConsoleHandler2.default.log(`Response status là: ${status}`)

				res(true)
			}
		})
	} catch (err) {
		_ConsoleHandler2.default.log('Page mới đã bị lỗi')
		_ConsoleHandler2.default.error(err)
		return
	}

	if (isGetHtmlProcessError) return

	let result
	try {
		html = await page.content() // serialized HTML of page DOM.
		await page.close()
	} catch (err) {
		_ConsoleHandler2.default.error(err)
		return
	} finally {
		status = html && _constants3.regexNotFoundPageID.test(html) ? 404 : 200
		if (_constants3.CACHEABLE_STATUS_CODE[status]) {
			result = await cacheManager.set({
				html,
				url,
				isRaw: true,
			})
		} else {
			await cacheManager.remove(url)
			return {
				status,
				html,
			}
		}
	}

	restOfDuration = getRestOfDuration(startGenerating)

	return result
	// Console.log('Bắt đầu optimize nội dung file')

	// const optimizeHTMLContentPool = WorkerPool.pool(
	// 	__dirname + `/OptimizeHtml.worker.${resourceExtension}`,
	// 	{
	// 		minWorkers: 1,
	// 		maxWorkers: MAX_WORKERS,
	// 	}
	// )

	// try {
	// 	html = await optimizeHTMLContentPool.exec('compressContent', [html])
	// 	html = await optimizeHTMLContentPool.exec('optimizeContent', [html, true])
	// } catch (err) {
	// 	Console.error(err)
	// 	return
	// } finally {
	// 	optimizeHTMLContentPool.terminate()

	// 	result = await cacheManager.set({
	// 		html,
	// 		url,
	// 		isRaw: false,
	// 	})

	// 	return result
	// }
}

exports.default = ISRHandler
