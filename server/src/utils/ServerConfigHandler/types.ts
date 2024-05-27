export interface IServerConfigOptional {
	locale?: {
		enable: boolean
		defaultLang?: string | undefined
		defaultCountry?: string | undefined
		hideDefaultLocale?: boolean

		routes?: {
			[key: string]: Omit<
				NonNullable<IServerConfigOptional['locale']>,
				'routes' | 'custom'
			>
		}

		custom?: (
			path: string
		) => Omit<NonNullable<IServerConfigOptional['locale']>, 'routes' | 'custom'>
	}

	isRemoteCrawler?: boolean

	crawl?: {
		enable: boolean

		content?: 'desktop' | 'mobile'

		optimize?: boolean

		compress?: boolean

		cache?: {
			enable: boolean
			time?: number
			renewTime?: number
		}

		routes?: {
			[key: string]: Omit<
				NonNullable<IServerConfigOptional['crawl']>,
				'routes' | 'custom' | 'cache' | 'content'
			> & {
				cache: Omit<
					NonNullable<IServerConfigOptional['crawl']>['cache'],
					'time'
				>
			}
		}

		custom?: (path: string) => Omit<
			NonNullable<IServerConfigOptional['crawl']>,
			'routes' | 'custom' | 'cache' | 'content'
		> & {
			cache: Omit<NonNullable<IServerConfigOptional['crawl']>['cache'], 'time'>
		}
	}
	crawler?: string
	crawlerSecretKey?: string

	api?: {
		list?: {
			[key: string]:
				| string
				| {
						secretKey: string
						headerSecretKeyName?: string
				  }
		}
	}
}

export interface IServerConfig extends IServerConfigOptional {
	locale: {
		enable: boolean
		defaultLang?: string | undefined
		defaultCountry?: string | undefined
		hideDefaultLocale?: boolean

		routes: {
			[key: string]: Omit<
				NonNullable<IServerConfig['locale']>,
				'routes' | 'custom'
			>
		}

		custom?: (
			path: string
		) => Omit<NonNullable<IServerConfig['locale']>, 'routes' | 'custom'>
	}

	isRemoteCrawler: boolean

	crawl: {
		enable: boolean

		content: 'desktop' | 'mobile'

		optimize: boolean

		compress: boolean

		cache: {
			enable: boolean
			time: number
			renewTime: number
		}

		routes: {
			[key: string]: Omit<
				IServerConfig['crawl'],
				'routes' | 'custom' | 'cache' | 'content'
			> & {
				cache: Omit<IServerConfig['crawl']['cache'], 'time'>
			}
		}

		custom?: (path: string) => Omit<
			IServerConfig['crawl'],
			'routes' | 'custom' | 'cache' | 'content'
		> & {
			cache: Omit<IServerConfig['crawl']['cache'], 'time'>
		}
	}

	api: {
		list: {
			[key: string]: {
				secretKey: string
				headerSecretKeyName: string
			}
		}
	}
}
