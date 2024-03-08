'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
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
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)

var _constants = require('../../constants')
var _serverconfig = require('../../server.config')
var _serverconfig2 = _interopRequireDefault(_serverconfig)
var _ConsoleHandler = require('../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _InitEnv = require('../../utils/InitEnv')
var _constants3 = require('../constants')

var _CacheManager = require('./CacheManager')
var _CacheManager2 = _interopRequireDefault(_CacheManager)
var _ISRHandler = require('./ISRHandler')
var _ISRHandler2 = _interopRequireDefault(_ISRHandler)

const fetchData = async (input, init, reqData) => {
	try {
		const params = new URLSearchParams()
		if (reqData) {
			for (const key in reqData) {
				params.append(key, reqData[key])
			}
		}

		const response = await fetch(
			input + (reqData ? `?${params.toString()}` : ''),
			init
		).then((res) => res.text())

		const data = /^{(.|[\r\n])*?}$/.test(response) ? JSON.parse(response) : {}

		return data
	} catch (error) {
		_ConsoleHandler2.default.error(error)
	}
} // fetchData

const getRestOfDuration = (startGenerating, gapDuration = 0) => {
	if (!startGenerating) return 0

	return (
		_constants3.DURATION_TIMEOUT - gapDuration - (Date.now() - startGenerating)
	)
} // getRestOfDuration

const SSRGenerator = async ({ isSkipWaiting = false, ...ISRHandlerParams }) => {
	const cacheManager = _CacheManager2.default.call(void 0, ISRHandlerParams.url)

	if (!_InitEnv.PROCESS_ENV.BASE_URL) {
		_ConsoleHandler2.default.error('Missing base url!')
		return
	}

	if (!ISRHandlerParams.url) {
		_ConsoleHandler2.default.error('Missing scraping url!')
		return
	}

	const startGenerating = Date.now()

	if (
		_constants.SERVER_LESS &&
		_constants.BANDWIDTH_LEVEL === _constants.BANDWIDTH_LEVEL_LIST.TWO
	)
		fetchData(`${_InitEnv.PROCESS_ENV.BASE_URL}/cleaner-service`, {
			method: 'POST',
			headers: new Headers({
				Authorization: 'mtr-cleaner-service',
				Accept: 'application/json',
			}),
		})

	let result
	result = await cacheManager.achieve()

	if (result) {
		const NonNullableResult = result
		const pathname = new URL(ISRHandlerParams.url).pathname
		const renewTime =
			(_optionalChain([
				_serverconfig2.default,
				'access',
				(_) => _.crawl,
				'access',
				(_2) => _2.routes,
				'access',
				(_3) => _3[pathname],
				'optionalAccess',
				(_4) => _4.cache,
				'access',
				(_5) => _5.renewTime,
			]) ||
				_optionalChain([
					_serverconfig2.default,
					'access',
					(_6) => _6.crawl,
					'access',
					(_7) => _7.custom,
					'optionalCall',
					(_8) => _8(pathname),
					'optionalAccess',
					(_9) => _9.cache,
					'access',
					(_10) => _10.renewTime,
				]) ||
				_serverconfig2.default.crawl.cache.renewTime) * 1000

		// if (NonNullableResult.isRaw) {
		// 	Console.log('Optimize content!')
		// 	const asyncTmpResult = new Promise<ISSRResult>(async (res) => {
		// 		const optimizeHTMLContentPool = WorkerPool.pool(
		// 			__dirname + `/OptimizeHtml.worker.${resourceExtension}`,
		// 			{
		// 				minWorkers: 1,
		// 				maxWorkers: MAX_WORKERS,
		// 			}
		// 		)

		// 		if (
		// 			!NonNullableResult ||
		// 			!NonNullableResult.file ||
		// 			!fs.existsSync(NonNullableResult.file)
		// 		)
		// 			res(undefined)

		// 		fs.readFile(NonNullableResult.file as string, async (err, data) => {
		// 			if (err) return res(undefined)

		// 			const restOfDuration = (() => {
		// 				const duration = getRestOfDuration(startGenerating, 2000)

		// 				return duration > 7000 ? 7000 : duration
		// 			})()

		// 			let html = (() => {
		// 				if (NonNullableResult.file.endsWith('.br'))
		// 					return brotliDecompressSync(data).toString()

		// 				return data.toString('utf-8')
		// 			})()

		// 			const timeout = setTimeout(async () => {
		// 				optimizeHTMLContentPool.terminate()
		// 				const result = await cacheManager.set({
		// 					html,
		// 					url: ISRHandlerParams.url,
		// 					isRaw: !NonNullableResult.available,
		// 				})

		// 				res(result)
		// 			}, restOfDuration)

		// 			let tmpHTML = ''

		// 			try {
		// 				if (POWER_LEVEL === POWER_LEVEL_LIST.THREE)
		// 					tmpHTML = await optimizeHTMLContentPool.exec('compressContent', [
		// 						html,
		// 					])
		// 			} catch (err) {
		// 				tmpHTML = html
		// 				// Console.error(err)
		// 			} finally {
		// 				clearTimeout(timeout)
		// 				optimizeHTMLContentPool.terminate()

		// 				const result = await cacheManager.set({
		// 					html: tmpHTML,
		// 					url: ISRHandlerParams.url,
		// 					isRaw: !NonNullableResult.available,
		// 				})

		// 				res(result)
		// 			}
		// 		})
		// 	})

		// 	const tmpResult = await asyncTmpResult
		// 	result = tmpResult || result
		// } else
		if (
			Date.now() - new Date(NonNullableResult.updatedAt).getTime() >
			renewTime
		) {
			cacheManager.renew().then((result) => {
				if (!result.hasRenew)
					if (_constants.SERVER_LESS)
						fetchData(
							`${_InitEnv.PROCESS_ENV.BASE_URL}/web-scraping`,
							{
								method: 'GET',
								headers: new Headers({
									Authorization: 'web-scraping-service',
									Accept: 'application/json',
									service: 'web-scraping-service',
								}),
							},
							{
								startGenerating,
								hasCache: NonNullableResult.available,
								url: ISRHandlerParams.url,
							}
						)
					else
						_ISRHandler2.default.call(void 0, {
							startGenerating,
							hasCache: NonNullableResult.available,
							...ISRHandlerParams,
						})
			})
		}
	}
	if (!result) {
		result = await cacheManager.get()

		_ConsoleHandler2.default.log('Check for condition to create new page.')
		_ConsoleHandler2.default.log(
			'result.available',
			_optionalChain([result, 'optionalAccess', (_11) => _11.available])
		)

		if (result) {
			const NonNullableResult = result
			const isValidToScraping = NonNullableResult.isInit

			if (isValidToScraping) {
				const tmpResult = await new Promise(async (res) => {
					const handle = (() => {
						if (_constants.SERVER_LESS)
							return fetchData(
								`${_InitEnv.PROCESS_ENV.BASE_URL}/web-scraping`,
								{
									method: 'GET',
									headers: new Headers({
										Authorization: 'web-scraping-service',
										Accept: 'application/json',
										service: 'web-scraping-service',
									}),
								},
								{
									startGenerating,
									hasCache: NonNullableResult.available,
									url: ISRHandlerParams.url,
								}
							)
						else
							return _ISRHandler2.default.call(void 0, {
								startGenerating,
								hasCache: NonNullableResult.available,
								...ISRHandlerParams,
							})
					})()

					if (isSkipWaiting) return res(undefined)
					else
						setTimeout(
							res,
							_constants.SERVER_LESS
								? 5000
								: _constants.BANDWIDTH_LEVEL >
								  _constants.BANDWIDTH_LEVEL_LIST.ONE
								? 60000
								: 60000
						)

					const result = await (async () => {
						return await handle
					})()

					res(result)
				})

				if (tmpResult && tmpResult.status) result = tmpResult
				else {
					const tmpResult = await cacheManager.achieve()
					result = tmpResult || result
				}

				if (
					result.html &&
					result.status === 200 &&
					_constants3.DISABLE_SSR_CACHE
				) {
					const optimizeHTMLContentPool = _workerpool2.default.pool(
						__dirname + `/OptimizeHtml.worker.${_constants.resourceExtension}`,
						{
							minWorkers: 1,
							maxWorkers: _constants3.MAX_WORKERS,
						}
					)
					let tmpHTML = result.html

					try {
						if (_constants.POWER_LEVEL === _constants.POWER_LEVEL_LIST.THREE)
							tmpHTML = await optimizeHTMLContentPool.exec('compressContent', [
								tmpHTML,
							])
					} catch (err) {
						tmpHTML = result.html
						// Console.error(err)
					} finally {
						optimizeHTMLContentPool.terminate()
						result.html = tmpHTML
					}
				}
			} else if (!isSkipWaiting) {
				const restOfDuration = getRestOfDuration(startGenerating, 2000)

				if (restOfDuration >= 500) {
					let waitingDuration = 0
					const followThisCache = (res) => {
						const duration =
							restOfDuration - waitingDuration < 200
								? restOfDuration - waitingDuration
								: 200

						setTimeout(async () => {
							const tmpResult = await cacheManager.achieve()

							if (tmpResult && tmpResult.response) return res(tmpResult)

							waitingDuration += duration

							if (waitingDuration === restOfDuration) res(undefined)
							else followThisCache(res)
						}, duration)
					} // followThisCache

					const tmpResult = await new Promise((res) => {
						followThisCache(res)
					})

					if (tmpResult && tmpResult.response) result = tmpResult
				}
			}
		}
	}

	return result
}

exports.default = SSRGenerator
