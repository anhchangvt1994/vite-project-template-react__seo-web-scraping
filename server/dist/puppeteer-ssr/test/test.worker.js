'use strict'
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
function _optionalChain(ops) {
	let lastAccessLHS = undefined
	let value = ops[0]
	let i = 1
	while (i < ops.length) {
		const op = ops[i]
		const fn = ops[i + 1]
		i += 2
		if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) {
			return undefined
		}
		if (op === 'access' || op === 'optionalAccess') {
			lastAccessLHS = value
			value = fn(value)
		} else if (op === 'call' || op === 'optionalCall') {
			value = fn((...args) => value.call(lastAccessLHS, ...args))
			lastAccessLHS = undefined
		}
	}
	return value
}
var _puppeteercore = require('puppeteer-core')
var _puppeteercore2 = _interopRequireDefault(_puppeteercore)
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)
var _constants = require('../constants')
var _path = require('path')

const _deleteUserDataDir = async (path) => {
	if (path) {
		try {
			await _optionalChain([
				_workerpool2.default,
				'access',
				(_) => _.pool,
				'call',
				(_2) =>
					_2(
						_path.resolve.call(
							void 0,
							__dirname,
							'../utils/FollowResource.worker/index.ts'
						)
					),
				'optionalAccess',
				(_3) => _3.exec,
				'call',
				(_4) => _4('deleteResource', [path]),
			])
		} catch (err) {
			console.error(err)
		}
	}
} // _deleteUserDataDir

const loadCapacityTest = async (url) => {
	const userDataDir = `server/src/puppeteer-ssr/test/browsers/user_data_${Date.now()}`
	const browser = await _puppeteercore2.default.launch({
		..._constants.defaultBrowserOptions,
		headless: 'new',
		userDataDir,
		args: [
			..._constants.optionArgs,
			'--user-agent=Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
			'--headless',
		],
	})

	if (browser.isConnected()) {
		const page = await browser.newPage()
		const response = await page.goto(url)
		console.log('-------------')
		if (
			_optionalChain([
				response,
				'optionalAccess',
				(_5) => _5.status,
				'call',
				(_6) => _6(),
			]) === 200
		) {
			console.log('\x1b[32m', 'Success!')
			console.log('url :', url)
		} else {
			console.log('\x1b[31m', 'Fail!')
			console.log('url :', url)
		}
		console.log('-------------')
		await browser.close()
		_deleteUserDataDir(userDataDir)
	}
}

_workerpool2.default.worker({
	loadCapacityTest,
})
