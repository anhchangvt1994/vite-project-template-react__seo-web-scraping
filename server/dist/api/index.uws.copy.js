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

var _zlib = require('zlib')
var _store = require('../store')
var _ConsoleHandler = require('../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _StringHelper = require('../utils/StringHelper')

const handleArrayBuffer = (message) => {
	if (message instanceof ArrayBuffer) {
		const decoder = new TextDecoder()
		return decoder.decode(message)
	}
	return message
}

const fetchData = (input, init) => {
	const controller = new AbortController()
	const signal = controller.signal
	try {
		const response = fetch(input, {
			signal,
			...(init || {}),
		})
			.then(async (res) => {
				const data = await new Promise(async (response) => {
					let tmpData
					const buffer = await res.clone().arrayBuffer()

					try {
						tmpData = _optionalChain([
							_zlib.brotliDecompressSync.call(void 0, buffer),
							'optionalAccess',
							(_) => _.toString,
							'call',
							(_2) => _2(),
						])
					} catch (e) {}

					if (!tmpData)
						try {
							tmpData = _optionalChain([
								_zlib.gunzipSync.call(void 0, buffer),
								'optionalAccess',
								(_3) => _3.toString,
								'call',
								(_4) => _4(),
							])
						} catch (e2) {}

					if (!tmpData) {
						const text = await res.clone().text()
						tmpData = /^(\{|\[)(.|[\r\n])*?(\}|\])$/.test(text)
							? JSON.parse(text)
							: {}
					} else JSON.parse(tmpData)

					response(tmpData)
				})

				return {
					status: res.status,
					data,
				}
			})
			.catch((err) => {
				if (err.name !== 'AbortError') console.log(err)
				return {
					status: 500,
					data: {},
					message: 'Server Error',
				}
			})

		return {
			controller,
			response,
		}
	} catch (error) {
		_ConsoleHandler2.default.error(error)
		return {
			controller,
			response: new Promise((res) =>
				res({ status: 500, data: {}, message: 'Server Error' })
			),
		}
	}
} // fetchData

const apiService = (async () => {
	let _app

	const storeAPI = _store.getStore.call(void 0, 'api')
	const apiCache = storeAPI.cache
	const apiStore = storeAPI.store
	const _allRequestHandler = () => {
		_app.all('/api', async function (res, req) {
			res.onAborted(() => {
				res.writableEnded = true
				console.log('Request aborted')
			})

			const contentEncoding = (() => {
				const tmpHeaderAcceptEncoding = req.getHeader('accept-encoding') || ''
				if (tmpHeaderAcceptEncoding.indexOf('br') !== -1) return 'br'
				else if (tmpHeaderAcceptEncoding.indexOf('gzip') !== -1) return 'gzip'
				return ''
			})()

			res.writeHeader('Content-Type', 'application/json')
			res.writeHeader('Cache-Control', 'no-store')
			res.writeHeader('Content-Encoding', contentEncoding)

			const apiInfo = _nullishCoalesce(
				_optionalChain([
					/requestInfo=(?<requestInfo>[^&]*)/,
					'access',
					(_5) => _5.exec,
					'call',
					(_6) => _6(req.getQuery()),
					'optionalAccess',
					(_7) => _7.groups,
				]),
				() => ({})
			)

			if (!res.writableEnded && !apiInfo) {
				res.writableEnded = true
				res.writeStatus('500').end('Internal Server Error', true)
			}

			const requestInfo = JSON.parse(
				_StringHelper.decode.call(void 0, apiInfo.requestInfo || '')
			)

			if (!res.writableEnded && (!requestInfo || !requestInfo.apiEndpoint)) {
				res.writableEnded = true
				res.writeStatus('500').end('Internal Server Error', true)
			}

			if (!res.writableEnded) {
				// NOTE - Handle method
				const method = req.getMethod()
				// NOTE - Handle header information
				const headers = new Headers()
				req.forEach((key, value) => {
					if (value instanceof Array) {
						value.forEach((item) => headers.append(key, item))
					} else {
						headers.append(key, value)
					}
				})
				// NOTE - Handle query string information
				const strQueryString = (() => {
					const thisAPIQueryString = _optionalChain([
						req,
						'access',
						(_8) => _8.getUrl,
						'call',
						(_9) => _9(),
						'access',
						(_10) => _10.split,
						'call',
						(_11) => _11('?'),
						'access',
						(_12) => _12[1],
						'optionalAccess',
						(_13) => _13.replace,
						'call',
						(_14) => _14(/requestInfo=([^&]*)/g, ''),
					])

					if (!thisAPIQueryString) return ''

					let targetAPIQueryString = requestInfo.apiEndpoint.split('?')[1]

					if (!targetAPIQueryString) return `?${thisAPIQueryString}`

					const arrThisAPIQueryString = thisAPIQueryString.split('&')

					for (const item of arrThisAPIQueryString) {
						if (!item || targetAPIQueryString.includes(item)) continue
						targetAPIQueryString += `&${item}`
					}

					return `?${targetAPIQueryString}`
				})()
				// NOTE - Handle Post request Body
				const body = await new Promise((response) => {
					res.onData((data) => {
						response(handleArrayBuffer(data) || undefined)
					})
				})

				// NOTE - Handle API Store
				// NOTE - when enableStore, system will store it, but when the client set enableStore to false, system have to remove it. So we must recalculate in each
				if (requestInfo.enableStore) {
					const apiStoreItem = apiStore.get(requestInfo.storeKey)
					if (!apiStoreItem)
						apiStore.set(requestInfo.storeKey, {
							updateAt: Date.now(),
							destroy: setTimeout(
								() => apiStore.delete(requestInfo.storeKey),
								120000
							),
							list: [requestInfo.cacheKey],
						})
					else if (!apiStoreItem.list.includes(requestInfo.cacheKey))
						apiStoreItem.list.push(requestInfo.cacheKey)
				} else if (requestInfo.storeKey && apiStore.has(requestInfo.storeKey)) {
					const apiStoreItem = apiStore.get(requestInfo.storeKey)

					if (apiStoreItem) {
						const index = apiStoreItem.list.indexOf(requestInfo.cacheStore)

						apiStoreItem.list.splice(index, 1)
					}
				}

				const curTime = Date.now()

				if (requestInfo.expiredTime > 0) {
					const apiCacheItem = apiCache.get(requestInfo.cacheKey)

					if (apiCacheItem) {
						const result = await _optionalChain([
							apiCacheItem,
							'optionalAccess',
							(_15) => _15.fetch,
							'call',
							(_16) => _16(),
						])

						if (result && result.status === 200) {
							if (
								requestInfo.renewTime === 0 ||
								curTime - apiCacheItem.updateAt > requestInfo.renewTime
							) {
								clearTimeout(apiCacheItem.destroy)
								const fetchUrl = `${requestInfo.apiEndpoint}${strQueryString}`
								const fetchAPITarget = fetchData(fetchUrl, {
									method,
									headers,
									body,
								})

								apiCache.set(requestInfo.cacheKey, {
									fetch: async () => {
										const tmpResult = await new Promise((res) => {
											fetchAPITarget.response.then((result) => {
												if (result.status === 200) res(result)
											})

											setTimeout(() => {
												fetchAPITarget.controller.abort()
												res(result)
											})
										})

										return tmpResult
									},
									destroy: setTimeout(
										() => apiCache.delete(requestInfo.cacheKey),
										requestInfo.expiredTime
									),
									createAt: apiCacheItem.createAt,
									updateAt: curTime,
								})
							}

							const data = (() => {
								return contentEncoding === 'br'
									? _zlib.brotliCompressSync.call(
											void 0,
											JSON.stringify(result.data)
									  )
									: contentEncoding === 'gzip'
									? _zlib.gzipSync.call(void 0, JSON.stringify(result.data))
									: JSON.stringify(result.data)
							})()

							res.cork(() => {
								res.writableEnded = true
								res.writeStatus(String(result.status)).end(data, true)
							})
						}
					} // IF has apiCacheItem
				} // IF requestInfo.expiredTime > 0

				if (!res.writableEnded) {
					const fetchUrl = `${requestInfo.apiEndpoint}${strQueryString}`
					const fetchAPITarget = fetchData(fetchUrl, {
						method,
						headers,
						body,
					})
					apiCache.set(requestInfo.cacheKey, {
						fetch: () => fetchAPITarget.response,
						destroy: setTimeout(
							() => apiCache.delete(requestInfo.cacheKey),
							requestInfo.expiredTime
						),
						createAt: curTime,
						updateAt: curTime,
					})

					const result = await fetchAPITarget.response
					const data = (() => {
						if (result.status === 200) {
							return contentEncoding === 'br'
								? _zlib.brotliCompressSync.call(
										void 0,
										JSON.stringify(result.data)
								  )
								: contentEncoding === 'gzip'
								? _zlib.gzipSync.call(void 0, JSON.stringify(result.data))
								: JSON.stringify(result.data)
						}

						return JSON.stringify(result.data)
					})()
					res.cork(() => {
						res.writeStatus(String(result.status)).end(data, true)
					})
				}
			} // IF !res.writableEnded
		})
	}

	return {
		init(app) {
			if (!app)
				return _ConsoleHandler2.default.warn('You need provide express app!')
			_app = {
				all: (pattern, handler) => {
					app.get(pattern, handler)
					app.post(pattern, handler)
					app.put(pattern, handler)
					app.patch(pattern, handler)
					app.del(pattern, handler)
				},
			}
			_allRequestHandler()
		},
	}
})()

exports.default = apiService
