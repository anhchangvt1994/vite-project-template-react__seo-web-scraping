const fs = require('fs')
const { resolve } = require('path')

const targetPath = resolve(__dirname, '../../../.puppeteerrc.js')

setTimeout(() => {
	if (fs.existsSync(targetPath)) {
		try {
			fs.unlinkSync(targetPath)
		} catch (err) {
			console.error(err)
		}
	}
}, 500)
