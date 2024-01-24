'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _path = require('path')
var _path2 = _interopRequireDefault(_path)

const dotenv = require('dotenv')

const ENV = ['development', 'production'].includes(process.env.ENV)
	? process.env.ENV
	: 'production'
exports.ENV = ENV
const MODE = ['development', 'preview', 'production'].includes(process.env.MODE)
	? process.env.MODE
	: process.env.ENV === 'development'
	? 'development'
	: 'production'
exports.MODE = MODE

const envModeList = {
	// NOTE - This means you can debug staging and production in development environment
	development_development: 'development',
	development_preview: 'staging',
	development_production: 'production',

	// NOTE - This means your final environment you need to deploy
	production_development: 'staging',
	production_preview: 'uat',
	production_production: 'production',
}
const ENV_MODE = envModeList[`${exports.ENV}_${exports.MODE}`]

exports.ENV_MODE = ENV_MODE

const PROCESS_ENV = (() => {
	dotenv.config({
		path: _path2.default.resolve(__dirname, '../../.env'),
	})

	switch (exports.ENV_MODE) {
		case 'staging':
			dotenv.config({
				path: _path2.default.resolve(__dirname, '../../.env.staging'),
				override: true,
			})
			break
		case 'uat':
			dotenv.config({
				path: _path2.default.resolve(__dirname, '../../.env.uat'),
				override: true,
			})
			break
		default:
			dotenv.config({
				path: _path2.default.resolve(__dirname, '../../.env.production'),
				override: true,
			})
	}

	return process.env
})()
exports.PROCESS_ENV = PROCESS_ENV
