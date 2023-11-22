export interface IServerConfigOptional {
	locale?: {
		enable: boolean
		defaultLang?: string | undefined
		defaultCountry?: string | undefined
		hideDefaultLocale?: boolean

		routes?: {
			[key: string]: {
				enable: boolean
				defaultLang?: string | undefined
				defaultCountry?: string | undefined
				hideDefaultLocale?: boolean
			}
		}
	}
	isr?: {
		enable: boolean

		routes?: {
			[key: string]: {
				enable: boolean
			}
		}
	}
	crawler?: string
	crawlerSecretKey?: string
}

export interface IServerConfig extends IServerConfigOptional {
	locale: {
		enable: boolean
		defaultLang?: string | undefined
		defaultCountry?: string | undefined
		hideDefaultLocale?: boolean

		routes?: {
			[key: string]: {
				enable: boolean
				defaultLang?: string | undefined
				defaultCountry?: string | undefined
				hideDefaultLocale?: boolean
			}
		}
	}
	isr: {
		enable: boolean

		routes?: {
			[key: string]: {
				enable: boolean
			}
		}
	}
}
