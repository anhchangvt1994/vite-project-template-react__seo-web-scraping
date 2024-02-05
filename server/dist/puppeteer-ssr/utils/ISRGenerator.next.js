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
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)

var _constants = require('../../constants')
var _ConsoleHandler = require('../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _InitEnv = require('../../utils/InitEnv')
var _constants3 = require('../constants')

var _CacheManager = require('./CacheManager')
var _CacheManager2 = _interopRequireDefault(_CacheManager)
var _ISRHandler = require('./ISRHandler')
var _ISRHandler2 = _interopRequireDefault(_ISRHandler)

const cacheManager = _CacheManager2.default.call(void 0)

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
	result = await cacheManager.achieve(ISRHandlerParams.url)

	if (result) {
		if (result.isRaw) {
			_ConsoleHandler2.default.log(
				'File và nội dung đã tồn tại, đang tiến hành Optimize file'
			)
			const asyncTmpResult = new Promise(async (res) => {
				const optimizeHTMLContentPool = _workerpool2.default.pool(
					__dirname + `/OptimizeHtml.worker.${_constants.resourceExtension}`,
					{
						minWorkers: 1,
						maxWorkers: _constants3.MAX_WORKERS,
					}
				)

				if (!result || !result.file || !_fs2.default.existsSync(result.file))
					res(undefined)

				_fs2.default.readFile(
					_optionalChain([result, 'optionalAccess', (_) => _.file]),
					async (err, data) => {
						if (err) return res(undefined)

						const restOfDuration = (() => {
							const duration = getRestOfDuration(startGenerating, 2000)

							return duration > 7000 ? 7000 : duration
						})()

						let html = data.toString('utf-8')
						const timeout = setTimeout(async () => {
							optimizeHTMLContentPool.terminate()
							const result = await cacheManager.set({
								html,
								url: ISRHandlerParams.url,
								isRaw: false,
							})

							res(result)
						}, restOfDuration)

						let tmpHTML = ''

						try {
							if (_constants.POWER_LEVEL === _constants.POWER_LEVEL_LIST.THREE)
								tmpHTML = await optimizeHTMLContentPool.exec(
									'compressContent',
									[html]
								)
						} catch (err) {
							tmpHTML = html
							// Console.error(err)
						} finally {
							clearTimeout(timeout)
							optimizeHTMLContentPool.terminate()

							const result = await cacheManager.set({
								html: tmpHTML,
								url: ISRHandlerParams.url,
								isRaw: false,
							})

							res(result)
						}
					}
				)
			})

			const tmpResult = await asyncTmpResult
			result = tmpResult || result
		} else if (Date.now() - new Date(result.updatedAt).getTime() > 300000) {
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
								isFirstRequest: true,
								url: ISRHandlerParams.url,
							}
						)
					else
						return _ISRHandler2.default.call(void 0, {
							startGenerating,
							isFirstRequest: true,
							...ISRHandlerParams,
						})
				})()

				if (isSkipWaiting) return res(undefined)
				else setTimeout(res, 10000)

				const result = await (async () => {
					return await handle
				})()

				res(result)
			})

			if (tmpResult && tmpResult.status) result = tmpResult
		}
	} else {
		result = await cacheManager.get(ISRHandlerParams.url)

		_ConsoleHandler2.default.log('Check for condition to create new page.')
		_ConsoleHandler2.default.log(
			'result.available',
			_optionalChain([result, 'optionalAccess', (_2) => _2.available])
		)

		if (result) {
			const isValidToScraping = (() => {
				return (
					result.isInit ||
					(() => {
						const createTimeDuration =
							Date.now() - new Date(result.createdAt).getTime()
						return (
							!result.available &&
							createTimeDuration >=
								(_constants.SERVER_LESS &&
								_constants.BANDWIDTH_LEVEL ===
									_constants.BANDWIDTH_LEVEL_LIST.ONE
									? 2000
									: 10000)
						)
					})()
				)
			})()

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
									isFirstRequest: true,
									url: ISRHandlerParams.url,
								}
							)
						else
							return _ISRHandler2.default.call(void 0, {
								startGenerating,
								isFirstRequest: true,
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
					const tmpResult = await cacheManager.achieve(ISRHandlerParams.url)
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
							const tmpResult = await cacheManager.achieve(ISRHandlerParams.url)

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
