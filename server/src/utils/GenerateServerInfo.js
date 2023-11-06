const os = require('os')
const dns = require('dns')
const fs = require('fs')
const path = require('path')
const { resolve } = require('path')

const serverInfoPath = resolve(__dirname, '../../server-info.json')

const internationalTLDs = [
	'com',
	'org',
	'net',
	'edu',
	'gov',
	'biz',
	'info',
	'name',
	'pro',
	'aero',
	'coop',
	'museum',
	'asia',
	'cat',
	'int',
	'jobs',
	'mobi',
	'tel',
	'travel',
]

const countryTLDs = [
	'us',
	'uk',
	'de',
	'fr',
	'jp',
	'cn',
	'in',
	'br',
	'ru',
	'au',
	'vn',
	'ca',
	'kr',
	'es',
	'it',
	'nl',
	'se',
	'ch',
	'be',
	'dk',
	'no',
	'fi',
]

const TLDsMerged = new Array().concat(internationalTLDs).concat(countryTLDs)

;(async () => {
	if (fs.existsSync(serverInfoPath)) return

	const serverInfo = {
		platform: os.platform(),
		hostname: os.hostname(),
		address: '',
		isServer: false,
	}

	const address = await new Promise((res) => {
		dns.lookup(serverInfo.hostname, (err, address) => {
			if (err) return res('')
			res(address)
		})
	})

	serverInfo.address = address
	serverInfo.isServer = !Boolean(
		address === 'localhost' ||
			address === '::1' ||
			address.startsWith('fe80::') ||
			/^(127)(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(address)
	)
	// const subfixDomain = address.split('.').slice(-1).join('.')
	// serverInfo.isServer = (TLDsMerged.includes(subfixDomain))
	// serverInfo.isServer = true

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
