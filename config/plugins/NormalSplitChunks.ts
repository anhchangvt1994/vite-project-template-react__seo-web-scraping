import type { Plugin } from 'vite'
import type { OutputOptions } from 'rollup'
import crypto from 'crypto'

export default (splitChunkConfig: Array<string | RegExp>): Plugin => {
	return {
		name: 'normal-split-chunks',
		config(config) {
			if (
				!splitChunkConfig ||
				typeof splitChunkConfig !== 'object' ||
				!splitChunkConfig.length
			)
				return

			const output = config.build?.rollupOptions?.output as OutputOptions
			output.manualChunks = function (id, meta) {
				/**
				 * NOTE - refer to
				 * https://stackoverflow.com/questions/2912894/how-to-match-any-character-in-regular-expression
				 */
				for (const test of splitChunkConfig) {
					const moduleInfo = meta.getModuleInfo(id)
					if (
						moduleInfo?.isIncluded &&
						((typeof test === 'string' && id.indexOf(test) !== -1) ||
							(test instanceof RegExp && test.test(id)))
					) {
						const name =
							typeof test === 'string' ? test : id.match(test)?.[0] ?? id

						return crypto
							.createHash('sha1')
							.update(name)
							.digest('hex')
							.slice(0, 8)
					}
				}
			}
		},
	}
}
