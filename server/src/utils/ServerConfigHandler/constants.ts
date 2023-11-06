import { IServerConfig } from './types'

export const defaultServerConfig: IServerConfig = {
	locale: {
		enable: false,
		hideDefaultLocale: false,
	},
	isr: {
		enable: true,
	},
}
