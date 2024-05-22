import { IProxyAPIInitParams } from './types'

export const ProxyAPI = (() => {
	return {
		init: ({ targetBaseUrl }: IProxyAPIInitParams) => {
			if (!targetBaseUrl) {
				console.error('targetBaseUrl is required!')
				return
			}

			const _get = (
				endpoint: string,
				config?: {
					expiredTime?: number
					renewTime?: number
					cacheKey?: string
					enableStore?: boolean
					storeInDevice?: 'mobile' | 'tablet' | 'desktop'
					relativeCacheKey?: string[]
				}
			) => {
				if (!endpoint) return ''

				config = {
					expiredTime: 0,
					renewTime: 0,
					cacheKey: endpoint,
					enableStore: false,
					relativeCacheKey: [],
					...(config ? config : {}),
				}

				config.cacheKey = hashCode(config.cacheKey)

				if (config.relativeCacheKey.length) {
					config.relativeCacheKey = (() => {
						const arrRelativeCacheKey = []

						for (const cacheKeyItem of config.relativeCacheKey) {
							if (cacheKeyItem && cacheKeyItem !== config.cacheKey) {
								arrRelativeCacheKey.push(hashCode(cacheKeyItem))
							}
						}

						return arrRelativeCacheKey
					})()
				}

				const requestInfo: { [key: string]: any } = {
					endpoint,
					baseUrl: targetBaseUrl,
					storeKey: hashCode(
						`${location.pathname}${location.search}${
							config.storeInDevice
								? location.search
									? '&device=' + config.storeInDevice
									: '?device=' + config.storeInDevice
								: ''
						}`
					),
					...config,
				}

				return `/api?requestInfo=${encode(JSON.stringify(requestInfo))}`
			} // _get

			return {
				targetBaseUrl,
				get: _get,
			}
		},
	}
})()
