'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
var _constants = require('../constants')

// NOTE - Browser Options
const optionArgs = [
	'--no-sandbox',
	'--disable-setuid-sandbox',
	'--headless',
	// '--disable-gpu',
	'--disable-software-rasterizer',
	'--hide-scrollbars',
	'--disable-translate',
	'--disable-extensions',
	'--disable-web-security',
	'--no-first-run',
	'--disable-notifications',
	// '--chrome-flags',
	'--ignore-certificate-errors',
	'--ignore-certificate-errors-spki-list ',
	'--disable-features=IsolateOrigins,SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
	'--no-zygote',
	'--disable-accelerated-2d-canvas',
	'--disable-speech-api', // 	Disables the Web Speech API (both speech recognition and synthesis)
	'--disable-background-networking', // Disable several subsystems which run network requests in the background. This is for use 									  // when doing network performance testing to avoid noise in the measurements. ↪
	'--disable-background-timer-throttling', // Disable task throttling of timer tasks from background pages. ↪
	'--disable-backgrounding-occluded-windows',
	'--disable-breakpad',
	'--disable-client-side-phishing-detection',
	'--disable-component-update',
	'--disable-default-apps',
	'--disable-dev-shm-usage',
	'--disable-domain-reliability',
	'--disable-features=AudioServiceOutOfProcess',
	'--disable-hang-monitor',
	'--disable-ipc-flooding-protection',
	'--disable-offer-store-unmasked-wallet-cards',
	'--disable-popup-blocking',
	'--disable-print-preview',
	'--disable-prompt-on-repost',
	'--disable-renderer-backgrounding',
	'--disable-sync',
	'--ignore-gpu-blacklist',
	'--metrics-recording-only',
	'--mute-audio',
	'--no-default-browser-check',
	'--no-pings',
	'--password-store=basic',
	'--use-gl=swiftshader',
	'--use-angle=gl-egl',
	'--use-mock-keychain',
	// '--use-gl=angle',
	// '--use-angle=gl-egl',
]
exports.optionArgs = optionArgs

const defaultBrowserOptions = {
	headless: 'new',
	defaultViewport: {
		width: 1024,
		height: 4098,
	},
	userDataDir: `${_constants.userDataPath}/user_data`,
	args: exports.optionArgs,
	ignoreDefaultArgs: false,
	ignoreHTTPSErrors: true,
}
exports.defaultBrowserOptions = defaultBrowserOptions

