const fs = require('fs')
const { resolve } = require('path')

const browserCachePath = (() => {
	if (
		process.env.PUPPETEER_CACHE_DIR &&
		fs.existsSync(process.env.PUPPETEER_CACHE_DIR.replace('.cache', ''))
	)
		return process.env.PUPPETEER_CACHE_DIR

	const path = resolve(__dirname, './node_modules/puppeteer')
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
