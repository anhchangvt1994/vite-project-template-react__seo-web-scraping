'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _ServerConfigHandler = require('./utils/ServerConfigHandler')

const ServerConfig = _ServerConfigHandler.defineServerConfig.call(void 0, {
	crawl: {
		enable: true,
		routes: {
			'/login': {
				enable: false,
			},
			'/': {
				cache: {
					time: 'infinite',
				},
			},
		},

		// cache: {
		// 	enable: true,
		// 	path: PROCESS_ENV.IS_SERVER
		// 		? path.resolve(__dirname, '../../../cache')
		// 		: '',
		// },
	},
	api: {
		list: {
			'http://localhost:3000/api': 'XXX',
		},
	},
})

exports.default = ServerConfig
