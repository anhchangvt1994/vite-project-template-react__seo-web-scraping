'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
var _ServerConfigHandler = require('./utils/ServerConfigHandler')

const ServerConfig = _ServerConfigHandler.defineServerConfig.call(void 0, {
	locale: {
		enable: true,
		defaultLang: 'vi',
		defaultCountry: 'vn',
		routes: {
			'/login': {
				enable: false,
			},
		},
	},
	crawler: 'https://on-ferret-above.ngrok-free.app',
	api: {
		list: {
			'http://localhost:3000/api': 'XXX',
		},
	},
})

exports.default = ServerConfig
