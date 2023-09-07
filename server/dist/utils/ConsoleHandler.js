'use strict'
Object.defineProperty(exports, '__esModule', { value: true })

const Console = (() => {
	if (process.env.ENV !== 'staging') {
		const consoleFormatted = {}
		for (const key in console) {
			consoleFormatted[key] = () => {}
		}

		return consoleFormatted
	}

	return console
})()

exports.default = Console
