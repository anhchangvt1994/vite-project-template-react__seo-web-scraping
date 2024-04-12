'use strict'
Object.defineProperty(exports, '__esModule', { value: true })

const defaultServerConfig = {
	locale: {
		enable: false,
		routes: {},
	},
	isRemoteCrawler: false,
	crawl: {
		enable: true,
		content: 'desktop',
		cache: {
			enable: true,
			time: 4 * 3600,
			renewTime: 3 * 60,
		},
		compress: true,
		optimize: true,
		routes: {},
	},
}
exports.defaultServerConfig = defaultServerConfig
