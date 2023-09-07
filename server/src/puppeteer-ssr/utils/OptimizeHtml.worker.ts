import workerpool from 'workerpool'
import { minify } from 'html-minifier'
import {
	regexHandleAttrsImageTag,
	regexHandleAttrsInteractiveTag,
	regexOptimizeForPerformanceNormally,
	regexOptimizeForPerformanceHardly,
	POWER_LEVEL,
	POWER_LEVEL_LIST,
	DISABLE_COMPRESS_HTML,
	DISABLE_DEEP_OPTIMIZE,
} from '../constants'
import { ENV } from '../../constants'

const compressContent = (html: string): string => {
	if (!html) return ''
	else if (DISABLE_COMPRESS_HTML || POWER_LEVEL === POWER_LEVEL_LIST.ONE)
		return html
	else if (ENV === 'production') {
		html = minify(html, {
			collapseBooleanAttributes: true,
			collapseInlineTagWhitespace: true,
			collapseWhitespace: true,
			removeAttributeQuotes: true,
			removeComments: true,
			removeEmptyAttributes: true,
			removeEmptyElements: true,
			useShortDoctype: true,
		})
	}

	return html
} // compressContent

const optimizeContent = (html: string, isFullOptimize = true): string => {
	if (!html) return ''
	html = html.replace(regexOptimizeForPerformanceNormally, '')

	if (DISABLE_DEEP_OPTIMIZE || POWER_LEVEL === POWER_LEVEL_LIST.ONE) return html
	else if (isFullOptimize) {
		html = html
			.replace(regexOptimizeForPerformanceHardly, '')
			.replace(regexHandleAttrsImageTag, (match, tag, curAttrs) => {
				let newAttrs = (
					curAttrs.indexOf('seo-tag') !== -1
						? curAttrs
						: curAttrs.replace(
								/(?<srcAttr>(src|srcset))=("|'|)(.*?)("|'|)+(\s|$)/g,
								'$<srcAttr> '
						  )
				).trim()

				switch (true) {
					case curAttrs.indexOf('alt=') === -1:
						newAttrs = `alt="text" ${newAttrs}`
					case curAttrs.indexOf('height=') === -1:
						newAttrs = `height="200" ${newAttrs}`
					case curAttrs.indexOf('width=') === -1:
						newAttrs = `width="150" ${newAttrs}`
						break
					default:
						break
				}

				return `<img ${newAttrs}>`
			})
			.replace(
				regexHandleAttrsInteractiveTag,
				(math, tag, curAttrs, negative, content, endTag) => {
					let tmpAttrs = `style="display: inline-block;min-width: 48px;min-height: 48px;" ${curAttrs.trim()}`
					let tmpTag = tag
					let tmpEndTag = tag === 'input' ? '' : endTag === tag ? endTag : tag
					let tmpContent = content
					let result

					switch (true) {
						case tmpTag === 'a' && curAttrs.indexOf('href=') === -1:
							tmpTag = 'button'
							tmpAttrs = `type="button" ${tmpAttrs}`
							tmpEndTag = 'button'
							break
						case tmpTag === 'a' && /href(\s|$)|href=""/g.test(curAttrs):
							tmpTag = 'button'
							tmpAttrs = `type="button" ${tmpAttrs.replace(
								/href(\s|$)|href=""/g,
								''
							)}`
							tmpEndTag = 'button'
							break
						default:
							break
					}

					switch (true) {
						case tmpTag === 'a':
							const href = /href=("|'|)(?<href>.*?)("|'|)+(\s|$)/g.exec(
								curAttrs
							)?.groups?.href
							tmpContent = tmpContent.replace(
								/[Cc]lick here|[Cc]lick this|[Gg]o|[Hh]ere|[Tt]his|[Ss]tart|[Rr]ight here|[Mm]ore|[Ll]earn more/g,
								''
							)
							tmpContent = `welcome to ${tmpContent || href}`
							break
						case tmpTag === 'button' && !content:
							tmpContent = 'click'
						case tmpTag === 'button' && curAttrs.indexOf('type=') === -1:
							tmpAttrs = `type="button" ${tmpAttrs}`
							break
						case tmpTag === 'input' &&
							/type=['"](button|submit)['"]/g.test(curAttrs) &&
							!/value(\s|$)|value=['"]{2}/g.test(curAttrs):
							tmpAttrs = `type="button" ${tmpAttrs.replace(
								/value(\s|$)|value=['"]{2}/g,
								'value="click"'
							)}`
						case tmpTag === 'input' &&
							/id=("|'|)(.*?)("|'|)+(\s|$)/g.test(tmpAttrs):
							const id = /id=("|'|)(?<id>.*?)("|'|)+(\s|$)/g.test(tmpAttrs)
							result = `<label for=${id}><${tmpTag} ${tmpAttrs}>${tmpContent}</${tmpEndTag}>`
							break
						default:
							break
					}

					result =
						result || tmpEndTag
							? `<${tmpTag} ${tmpAttrs} ${negative}>${tmpContent}</${tmpEndTag}>`
							: `<${tmpTag} ${negative} ${tmpAttrs}>`

					return result
				}
			)
	}

	return html
}

// create a worker and register public functions
workerpool.worker({
	compressContent,
	optimizeContent,
})
