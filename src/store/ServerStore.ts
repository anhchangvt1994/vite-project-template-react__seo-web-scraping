export interface IBotInfo {
	isBot: boolean
	name: string
}

export interface IDeviceInfo {
	type: string
	isMobile: string | boolean
	os: string
}

export interface ILocaleInfo {
	lang: string
	country: string
	clientLang: string
	clientCountry: string
	defaultLang: string
	defaultCountry: string
	langSelected: string
	countrySelected: string
	hideDefaultLocale: boolean
	range: [number, number]
	region: string
	eu: string
	timezone: string
	city: string
	ll: [number, number]
	metro: number
	area: number
}

export let BotInfo: IBotInfo

export let DeviceInfo: IDeviceInfo

export let LocaleInfo: ILocaleInfo

export const ServerStore = {
	init() {
		if (!BotInfo)
			BotInfo = (() => {
				const strInfo = getCookie('BotInfo')

				return strInfo ? JSON.parse(strInfo) : { isBot: false }
			})()
		if (!DeviceInfo)
			DeviceInfo = (() => {
				const strInfo = getCookie('DeviceInfo')

				return strInfo ? JSON.parse(strInfo) : {}
			})()
		if (!LocaleInfo) {
			LocaleInfo = (() => {
				const strInfo = getCookie('LocaleInfo')

				const info = strInfo ? JSON.parse(strInfo) : {}

				return info
			})()
		}
	},
	reInit: {
		LocaleInfo: () => {
			LocaleInfo = (() => {
				const strInfo = getCookie('LocaleInfo')

				const info = strInfo ? JSON.parse(strInfo) : {}

				return info
			})()
		},
	},
}
