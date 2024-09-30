import crypto from 'crypto'
import { ICryptCrawlerKeyCacheOptions } from './types'

export const CRYPTO_CRAWLER_KEY_CACHE_ALGORITHM = 'aes-128-cbc'
export const CRYPTO_CRAWLER_KEY_CACHE_OPTIONS_DEFAULT: ICryptCrawlerKeyCacheOptions =
	(() => {
		const hash = crypto
			.createHash('sha256')
			.update('puppeteer-ssr-key')
			.digest()

		const key = hash.toString('hex').slice(0, 16) // 32 bytes cho key
		const iv = hash.toString('hex').slice(16, 32) // 16 bytes cho iv
		return {
			key,
			iv,
		}
	})()
