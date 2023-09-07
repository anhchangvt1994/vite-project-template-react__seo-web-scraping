const fs = require('fs')
const { resolve } = require('path')
const chromium = require('@sparticuz/chromium-min')

const serverInfoPath = resolve(__dirname, '../../../server-info.json')

let serverInfoStringify

if (fs.existsSync(serverInfoPath)) {
	serverInfoStringify = fs.readFileSync(serverInfoPath)
}

let serverInfo
if (serverInfoStringify) {
	try {
		serverInfo = JSON.parse(serverInfoStringify)
	} catch (err) {
		console.error(err)
	}
}

if (
	serverInfo &&
	serverInfo.platform.toLowerCase() === 'linux' &&
	serverInfo.isServer
) {
	;(async () => {
		await chromium.executablePath(
			'https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v116.0.0-pack.tar'
		)

		console.log('Finish generate chromium executable path!')
	})()
}
