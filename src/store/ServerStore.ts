export interface IEnvironment {
	ENV: 'development' | 'production'
	MODE: 'development' | 'preview' | 'production'
	ENV_MODE: 'development' | 'staging' | 'uat' | 'production'
}

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

export let EnvironmentInfo: IEnvironment

export let BotInfo: IBotInfo

export let DeviceInfo: IDeviceInfo

export let LocaleInfo: ILocaleInfo

export const ServerStore = (() => {
	const html = document.documentElement
	return {
		init() {
			if (!EnvironmentInfo)
				EnvironmentInfo = (() => {
					const strInfo = getCookie('EnvironmentInfo')

					return strInfo
						? JSON.parse(strInfo)
						: {
								ENV: 'production',
								MODE: 'production',
								ENV_MODE: 'production',
						  }
				})()
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

			if (html) {
				html.setAttribute(
					'lang',
					LocaleInfo.langSelected || LocaleInfo.clientLang
				)
			}
		},
		reInit: {
			LocaleInfo: () => {
				LocaleInfo = (() => {
					const strInfo = getCookie('LocaleInfo')

					const info = strInfo ? JSON.parse(strInfo) : {}

					return info
				})()

				if (html) {
					html.setAttribute(
						'lang',
						LocaleInfo.langSelected || LocaleInfo.clientLang
					)
				}
			},
		},
	}
})()
