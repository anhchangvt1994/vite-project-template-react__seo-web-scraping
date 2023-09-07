'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _ConsoleHandler = require('../../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _redis = require('redis')
var _utils = require('./utils')
var _path = require('path')
var _path2 = _interopRequireDefault(_path)

// const redisClient = createClient({
// 	legacyMode: true,
// })

const redisClient = _redis.createClient.call(void 0, {
	password: 'G5p8aGdmTRtl49QHWiTeZcO3MCZLf8mv',
	socket: {
		host: 'redis-19014.c252.ap-southeast-1-1.ec2.cloud.redislabs.com',
		port: 19014,
	},
})

const maintainFile = _path2.default.resolve(
	__dirname,
	'../../../../maintain.html'
)
const cacheableStatusCodes = { 200: true, 302: true, 404: true }

const achieve = async (url) => {
	if (!url) {
		_ConsoleHandler2.default.error('Need provide "url" param!')
		return
	}
	console.log('achieve', redisClient.isOpen)
	if (!redisClient.isOpen) await redisClient.connect()

	const key = _utils.getKey.call(void 0, url)
	const isExist = await redisClient.exists(key)

	if (!isExist) return

	const result = await redisClient.hGetAll(key)

	if (!result || !result.body) return

	return {
		...result,
		available: true,
		isInit: false,
	}
}
exports.achieve = achieve // achieve

const get = async (url, options) => {
	// NOTE - set default options
	options = options || {
		autoCreateIfEmpty: true,
	}
	console.log('get', redisClient.isOpen)
	if (!redisClient.isOpen) await redisClient.connect()

	// NOTE - console error if url not provided
	if (!url) {
		_ConsoleHandler2.default.error('Need provide "url" param!')
		return
	}

	const key = _utils.getKey.call(void 0, url)
	const isExist = await redisClient.exists(key)
	console.log('get Exist', isExist)

	if (!isExist) {
		if (!options.autoCreateIfEmpty) return

		try {
			redisClient.hSet(key, 'body', '')
			redisClient.hSet(key, 'createdAt', String(new Date()))
			redisClient.hSet(key, 'updatedAt', String(new Date()))
			redisClient.hSet(key, 'requestAt', String(new Date()))
			redisClient.hSet(key, 'available', 0)
			redisClient.hSet(key, 'isInit', 1)
			redisClient.expire(key, 60)

			_ConsoleHandler2.default.log(`data ${key} has been created.`)
			return await redisClient.hGetAll(key)
		} catch (err) {
			console.error(err)
			return
		}
	}

	await redisClient.hSet(key, 'requestAt', String(new Date()))

	const result = await redisClient.hGetAll(key)

	if (!result || !result.body)
		return {
			...result,
			file: maintainFile,
			isInit: false,
		}

	return {
		...result,
		available: true,
		isInit: false,
	}
}
exports.get = get // get

const set = async ({ url, body, status }) => {
	// NOTE - console error if body empty or status invalid
	if (!cacheableStatusCodes[status] || !body) {
		_ConsoleHandler2.default.error('Status is invalid or Body is empty!')
		return
	}
	console.log('set', redisClient.isOpen)
	if (!redisClient.isOpen) await redisClient.connect()

	const key = _utils.getKey.call(void 0, url)
	const isExist = await redisClient.hGetAll(key)
	let result

	if (!isExist) {
		try {
			await redisClient.set(
				key,
				JSON.stringify({
					body: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					requestAt: new Date(),
					available: false,
				}),
				{
					EX: 5,
				}
			)

			_ConsoleHandler2.default.log(`data ${key} has been created.`)
		} catch (err) {
			_ConsoleHandler2.default.error(err)
			return
		}
	}

	result = await redisClient.hGetAll(key)

	try {
		await redisClient.set(
			key,
			JSON.stringify({
				...result,
				body,
				updatedAt: new Date(),
				requestAt: new Date(),
				available: true,
			}),
			{
				EX: 5,
			}
		)

		_ConsoleHandler2.default.log(`data ${key} has been created.`)
	} catch (err) {
		_ConsoleHandler2.default.error(err)
		return
	}

	result = await exports.get.call(void 0, url, {
		autoCreateIfEmpty: false,
	})

	return result
}
exports.set = set // set
