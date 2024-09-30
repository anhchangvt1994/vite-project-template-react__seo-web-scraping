export interface IServerConfigOptional {
	locale?: {
		enable: boolean
		defaultLang?: string | undefined
		defaultCountry?: string | undefined
		hideDefaultLocale?: boolean

		routes?: {
			[key: string]: Omit<
				NonNullable<IServerConfigOptional['locale']>,
				'enable' | 'routes' | 'custom'
			> & {
				enable?: boolean
			}
		}

		custom?: (url: string) => Omit<
			NonNullable<IServerConfigOptional['locale']>,
			'enable' | 'routes' | 'custom'
		> & {
			enable?: boolean
		}
	}

	isRemoteCrawler?: boolean

	crawl?: {
		enable: boolean

		content?: 'desktop' | 'mobile'

		optimize?: 'all' | Array<'shallow' | 'deep' | 'script' | 'style'>

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
				'enable' | 'routes' | 'custom' | 'cache' | 'content'
			> & {
				enable?: boolean
				cache?: Omit<
					NonNullable<NonNullable<IServerConfigOptional['crawl']>['cache']>,
					'enable' | 'path'
				> & {
					enable?: boolean
				}
			}
		}

		custom?: (url: string) =>
			| (Omit<
					NonNullable<IServerConfigOptional['crawl']>,
					'enable' | 'routes' | 'custom' | 'cache' | 'content'
			  > & {
					enable?: boolean
					cache?: Omit<
						NonNullable<NonNullable<IServerConfigOptional['crawl']>>['cache'],
						'path'
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

		custom?: (url: string) => Omit<
			NonNullable<IServerConfig['locale']>,
			'enable' | 'routes' | 'custom'
		> & {
			enable?: boolean
		}
	}

	isRemoteCrawler: boolean

	crawl: {
		enable: boolean

		content: 'desktop' | 'mobile'

		optimize: 'all' | Array<'shallow' | 'deep' | 'script' | 'style'>

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
				cache: Omit<IServerConfig['crawl']['cache'], 'path'>
			}
		}

		custom?: (url: string) =>
			| (Omit<
					IServerConfig['crawl'],
					'routes' | 'custom' | 'cache' | 'content'
			  > & {
					cache: Omit<IServerConfig['crawl']['cache'], 'path'>
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
