export interface IBotInfo {
	isBot: boolean
	name: string
}

export interface IDeviceInfo {
	type: string
	isMobile: string | boolean
	os: string
}

export let BotInfo: IBotInfo

export let DeviceInfo: IDeviceInfo

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
	},
}
