import fs from 'fs'
import { resolve } from 'path'
import Console from '../../utils/ConsoleHandler'

const targetPath = resolve(__dirname, '../../../.puppeteerrc.js')

setTimeout(() => {
	try {
		fs.unlinkSync(targetPath)
		Console.log(`File ${targetPath} was permanently deleted`)
	} catch (err) {
		Console.error(err)
	}
}, 500)
