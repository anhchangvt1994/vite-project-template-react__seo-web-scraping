const fs = require('fs')
const { resolve } = require('path')

const puppeteerConfigPath = resolve(__dirname, '../.puppeteerrc.js')
const targetPath = resolve(__dirname, '../../../../.puppeteerrc.js')
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

if (serverInfo && serverInfo.platform !== 'linux' && serverInfo.isServer) {
	fs.copyFile(puppeteerConfigPath, targetPath, (err) => {
		if (err) {
			console.error(err)
			throw err
		}

		console.log(`File ${puppeteerConfigPath} was copied to ${targetPath}`)
	})
}
