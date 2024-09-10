import fs from 'fs'
import { HttpResponse } from 'uWebSockets.js'
import { brotliCompressSync, brotliDecompressSync, gzipSync } from 'zlib'
import { COOKIE_EXPIRED } from '../../constants'
import { CACHEABLE_STATUS_CODE } from '../constants'
import { ISSRResult } from '../types'

const COOKIE_EXPIRED_SECOND = COOKIE_EXPIRED / 1000

const _setCookie = (res: HttpResponse) => {
	res
		.writeHeader(
			'set-cookie',
			`EnvironmentInfo=${JSON.stringify(
				res.cookies.environmentInfo
			)};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
		)
		.writeHeader(
			'set-cookie',
			`BotInfo=${JSON.stringify(
				res.cookies.botInfo
			)};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
		)
		.writeHeader(
			'set-cookie',
			`DeviceInfo=${JSON.stringify(
				res.cookies.deviceInfo
			)};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
		)
		.writeHeader(
			'set-cookie',
			`LocaleInfo=${JSON.stringify(
				res.cookies.localeInfo
			)};Max-Age=${COOKIE_EXPIRED_SECOND};Path=/`
		)

	return res
} // _setCookie

export const handleResultAfterISRGenerator = (
	res: HttpResponse,
	params: {
		result: ISSRResult
		enableContentEncoding: boolean
		contentEncoding: 'br' | 'gzip' | ''
	}
) => {
	const { result, enableContentEncoding, contentEncoding } = params

	if (result) {
		// Add Server-Timing! See https://w3c.github.io/server-timing/.
		if (
			(CACHEABLE_STATUS_CODE[result.status] || result.status === 503) &&
			result.response
		) {
			try {
				res = _setCookie(res)
				const body = (() => {
					let tmpBody: string | Buffer = ''

					if (enableContentEncoding) {
						tmpBody = result.html
							? contentEncoding === 'br'
								? brotliCompressSync(result.html)
								: contentEncoding === 'gzip'
								? gzipSync(result.html)
								: result.html
							: (() => {
									let tmpContent: Buffer | string = fs.readFileSync(
										result.response
									)

									if (contentEncoding === 'br') return tmpContent
									else if (tmpContent && Buffer.isBuffer(tmpContent))
										tmpContent = brotliDecompressSync(tmpContent).toString()

									if (result.status === 200) {
										if (contentEncoding === 'gzip')
											tmpContent = gzipSync(tmpContent)
									}

									return tmpContent
							  })()
					} else if (result.response.indexOf('.br') !== -1) {
						const content = fs.readFileSync(result.response)

						if (content && Buffer.isBuffer(content)) {
							tmpBody = brotliDecompressSync(content).toString()
						}
					} else {
						tmpBody = fs.readFileSync(result.response)
					}

					return tmpBody
				})()

				res
					.writeStatus(String(result.status))
					.writeHeader('Content-Type', 'text/html; charset=utf-8')

				if (enableContentEncoding && result.status === 200) {
					res.writeHeader('Content-Encoding', contentEncoding)
				}

				if (result.status === 503) res.writeHeader('Retry-After', '120')

				res.end(body, true)
			} catch (err) {
				console.log(err)
				res
					.writeStatus('504')
					.writeHeader('Content-Type', 'text/html; charset=utf-8')
					.end('504 Gateway Timeout', true)
			}
		} else if (result.html) {
			res
				.writeStatus(String(result.status))
				.writeHeader('Content-Type', 'text/html; charset=utf-8')

			if (enableContentEncoding && result.status === 200) {
				res.writeHeader('Content-Encoding', contentEncoding)
			}

			if (result.status === 200) {
				res
					.writeHeader(
						'Server-Timing',
						`Prerender;dur=50;desc="Headless render time (ms)"`
					)
					.writeHeader('Cache-Control', 'no-store')
			}

			const body = enableContentEncoding
				? brotliCompressSync(result.html)
				: result.html

			res.end(body || '', true)
		} else {
			res
				.writeStatus(String(result.status))
				.writeHeader('Content-Type', 'text/html; charset=utf-8')

			// if (enableContentEncoding && result.status === 200) {
			// 	res.writeHeader('Content-Encoding', contentEncoding)
			// }
			res.end(`${result.status} Error`, true)
		}
	} else {
		res
			.writeStatus('504')
			.writeHeader('Content-Type', 'text/html; charset=utf-8')
			.end('504 Gateway Timeout', true)
	}
}
