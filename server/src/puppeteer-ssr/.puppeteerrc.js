const fs = require('fs')
const { resolve } = require('path')

const browserCachePath = (() => {
	const path = resolve(__dirname, './node_modules/puppeteer-ssr')
	if (!fs.existsSync(path)) return

	return path + '/.cache'
})()

/**
 * @type {import("puppeteer").Configuration}
 */

module.exports = {
	// Changes the cache location for Puppeteer.
	cacheDirectory: browserCachePath,
}
