'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
var _constants = require('../constants')

const Console = (() => {
	if (_constants.ENV !== 'staging') {
		const consoleFormatted = {}
		for (const key in console) {
			consoleFormatted[key] = () => {}
		}

		return consoleFormatted
	}

	return console
})()

exports.default = Console
