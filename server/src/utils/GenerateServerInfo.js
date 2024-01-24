const os = require('os')
const dns = require('dns')
const fs = require('fs')
const path = require('path')
const { resolve } = require('path')
const ObjectToEnvConverter = require('./ObjectToEnvConverter')

const serverInfoPath = resolve(__dirname, '../../server-info.json')
const envPath = resolve(__dirname, '../../.env')

const readFileENVSync = () => {
	if (!fs.existsSync(envPath)) return {}

	const envStringify = fs.readFileSync(envPath, {
		encoding: 'utf8',
		flag: 'r',
	})

	if (!envStringify) return {}

	let envInfo = {}
	envStringify.split('\n').forEach((line) => {
		const [name, value] = line.split('=')
		if (name && value) {
			envInfo[name] = value
		}
	})

	return envInfo
} // readFileENVSync

;(async () => {
	if (fs.existsSync(serverInfoPath)) return

	const serverInfo = {
		platform: os.platform(),
		hostname: os.hostname(),
		address: '',
		// isServer: false,
	}

	const address = await new Promise((res) => {
		dns.lookup(serverInfo.hostname, (err, address) => {
			if (err) return res('')
			res(address)
		})
	})

	serverInfo.address = address

	const envInfo = readFileENVSync()

	if (envInfo) {
		try {
			fs.writeFileSync(
				envPath,
				ObjectToEnvConverter({
					...envInfo,
					PLATFORM: serverInfo.platform,
					HOSTNAME: serverInfo.hostname,
					ADDRESS: serverInfo.address,
				})
			)

			resolve('done')
		} catch {}
	}

	console.log(serverInfo)

	fs.writeFile(
		path.resolve(__dirname, '../../server-info.json'),
		JSON.stringify(serverInfo),
		(err) => {
			if (err) {
				console.log(err)
				return
			}

			console.log(`File server-info.json has been created.`)
		}
	)
})()
