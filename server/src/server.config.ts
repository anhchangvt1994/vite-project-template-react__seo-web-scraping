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
})

export default ServerConfig
