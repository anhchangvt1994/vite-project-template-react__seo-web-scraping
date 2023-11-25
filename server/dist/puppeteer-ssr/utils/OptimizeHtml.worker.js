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
		_constants3.POWER_LEVEL === _constants3.POWER_LEVEL_LIST.ONE
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
	html = html.replace(_constants3.regexOptimizeForPerformanceNormally, '')

	if (
		_constants3.DISABLE_DEEP_OPTIMIZE ||
		_constants3.POWER_LEVEL === _constants3.POWER_LEVEL_LIST.ONE
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
								(_) => _.exec,
								'call',
								(_2) => _2(curAttrs),
								'optionalAccess',
								(_3) => _3.groups,
								'optionalAccess',
								(_4) => _4.href,
							])
							tmpContent = tmpContent.replace(
								/[Cc]lick here|[Cc]lick this|[Gg]o|[Hh]ere|[Tt]his|[Ss]tart|[Rr]ight here|[Mm]ore|[Ll]earn more/g,
								''
							)
							tmpContent = `welcome to ${tmpContent || href}`

							if (curAttrs.indexOf('aria-label=') !== -1) {
								const ariaLabel = _optionalChain([
									/aria-label=("|'|)(?<ariaLabel>[^"']+)("|'|)+(\s|$)/g,
									'access',
									(_5) => _5.exec,
									'call',
									(_6) => _6(curAttrs),
									'optionalAccess',
									(_7) => _7.groups,
									'optionalAccess',
									(_8) => _8.ariaLabel,
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
							if (!content.trim()) tmpContent = 'click'
							if (curAttrs.indexOf('type=') === -1)
								newAttrs = `type="button" ${newAttrs}`

							if (curAttrs.indexOf('aria-label=') !== -1) {
								const ariaLabel = _optionalChain([
									/aria-label=("|'|)(?<ariaLabel>[^"']+)("|'|)+(\s|$)/g,
									'access',
									(_9) => _9.exec,
									'call',
									(_10) => _10(curAttrs),
									'optionalAccess',
									(_11) => _11.groups,
									'optionalAccess',
									(_12) => _12.ariaLabel,
								])

								tmpContent = ariaLabel
							} else {
								const tmpAriaLabel = tmpContent
									.replace(/<[^>]*>|[\n]/g, '')
									.trim()
								newAttrs = `aria-label="${tmpAriaLabel}" ${newAttrs}`
								tmpContent = tmpAriaLabel
							}
							break
						case newTag === 'input' &&
							/type=['"](button|submit)['"]/g.test(curAttrs) &&
							!/value(\s|$)|value=['"]{2}/g.test(curAttrs):
							newAttrs = `type="button" ${newAttrs.replace(
								/value(\s|$)|value=['"]{2}/g,
								'value="click"'
							)}`
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
