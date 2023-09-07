'use strict'
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)
var _SSRGenerator = require('./SSRGenerator')
var _SSRGenerator2 = _interopRequireDefault(_SSRGenerator)
var _constants = require('../../constants')

let generateSSR
const generate = (url, params) => {
	if (!generateSSR) {
		generateSSR = _SSRGenerator2.default.init({
			...params,
			userDataDir: () => `${_constants.userDataPath}/user_data_${Date.now()}`,
		})
	}

	return generateSSR(url)
}

// create a worker and register public functions
_workerpool2.default.worker({
	generate,
})
