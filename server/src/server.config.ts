import path from 'path'
import { defineServerConfig } from './utils/ServerConfigHandler'
import { PROCESS_ENV } from './utils/InitEnv'

const ServerConfig = defineServerConfig({
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

export default ServerConfig
