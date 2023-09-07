const { join } = require('path')
const fs = require('fs')

const browserCachePath = (() => {
	const tmpPath = '/tmp'
	if (fs.existsSync(tmpPath)) return tmpPath + '/.cache'

	return join(__dirname, '.cache', 'puppeteer')
})()

/**
 * @type {import("puppeteer").Configuration}
 */

module.exports = {
	// Changes the cache location for Puppeteer.
	cacheDirectory: browserCachePath,
}
