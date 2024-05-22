'use strict'
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _chokidar = require('chokidar')
var _chokidar2 = _interopRequireDefault(_chokidar)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _pm2 = require('pm2')
var _pm22 = _interopRequireDefault(_pm2)
var _constants = require('../constants')
var _ConsoleHandler = require('../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)
var _InitEnv = require('../utils/InitEnv')

const CLUSTER_INSTANCES =
	_InitEnv.PROCESS_ENV.CLUSTER_INSTANCES === 'max'
		? 0
		: Number(_InitEnv.PROCESS_ENV.CLUSTER_INSTANCES || 2)
const CLUSTER_KILL_TIMEOUT =
	_InitEnv.PROCESS_ENV.CLUSTER_INSTANCES === 'max' ? 7000 : 1600

// connect to pm2 daemon
_pm22.default.connect(false, (err) => {
	const selfProcess = process
	if (err) {
		_ConsoleHandler2.default.error(err)
		selfProcess.exit(2)
	}

	_pm22.default.list(async function (err, processList) {
		if (err) {
			_ConsoleHandler2.default.error(err)
			process.exit(2)
		}

		const hasRestarted = await new Promise((resAfterCheckToRestart) => {
			const totalProcess = processList.length
			if (!totalProcess) resAfterCheckToRestart(false)

			let counter = 0
			for (const process of processList) {
				if (
					(process.name === 'start-puppeteer-ssr' ||
						process.name === 'puppeteer-ssr') &&
					process.pm_id !== undefined
				) {
					_pm22.default.restart(process.pm_id, function (err) {
						counter++
						if (err) {
							console.error(err)
							selfProcess.exit(2)
						}

						if (counter === totalProcess) resAfterCheckToRestart(true)
					})
				} else {
					counter++
				}
			}
		})

		if (!hasRestarted) {
			_pm22.default.start(
				{
					name: 'puppeteer-ssr',
					script: `server/${_constants.resourceDirectory}/index.uws.${_constants.resourceExtension}`,
					instances: CLUSTER_INSTANCES,
					exec_mode: 'cluster',
					interpreter: './node_modules/.bin/sucrase',
					interpreter_args: '--require sucrase/register',
					wait_ready: true,
					kill_timeout: CLUSTER_KILL_TIMEOUT,
					cwd: '.',
					env: {},
				},
				function (err, apps) {
					if (err) {
						_ConsoleHandler2.default.error(err)
						return
					}

					const watcher = _chokidar2.default.watch(
						[
							_path2.default.resolve(
								__dirname,
								`../../${_constants.resourceDirectory}/**/*.${_constants.resourceExtension}`
							),
						],
						{
							ignored: /$^/,
							persistent: true,
						}
					) // /$^/ is match nothing

					watcher.on('change', function (files) {
						_pm22.default.reload('puppeteer-ssr', () => {})
					})
				}
			)
		}
	})
})
