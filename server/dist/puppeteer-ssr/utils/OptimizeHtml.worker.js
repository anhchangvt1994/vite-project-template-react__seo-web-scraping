'use strict'
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
function _optionalChain(ops) {
	let lastAccessLHS = undefined
	let value = ops[0]
	let i = 1
	while (i < ops.length) {
		const op = ops[i]
		const fn = ops[i + 1]
		i += 2
		if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) {
			return undefined
		}
		if (op === 'access' || op === 'optionalAccess') {
			lastAccessLHS = value
			value = fn(value)
		} else if (op === 'call' || op === 'optionalCall') {
			value = fn((...args) => value.call(lastAccessLHS, ...args))
			lastAccessLHS = undefined
		}
	}
	return value
}
var _htmlminifier = require('html-minifier')
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)
var _constants = require('../../constants')

var _constants3 = require('../constants')

const compressContent = (html) => {
	if (!html) return ''
	else if (
		_constants3.DISABLE_COMPRESS_HTML ||
		_constants.POWER_LEVEL === _constants.POWER_LEVEL_LIST.ONE
	)
		return html
	else if (_constants.ENV !== 'development') {
		html = _htmlminifier.minify.call(void 0, html, {
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

const optimizeContent = (html, isFullOptimize = false) => {
	if (!html) return ''

	html = html.replace(_constants3.regexOptimizeForScriptBlockPerformance, '')

	if (_constants3.DISABLE_OPTIMIZE) return html

	html = html.replace(_constants3.regexOptimizeForPerformanceNormally, '')

	if (
		_constants3.DISABLE_DEEP_OPTIMIZE ||
		_constants.POWER_LEVEL === _constants.POWER_LEVEL_LIST.ONE
	)
		return html
	else if (isFullOptimize) {
		html = html
			.replace(_constants3.regexOptimizeForPerformanceHardly, '')
			.replace(_constants3.regexHandleAttrsHtmlTag, (match, tag, curAttrs) => {
				let newAttrs = curAttrs

				if (newAttrs.indexOf('lang') === -1) {
					newAttrs = `lang="en"`
				}

				return `<html ${newAttrs}>`
			})
			.replace(_constants3.regexHandleAttrsImageTag, (match, tag, curAttrs) => {
				const alt = _optionalChain([
					/alt=("|'|)(?<alt>[^"']+)("|'|)+(\s|$)/g,
					'access',
					(_) => _.exec,
					'call',
					(_2) => _2(curAttrs),
					'optionalAccess',
					(_3) => _3.groups,
					'optionalAccess',
					(_4) => _4.alt,
					'optionalAccess',
					(_5) => _5.trim,
					'call',
					(_6) => _6(),
				])

				if (!alt) return ''

				let newAttrs = (
					curAttrs.indexOf('seo-tag') !== -1
						? curAttrs
						: curAttrs.replace(
								/(?<srcAttr>(src|srcset))=("|'|)(.*?)("|'|)+(\s|$)/g,
								'$<srcAttr> '
						  )
				).trim()

				switch (true) {
					case newAttrs.indexOf('height=') === -1:
						newAttrs = `height="200" ${newAttrs}`
					case newAttrs.indexOf('width=') === -1:
						newAttrs = `width="150" ${newAttrs}`
					default:
						break
				}

				return `<img ${newAttrs}>`
			})
			.replace(
				_constants3.regexHandleAttrsInteractiveTag,
				(math, tag, curAttrs, negative, content, endTag) => {
					let newAttrs = `style="display: inline-block;min-width: 48px;min-height: 48px;" ${curAttrs.trim()}`
					let newTag = tag
					let tmpEndTag = tag === 'input' ? '' : endTag === tag ? endTag : tag
					let tmpContent = content
					let result

					switch (true) {
						case newTag === 'a' && curAttrs.indexOf('href=') === -1:
							newTag = 'button'
							newAttrs = `type="button" ${newAttrs}`
							tmpEndTag = 'button'
							break
						case newTag === 'a' && /href(\s|$)|href=""/g.test(curAttrs):
							newTag = 'button'
							newAttrs = `type="button" ${newAttrs.replace(
								/href(\s|$)|href=""/g,
								''
							)}`
							tmpEndTag = 'button'
							break
						default:
							break
					}

					switch (true) {
						case newTag === 'a':
							const href = _optionalChain([
								/href=("|'|)(?<href>.*?)("|'|)+(\s|$)/g,
								'access',
								(_7) => _7.exec,
								'call',
								(_8) => _8(curAttrs),
								'optionalAccess',
								(_9) => _9.groups,
								'optionalAccess',
								(_10) => _10.href,
							])
							tmpContent = tmpContent.replace(
								/[Cc]lick here|[Cc]lick this|[Gg]o|[Hh]ere|[Tt]his|[Ss]tart|[Rr]ight here|[Mm]ore|[Ll]earn more/g,
								''
							)

							if (curAttrs.indexOf('aria-label=') !== -1) {
								const ariaLabel = _optionalChain([
									/aria-label=("|'|)(?<ariaLabel>[^"']+)("|'|)+(\s|$)/g,
									'access',
									(_11) => _11.exec,
									'call',
									(_12) => _12(curAttrs),
									'optionalAccess',
									(_13) => _13.groups,
									'optionalAccess',
									(_14) => _14.ariaLabel,
								])

								if (ariaLabel !== tmpContent)
									newAttrs = curAttrs.replace(
										/aria-label=("|'|)(?<ariaLabel>[^"']+)("|'|)+(\s|$)/g,
										''
									)
							}

							// if (curAttrs.indexOf('aria-label=') === -1)
							// 	newAttrs = `aria-label="welcome" ${newAttrs}`
							break
						case newTag === 'button':
							const tmpContentWithoutHTMLTags = tmpContent
								.replace(/<[^>]*>|[\n]/g, '')
								.trim()
							if (!tmpContentWithoutHTMLTags) return ''
							if (curAttrs.indexOf('type=') === -1)
								newAttrs = `type="button" ${newAttrs}`

							if (curAttrs.indexOf('aria-label=') !== -1) {
								const ariaLabel = _optionalChain([
									/aria-label=("|'|)(?<ariaLabel>[^"']+)("|'|)+(\s|$)/g,
									'access',
									(_15) => _15.exec,
									'call',
									(_16) => _16(curAttrs),
									'optionalAccess',
									(_17) => _17.groups,
									'optionalAccess',
									(_18) => _18.ariaLabel,
								])

								tmpContent = ariaLabel
							} else {
								newAttrs = `aria-label="${tmpContentWithoutHTMLTags}" ${newAttrs}`
								tmpContent = tmpContentWithoutHTMLTags
							}
							break
						case newTag === 'input' &&
							/type=['"](button|submit)['"]/g.test(curAttrs) &&
							!/value(\s|$)|value=['"]{2}/g.test(curAttrs):
							return ''
						case newTag === 'input' &&
							/id=("|'|)(.*?)("|'|)+(\s|$)/g.test(newAttrs):
							const id = /id=("|'|)(?<id>.*?)("|'|)+(\s|$)/g.test(newAttrs)
							result = `<label for=${id}><${newTag} ${newAttrs}>${tmpContent}</${tmpEndTag}>`
							break
						default:
							break
					}

					result =
						result || tmpEndTag
							? `<${newTag} ${newAttrs} ${negative}>${tmpContent}</${tmpEndTag}>`
							: `<${newTag} ${negative} ${newAttrs}>`

					return result
				}
			)
	}

	return html
}

// create a worker and register public functions
_workerpool2.default.worker({
	compressContent,
	optimizeContent,
})
