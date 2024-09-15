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
			url: string
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
			path?: string
			time?: number | 'infinite'
			renewTime?: number | 'infinite'
		}

		routes?: {
			[key: string]: Omit<
				NonNullable<IServerConfigOptional['crawl']>,
				'routes' | 'custom' | 'cache' | 'content'
			> & {
				cache?: Omit<
					NonNullable<NonNullable<IServerConfigOptional['crawl']>['cache']>,
					'time' | 'path'
				>
			}
		}

		custom?: (url: string) =>
			| (Omit<
					NonNullable<IServerConfigOptional['crawl']>,
					'routes' | 'custom' | 'cache' | 'content'
			  > & {
					cache?: Omit<
						NonNullable<NonNullable<IServerConfigOptional['crawl']>>['cache'],
						'time' | 'path'
					>
					onContentCrawled?: (payload: { html: string }) => string | void
			  })
			| undefined
	}
	routes?: {
		[key: string]: {
			pointsTo?: string
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
			url: string
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
			path?: string
			time: number | 'infinite'
			renewTime: number | 'infinite'
		}

		routes: {
			[key: string]: Omit<
				IServerConfig['crawl'],
				'routes' | 'custom' | 'cache' | 'content'
			> & {
				cache: Omit<IServerConfig['crawl']['cache'], 'time' | 'path'>
			}
		}

		custom?: (url: string) =>
			| (Omit<
					IServerConfig['crawl'],
					'routes' | 'custom' | 'cache' | 'content'
			  > & {
					cache: Omit<IServerConfig['crawl']['cache'], 'time' | 'path'>
					onContentCrawled?: (payload: { html: string }) => string | void
			  })
			| undefined
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
