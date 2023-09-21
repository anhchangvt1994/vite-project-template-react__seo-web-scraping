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

var _constants3 = require('../constants')

var _CacheManager = require('./CacheManager')
var _CacheManager2 = _interopRequireDefault(_CacheManager)
var _SSRHandler = require('./SSRHandler')
var _SSRHandler2 = _interopRequireDefault(_SSRHandler)

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
		)
		const data = await response.json()
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

const SSRGenerator = async ({ isSkipWaiting = false, ...SSRHandlerParams }) => {
	if (!process.env.BASE_URL) {
		_ConsoleHandler2.default.error('Missing base url!')
		return
	}

	if (!SSRHandlerParams.url) {
		_ConsoleHandler2.default.error('Missing scraping url!')
		return
	}

	const startGenerating = Date.now()

	if (
		_constants.SERVER_LESS &&
		_constants3.BANDWIDTH_LEVEL === _constants3.BANDWIDTH_LEVEL_LIST.TWO
	)
		fetchData(`${process.env.BASE_URL}/cleaner-service`, {
			method: 'POST',
			headers: new Headers({
				Authorization: 'mtr-cleaner-service',
				Accept: 'application/json',
			}),
		})

	let result
	result = await cacheManager.achieve(SSRHandlerParams.url)

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
								url: SSRHandlerParams.url,
								isRaw: false,
							})

							res(result)
						}, restOfDuration)

						try {
							if (
								_constants3.POWER_LEVEL === _constants3.POWER_LEVEL_LIST.THREE
							)
								html = await optimizeHTMLContentPool.exec('compressContent', [
									html,
								])

							html = await optimizeHTMLContentPool.exec('optimizeContent', [
								html,
								true,
							])
						} catch (err) {
							_ConsoleHandler2.default.error(err)
							return
						} finally {
							clearTimeout(timeout)
							optimizeHTMLContentPool.terminate()

							const result = await cacheManager.set({
								html,
								url: SSRHandlerParams.url,
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
							`${process.env.BASE_URL}/web-scraping`,
							{
								method: 'GET',
								headers: new Headers({
									Authorization: 'mtr-ssr-handler',
									Accept: 'application/json',
								}),
							},
							{
								startGenerating,
								isFirstRequest: true,
								url: SSRHandlerParams.url,
							}
						)
					else
						return _SSRHandler2.default.call(void 0, {
							startGenerating,
							isFirstRequest: true,
							...SSRHandlerParams,
						})
				})()

				if (isSkipWaiting) return res(undefined)
				else setTimeout(res, 5000)

				const result = await (async () => {
					return await handle
				})()

				res(result)
			})

			if (tmpResult && tmpResult.status) result = tmpResult
		}
	} else if (!result) {
		result = await cacheManager.get(SSRHandlerParams.url)

		_ConsoleHandler2.default.log(
			'Kiểm tra có đủ điều kiện tạo page mới không ?'
		)
		_ConsoleHandler2.default.log(
			'result.available',
			_optionalChain([result, 'optionalAccess', (_2) => _2.available])
		)

		if (result) {
			const isValidToSraping = (() => {
				return (
					result.isInit ||
					(() => {
						const createTimeDuration =
							Date.now() - new Date(result.createdAt).getTime()
						return (
							!result.available &&
							createTimeDuration >=
								(_constants.SERVER_LESS &&
								_constants3.BANDWIDTH_LEVEL ===
									_constants3.BANDWIDTH_LEVEL_LIST.ONE
									? 2000
									: 10000)
						)
					})()
				)
			})()
			if (isValidToSraping) {
				const tmpResult = await new Promise(async (res) => {
					const handle = (() => {
						if (_constants.SERVER_LESS)
							return fetchData(
								`${process.env.BASE_URL}/web-scraping`,
								{
									method: 'GET',
									headers: new Headers({
										Authorization: 'mtr-ssr-handler',
										Accept: 'application/json',
									}),
								},
								{
									startGenerating,
									isFirstRequest: true,
									url: SSRHandlerParams.url,
								}
							)
						else
							return _SSRHandler2.default.call(void 0, {
								startGenerating,
								isFirstRequest: true,
								...SSRHandlerParams,
							})
					})()

					if (isSkipWaiting) return res(undefined)
					else setTimeout(res, 5000)

					const result = await (async () => {
						return await handle
					})()

					res(result)
				})

				if (tmpResult && tmpResult.status) result = tmpResult
				else {
					const tmpResult = await cacheManager.achieve(SSRHandlerParams.url)
					result = tmpResult || result
				}
			} else if (!isSkipWaiting) {
				const restOfDuration = (() => {
					const duration = getRestOfDuration(startGenerating, 2000)

					return duration < 5000 ? duration : 5000
				})()

				if (restOfDuration >= 500) {
					let waitingDuration = 0
					const followThisCache = (res) => {
						const duration =
							restOfDuration - waitingDuration < 200
								? restOfDuration - waitingDuration
								: 200

						setTimeout(async () => {
							const tmpResult = await cacheManager.achieve(SSRHandlerParams.url)

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
