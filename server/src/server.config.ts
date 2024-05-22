import { defineServerConfig } from './utils/ServerConfigHandler'

const ServerConfig = defineServerConfig({
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

export default ServerConfig
