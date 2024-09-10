import { defineServerConfig } from './utils/ServerConfigHandler'

const ServerConfig = defineServerConfig({
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

export default ServerConfig
