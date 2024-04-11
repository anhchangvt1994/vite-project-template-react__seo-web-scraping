const fs = require('fs')
const { resolve } = require('path')

const browserCachePath = (() => {
	const path = resolve(__dirname, './node_modules/.puppeteer-cache')
	if (!fs.existsSync(path)) fs.mkdirSync(path)

	return path
})()

/**
 * @type {import("puppeteer").Configuration}
 */

module.exports = {
	// Changes the cache location for Puppeteer.
	cacheDirectory: browserCachePath,
}
