'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _ServerConfigHandler = require('./utils/ServerConfigHandler')
var _InitEnv = require('./utils/InitEnv')

const ServerConfig = _ServerConfigHandler.defineServerConfig.call(void 0, {
	crawl: {
		enable: true,
		routes: {
			'/login': {
				enable: false,
			},
		},

		cache: {
			enable: true,
			path: _InitEnv.PROCESS_ENV.IS_SERVER
				? _path2.default.resolve(__dirname, '../../../cache')
				: '',
		},
	},
	api: {
		list: {
			'http://localhost:3000/api': 'XXX',
		},
	},
})

exports.default = ServerConfig
