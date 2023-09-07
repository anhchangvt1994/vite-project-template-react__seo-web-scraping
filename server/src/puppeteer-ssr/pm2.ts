import pm2 from 'pm2'
import path from 'path'
import chokidar from 'chokidar'
import Console from '../utils/ConsoleHandler'
import { resourceExtension } from '../constants'

const CLUSTER_INSTANCES =
	process.env.CLUSTER_INSTANCES === 'max'
		? 0
		: Number(process.env.CLUSTER_INSTANCES || 2)
const CLUSTER_KILL_TIMEOUT =
	process.env.CLUSTER_INSTANCES === 'max' ? 7000 : 1600

const distPath = resourceExtension === 'js' ? 'server/dist' : 'server/src'

// connect to pm2 daemon
pm2.connect(false, (err) => {
	const selfProcess = process
	if (err) {
		Console.error(err)
		selfProcess.exit(2)
	}

	pm2.list(async function (err, processList) {
		if (err) {
			Console.error(err)
			process.exit(2)
		}

		const hasRestarted = await new Promise((resAfterCheckToRestart) => {
			const totalProcess = processList.length
			if (!totalProcess) resAfterCheckToRestart(false)

			let counter = 0
			for (const process of processList) {
				if (process.name === 'cleaner-service' && process.pm_id !== undefined) {
					// pm2.restart(process.pm_id, function (err) {
					// 	counter++
					// 	if (err) {
					// 		console.error(err)
					// 		selfProcess.exit(2)
					// 	}
					// 	if (counter === totalProcess) resAfterCheckToRestart(true)
					// })
				} else if (
					(process.name === 'start-puppeteer-ssr' ||
						process.name === 'puppeteer-ssr') &&
					process.pm_id !== undefined
				) {
					pm2.restart(process.pm_id, function (err) {
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
			// pm2.start(
			// 	{
			// 		name: 'cleaner-service',
			// 		script: `${distPath}/utils/CleanerService.${resourceExtension}`,
			// 		instances: 1,
			// 		exec_mode: 'cluster',
			// 		interpreter: './node_modules/.bin/sucrase',
			// 		interpreter_args: '--require sucrase/register',
			// 		wait_ready: true,
			// 		kill_timeout: CLUSTER_KILL_TIMEOUT,
			// 		cwd: '.',
			// 		env: {},
			// 	},
			// 	function (err, apps) {
			// 		if (err) {
			// 			Console.error(err)
			// 			return
			// 		}
			// 	}
			// )

			pm2.start(
				{
					name: 'puppeteer-ssr',
					script: `${distPath}/index.${resourceExtension}`,
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
						Console.error(err)
						return
					}

					const watcher = chokidar.watch(
						[
							path.resolve(__dirname, `./**/*.${resourceExtension}`),
							path.resolve(__dirname, `../utils/**/*.${resourceExtension}`),
						],
						{
							ignored: /$^/,
							persistent: true,
						}
					) // /$^/ is match nothing

					watcher.on('change', function (files) {
						pm2.reload('puppeteer-ssr', () => {})
					})
				}
			)
		}
	})
})
