'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _constants = require('../constants')

const dotenv = require('dotenv')

const PROCESS_ENV = (() => {
	dotenv.config({
		path: _path2.default.resolve(__dirname, '../../.env'),
	})

	if (_constants.ENV_MODE !== 'development') {
		dotenv.config({
			path: _path2.default.resolve(__dirname, '../../.env.production'),
			override: true,
		})
	}

	return process.env
})()

exports.default = PROCESS_ENV
