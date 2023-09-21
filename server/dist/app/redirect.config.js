'use strict'
Object.defineProperty(exports, '__esModule', { value: true })

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
const REDIRECT_INJECTION = (req) => {}
exports.REDIRECT_INJECTION = REDIRECT_INJECTION // REDIRECT_INJECTION
