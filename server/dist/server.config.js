'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
var _ServerConfigHandler = require('./utils/ServerConfigHandler')

const ServerConfig = _ServerConfigHandler.defineServerConfig.call(void 0, {
	crawl: {
		enable: true,
		routes: {
			'/login': {
				enable: false,
			},
		},
	},
	api: {
		list: {
			'http://localhost:3000/api': 'XXX',
		},
	},
})

exports.default = ServerConfig