// NOTE - Regex Handler
// export const regexRemoveSpecialHtmlTag: RegExp =
// 	/<script(>|\s(?![\s\S]*only-dev)[\s\S]*?(\/>|>))[\s\S]*?<\/script>(?:[\s\S]*?|$)|<style(>|\s(?![\s\S]*only-dev)[\s\S]*?(\/>|>))[\s\S]*?<\/style>(?:[\s\S]*?|$)|<link[\s\S]*href="[\s\S]*\.(css)+(|\?v=.*)"[\s\S]*?(\/|)>(?:[\s\S]*?|$)|(\s+|)style="([\s\S].+|)"/g
const regexOptimizeForPerformanceNormally =
	/(<script(\s[^>]+)*>(.|[\r\n])*?<\/script>|<script(\s[^>]+)*\/>|<link\s+(?=.*(rel=["']?(modulepreload|preload|prefetch)["']?).*?(\/|)?)(?:.*?\/?>))|<iframe\s+(?:[^>]*?\s+)?((src|id)=["']?[^"]*\b((partytown|insider-worker)(?:-[a-z]+)?)\b[^"]*["']|\bvideo\b)?[^>]*>(?:[^<]*|<(?!\/iframe>))*<\/iframe>/g
exports.regexOptimizeForPerformanceNormally =
	regexOptimizeForPerformanceNormally
const regexOptimizeForPerformanceHardly =
	/(<style(\s[^>]+)*>(.|[\r\n])*?<\/style>|<style(\s[^>]+)*\/>|<link\s+(?=.*(rel=["']?(stylesheet|shortcut icon)["']?|href=["']?.*?(css|style).*?["']?).*?(\/|)?)(?:.*?\/?>))|<video(?![\s\S]*seo-tag)(\s[^>]+)*>(.|[\r\n])*?<\/video>|<audio(?![\s\S]*seo-tag)(\s[^>]+)*>(.|[\r\n])*?<\/audio>|<(video|audio)(?![\s\S]*seo-tag)(\s[^>]+)*\/>|<form(\s[^>]+)*>(.|[\r\n])*?<\/form>|<input(?![^>]*\b(?:type=['"](?:button|submit)['"]|type=(?:button|submit)\b)[^>]*>)[^>]*>|<textarea(\s[^>]+)*\/>|<textarea(\s[^>]+)*>(.|[\r\n])*?<\/textarea>|<label\s+(?=.*(for=["']?.*?["']?).*?(\/|)?)(?:.*?\/?>)|<svg(\s[^>]+)*>(.|[\r\n])*?<\/svg>|<span\s+(?:[^>]*?\s+)?class=["']?[^"]*\b((fa-|material-icons|icon(-\w*)*|ri-)(?:-[a-z]+)?)\b[^"]*["']?[^>]*>(?:[^<]*|<(?!\/span>))*<\/span>|<i\s+(?:[^>]*?\s+)?class=["']?[^"]*\b((fa-|material-icons|icon(-\w*)*|ri-)(?:-[a-z]+)?)\b[^"]*["']?[^>]*>(?:[^<]*|<(?!\/i>))*<\/i>|<img\s+(?=.*class=["']?.*?\b((fa-|material-icons|icon(-\w*)*|ri-)(?:-[a-z]+)?)\b.*?["']?.*?(\/|)?)(?:.*?\/?>)|<img\s+(?=.*alt=["']?.*?\b(icon(-\w*)*(?:-[a-z]+)?)\b.*?["']?.*?(\/|)?)(?:.*?\/?>)|style=(?:(["'])(?:(?!\1).)*\1|[^"'][^>\s]*)|class=(?:(["'])(?:(?!\1).)*\1|[^"'][^>\s]*)|(<div(>|[\s\S]*?(>))|<\/div>)(?:[\s\S]*?|$)/g
exports.regexOptimizeForPerformanceHardly = regexOptimizeForPerformanceHardly
// const regexRemoveDivTag =
// 	/<div(>|[\s\S](?!only-dev)[\s\S]*?(>))[\s\S]*?<\/div>(?:[\s\S]*?|$)/g
// export const regexRemoveDivTag: RegExp =
// 	/(<div(>|[\s\S]*?(>))|<\/div>)(?:[\s\S]*?|$)/g
const regexHandleAttrsImageTag = /<(source|img)([^>]*)(\/|)>/g
exports.regexHandleAttrsImageTag = regexHandleAttrsImageTag
const regexHandleAttrsInteractiveTag =
	/<(a|button|input)(?![^>]*rel="nofollow")([^>]*)(\/|)>([\s\S]*?)<\/(a|button)>/g
exports.regexHandleAttrsInteractiveTag = regexHandleAttrsInteractiveTag
const regexQueryStringSpecialInfo =
	/botInfo=(?<botInfo>[^&]*)&deviceInfo=(?<deviceInfo>[^&]*)/
exports.regexQueryStringSpecialInfo = regexQueryStringSpecialInfo

const MAX_WORKERS = process.env.MAX_WORKERS
	? Number(process.env.MAX_WORKERS)
	: 7
exports.MAX_WORKERS = MAX_WORKERS
const DURATION_TIMEOUT = _constants.SERVER_LESS
	? 5000
	: process.env.DURATION_TIMEOUT
	? Number(process.env.DURATION_TIMEOUT)
	: 20000
exports.DURATION_TIMEOUT = DURATION_TIMEOUT
const POWER_LEVEL = process.env.POWER_LEVEL
	? Number(process.env.POWER_LEVEL)
	: 3
exports.POWER_LEVEL = POWER_LEVEL
var POWER_LEVEL_LIST
;(function (POWER_LEVEL_LIST) {
	const ONE = 1
	POWER_LEVEL_LIST[(POWER_LEVEL_LIST['ONE'] = ONE)] = 'ONE' // low of scraping power
	const TWO = 2
	POWER_LEVEL_LIST[(POWER_LEVEL_LIST['TWO'] = TWO)] = 'TWO' // medium of scraping power
	const THREE = 3
	POWER_LEVEL_LIST[(POWER_LEVEL_LIST['THREE'] = THREE)] = 'THREE' // hight of scraping power
})(POWER_LEVEL_LIST || (exports.POWER_LEVEL_LIST = POWER_LEVEL_LIST = {}))
const DISABLE_COMPRESS_HTML = !!process.env.DISABLE_COMPRESS_HTML
exports.DISABLE_COMPRESS_HTML = DISABLE_COMPRESS_HTML
const DISABLE_DEEP_OPTIMIZE = !!process.env.DISABLE_DEEP_OPTIMIZE
exports.DISABLE_DEEP_OPTIMIZE = DISABLE_DEEP_OPTIMIZE
const BANDWIDTH_LEVEL = process.env.BANDWIDTH_LEVEL
	? Number(process.env.BANDWIDTH_LEVEL)
	: 2
exports.BANDWIDTH_LEVEL = BANDWIDTH_LEVEL
var BANDWIDTH_LEVEL_LIST
;(function (BANDWIDTH_LEVEL_LIST) {
	const ONE = 1
	BANDWIDTH_LEVEL_LIST[(BANDWIDTH_LEVEL_LIST['ONE'] = ONE)] = 'ONE' // low
	const TWO = 2
	BANDWIDTH_LEVEL_LIST[(BANDWIDTH_LEVEL_LIST['TWO'] = TWO)] = 'TWO' // hight
})(
	BANDWIDTH_LEVEL_LIST ||
		(exports.BANDWIDTH_LEVEL_LIST = BANDWIDTH_LEVEL_LIST = {})
)
const NOT_FOUND_PAGE_ID = process.env.NOT_FOUND_PAGE_ID || '404-page'
exports.NOT_FOUND_PAGE_ID = NOT_FOUND_PAGE_ID
const regexNotFoundPageID = new RegExp(
	`id=["']?${exports.NOT_FOUND_PAGE_ID}["']?`
)
exports.regexNotFoundPageID = regexNotFoundPageID

const CACHEABLE_STATUS_CODE = { 200: true, 302: true }
exports.CACHEABLE_STATUS_CODE = CACHEABLE_STATUS_CODE
const COOKIE_EXPIRED =
	exports.BANDWIDTH_LEVEL == BANDWIDTH_LEVEL_LIST.TWO &&
	_constants.ENV !== 'development'
		? 2000
		: 60000
exports.COOKIE_EXPIRED = COOKIE_EXPIRED
