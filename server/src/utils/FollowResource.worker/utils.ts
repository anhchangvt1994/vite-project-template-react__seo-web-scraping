import fs from 'fs-extra'
import Console from '../ConsoleHandler'

export const deleteResource = (path: string) => {
	if (!path || !fs.existsSync(path)) return Console.log('Path can not empty!')

	fs.emptyDirSync(path)
	fs.remove(path).catch((err) => {
		if (err) {
			Console.error(err.message)
		}
	})
}
