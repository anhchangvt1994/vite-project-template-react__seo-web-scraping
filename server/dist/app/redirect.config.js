'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _serverconfig = require('../server.config')
var _serverconfig2 = _interopRequireDefault(_serverconfig)
var _ValidateLocaleCode = require('./services/ValidateLocaleCode')
var _ValidateLocaleCode2 = _interopRequireDefault(_ValidateLocaleCode)

// NOTE - Declare redirects
const REDIRECT_INFO = [
	{
		path: '/test',
		targetPath: '/',
		statusCode: 302,
	},
]
exports.REDIRECT_INFO = REDIRECT_INFO

// NOTE - Declare redirect middleware
const REDIRECT_INJECTION = (redirectResult, req, res) => {
	const enableLocale =
		_serverconfig2.default.locale.enable &&
		Boolean(
			!_serverconfig2.default.locale.routes ||
				!_serverconfig2.default.locale.routes[redirectResult.originPath] ||
				_serverconfig2.default.locale.routes[redirectResult.originPath].enable
		)

	if (enableLocale) {
		const localeCodeValidationResult = _ValidateLocaleCode2.default.call(
			void 0,
			redirectResult,
			res
		)

		if (localeCodeValidationResult.status !== 200) {
			redirectResult.status =
				redirectResult.status === 301
					? redirectResult.status
					: localeCodeValidationResult.status
			redirectResult.path = localeCodeValidationResult.path
		}
	}

	return redirectResult
}
exports.REDIRECT_INJECTION = REDIRECT_INJECTION // REDIRECT_INJECTION
