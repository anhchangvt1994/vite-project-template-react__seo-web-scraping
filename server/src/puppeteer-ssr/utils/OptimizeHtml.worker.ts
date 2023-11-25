import { minify } from 'html-minifier'
import workerpool from 'workerpool'
import { ENV } from '../../constants'
import {
	DISABLE_COMPRESS_HTML,
	DISABLE_DEEP_OPTIMIZE,
	POWER_LEVEL,
	POWER_LEVEL_LIST,
	regexHandleAttrsHtmlTag,
	regexHandleAttrsImageTag,
	regexHandleAttrsInteractiveTag,
	regexOptimizeForPerformanceHardly,
	regexOptimizeForPerformanceNormally,
} from '../constants'

const compressContent = (html: string): string => {
	if (!html) return ''
	else if (DISABLE_COMPRESS_HTML || POWER_LEVEL === POWER_LEVEL_LIST.ONE)
		return html
	else if (ENV !== 'development') {
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

const optimizeContent = (html: string, isFullOptimize = false): string => {
	if (!html) return ''
	html = html.replace(regexOptimizeForPerformanceNormally, '')

	if (DISABLE_DEEP_OPTIMIZE || POWER_LEVEL === POWER_LEVEL_LIST.ONE) return html
	else if (isFullOptimize) {
		html = html
			.replace(regexOptimizeForPerformanceHardly, '')
			.replace(regexHandleAttrsHtmlTag, (match, tag, curAttrs) => {
				let newAttrs = curAttrs

				if (newAttrs.indexOf('lang') === -1) {
					newAttrs = `lang="en"`
				}

				return `<html ${newAttrs}>`
			})
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
					case newAttrs.indexOf('alt=') === -1:
						newAttrs = `alt="text" ${newAttrs}`
					case newAttrs.indexOf('height=') === -1:
						newAttrs = `height="200" ${newAttrs}`
					case newAttrs.indexOf('width=') === -1:
						newAttrs = `width="150" ${newAttrs}`
					default:
						break
				}

				if (newAttrs.indexOf('height=') === -1) {
					console.log(newAttrs)
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

							// if (curAttrs.indexOf('aria-label=') === -1)
							// 	tmpAttrs = `aria-label="welcome" ${tmpAttrs}`
							break
						case tmpTag === 'button':
							if (!content.trim()) tmpContent = 'click'
							if (curAttrs.indexOf('type=') === -1)
								tmpAttrs = `type="button" ${tmpAttrs}`

							if (curAttrs.indexOf('aria-label=') !== -1) {
								const ariaLabel =
									/aria-label=("|'|)(?<ariaLabel>[^"']+)("|'|)+(\s|$)/g.exec(
										curAttrs
									)?.groups?.ariaLabel

								tmpContent = ariaLabel
							} else {
								const tmpAriaLabel = tmpContent
									.replace(/<[^>]*>|[\n]/g, '')
									.trim()
								tmpAttrs = `aria-label="${tmpAriaLabel}" ${tmpAttrs}`
								tmpContent = tmpAriaLabel
							}
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
