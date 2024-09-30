import crypto from 'crypto'
import { ICryptCrawlerKeyCacheOptions } from './types'
import {
	CRYPTO_CRAWLER_KEY_CACHE_OPTIONS_DEFAULT,
	CRYPTO_CRAWLER_KEY_CACHE_ALGORITHM,
} from './constants'

// NOTE - https://www.tutorialspoint.com/encrypt-and-decrypt-data-in-nodejs

export const encryptCrawlerKeyCache = (
	text: string,
	options?: ICryptCrawlerKeyCacheOptions
) => {
	if (!text) return

	const { key, iv } = {
		...CRYPTO_CRAWLER_KEY_CACHE_OPTIONS_DEFAULT,
		...(options || {}),
	}

	const cipher = crypto.createCipheriv(
		CRYPTO_CRAWLER_KEY_CACHE_ALGORITHM,
		Buffer.from(key),
		iv
	)
	const encrypted = cipher.update(text)

	return Buffer.concat([encrypted, cipher.final()]).toString('hex')
} // encryptCrawlerKeyCache

export const decryptCrawlerKeyCache = (
	encrypted: string | undefined,
	options?: ICryptCrawlerKeyCacheOptions
) => {
	if (!encrypted) return

	const { key, iv } = {
		...CRYPTO_CRAWLER_KEY_CACHE_OPTIONS_DEFAULT,
		...(options || {}),
	}

	const encryptedText = Buffer.from(encrypted, 'hex')
	const decipher = crypto.createDecipheriv(
		CRYPTO_CRAWLER_KEY_CACHE_ALGORITHM,
		Buffer.from(key),
		iv
	)
	const decrypted = decipher.update(encryptedText)

	return Buffer.concat([decrypted, decipher.final()]).toString()
} // decryptCrawlerKeyCache
