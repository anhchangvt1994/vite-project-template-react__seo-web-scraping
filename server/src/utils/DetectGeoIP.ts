import { lookup } from 'geoip-lite'

export interface IGeoIPInformation {
	range: [number, number]
	country: string
	region: string
	eu: string
	timezone: string
	city: ''
	ll: [number, number]
	metro: number
	area: number
}

const IP_INFO_DEFAULT: IGeoIPInformation = {
	range: [1984292864, 1984294911],
	country: 'VN',
	region: '',
	eu: '0',
	timezone: 'Asia/Ho_Chi_Minh',
	city: '',
	ll: [16, 106],
	metro: 0,
	area: 50,
}

export default function generateIPInfo(req) {
	if (!req || !req.headers || !req.connection) return IP_INFO_DEFAULT

	const clientIp = (
		req.headers['x-forwarded-for'] ||
		req.connection.remoteAddress ||
		''
	)
		.toString()
		.replace(/::ffff:|::1/, '')

	const ipInfo = lookup(clientIp) || IP_INFO_DEFAULT
	return ipInfo
} // generateIPInfo
