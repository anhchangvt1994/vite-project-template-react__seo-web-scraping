'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)

const serverInfoPath = _path2.default.resolve(__dirname, '../server-info.json')

let serverInfoStringify

if (_fs2.default.existsSync(serverInfoPath)) {
	serverInfoStringify = _fs2.default.readFileSync(serverInfoPath)
}

let serverInfo
if (serverInfoStringify) {
	try {
		serverInfo = exports.serverInfo = JSON.parse(serverInfoStringify)
	} catch (err) {
		console.error(err)
	}
}

exports.serverInfo = serverInfo

const pagesPath =
	!serverInfo || serverInfo.isServer
		? (() => {
				const tmpPath = '/tmp'
				if (_fs2.default.existsSync(tmpPath)) return tmpPath + '/pages'

				return _path2.default.resolve(
					__dirname,
					'./puppeteer-ssr/utils/Cache.worker/pages'
				)
		  })()
		: _path2.default.resolve(
				__dirname,
				'./puppeteer-ssr/utils/Cache.worker/pages'
		  )
exports.pagesPath = pagesPath

const userDataPath =
	!serverInfo || serverInfo.isServer
		? (() => {
				const tmpPath = '/tmp'
				if (_fs2.default.existsSync(tmpPath)) return tmpPath + '/browsers'

				return _path2.default.resolve(__dirname, './puppeteer-ssr/browsers')
		  })()
		: _path2.default.resolve(__dirname, './puppeteer-ssr/browsers')
exports.userDataPath = userDataPath

const resourceExtension = !serverInfo || serverInfo.isServer ? 'js' : 'ts'
exports.resourceExtension = resourceExtension

const SERVER_LESS = !!process.env.SERVER_LESS
exports.SERVER_LESS = SERVER_LESS
const ENV = ['development', 'production'].includes(process.env.ENV)
	? process.env.ENV
	: 'production'
exports.ENV = ENV
