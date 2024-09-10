import fs from 'fs'
import { brotliCompressSync, brotliDecompressSync, gzipSync } from 'zlib'
import { CACHEABLE_STATUS_CODE } from '../constants'
import { ISSRResult } from '../types'

export const handleResultAfterISRGenerator = (
	res,
	next,
	params: {
		result: ISSRResult
		enableContentEncoding: boolean
		contentEncoding: 'br' | 'gzip' | ''
	}
) => {
	if (!res || !next) return
	const { result, enableContentEncoding, contentEncoding } = params

	if (result) {
		/**
		 * NOTE
		 * calc by using:
		 * https://www.inchcalculator.com/convert/year-to-second/
		 */
		res.set({
			'Server-Timing': `Prerender;dur=50;desc="Headless render time (ms)"`,
			// 'Cache-Control': 'public, max-age: 31556952',
			'Cache-Control': 'no-store',
		})

		res.status(result.status)

		if (enableContentEncoding && result.status === 200) {
			res.set({
				'Content-Encoding': contentEncoding,
			})
		}

		if (result.status === 503) res.set('Retry-After', '120')
	} else {
		next(new Error('504 Gateway Timeout'))
		return
	}

	if (
		(CACHEABLE_STATUS_CODE[result.status] || result.status === 503) &&
		result.response
	) {
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
							let tmpContent: Buffer | string = fs.readFileSync(result.response)

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

				if (content && Buffer.isBuffer(content))
					tmpBody = brotliDecompressSync(content).toString()
			} else {
				tmpBody = fs.readFileSync(result.response)
			}

			return tmpBody
		})()

		res.send(body)
	}
	// Serve prerendered page as response.
	else {
		const body = (() => {
			let tmpBody
			if (enableContentEncoding) {
				tmpBody = result.html
					? contentEncoding === 'br'
						? brotliCompressSync(result.html)
						: contentEncoding === 'gzip'
						? gzipSync(result.html)
						: result.html
					: fs.readFileSync(result.response)
			}

			tmpBody = result.html || `${result.status} Error`

			return tmpBody
		})()
		res.status(result.status).send(body) // Serve prerendered page as response.
	}
} // handleResultAfterISRGenerator
