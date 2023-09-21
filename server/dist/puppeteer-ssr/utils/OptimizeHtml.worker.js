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
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)
var _htmlminifier = require('html-minifier')

var _constants = require('../constants')
var _constants3 = require('../../constants')

const compressContent = (html) => {
	if (!html) return ''
	else if (
		_constants.DISABLE_COMPRESS_HTML ||
		_constants.POWER_LEVEL === _constants.POWER_LEVEL_LIST.ONE
	)
		return html
	else if (_constants3.ENV === 'production') {
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
	html = html.replace(_constants.regexOptimizeForPerformanceNormally, '')

	if (
		_constants.DISABLE_DEEP_OPTIMIZE ||
		_constants.POWER_LEVEL === _constants.POWER_LEVEL_LIST.ONE
	)
		return html
	else if (isFullOptimize) {
		html = html
			.replace(_constants.regexOptimizeForPerformanceHardly, '')
			.replace(_constants.regexHandleAttrsImageTag, (match, tag, curAttrs) => {
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
				_constants.regexHandleAttrsInteractiveTag,
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
_workerpool2.default.worker({
	compressContent,
	optimizeContent,
})
