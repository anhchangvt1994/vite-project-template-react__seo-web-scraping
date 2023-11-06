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
