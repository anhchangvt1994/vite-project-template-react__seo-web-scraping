'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
var _constants = require('../constants')
var _InitEnv = require('../utils/InitEnv')

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
const regexOptimizeForScriptBlockPerformance =
	/(<script(\s[^>]+)*>(.|[\r\n])*?<\/script>|<script(\s[^>]+)*\/>)/g
exports.regexOptimizeForScriptBlockPerformance =
	regexOptimizeForScriptBlockPerformance
const regexOptimizeForPerformanceNormally =
	/(<link\s+(?=.*(rel=["']?(modulepreload|preload|prefetch)["']?).*?(\/|)?)(?:.*?\/?>))|<iframe\s+(?:[^>]*?\s+)?((src|id)=["']?[^"]*\b((partytown|insider-worker)(?:-[a-z]+)?)\b[^"]*["']|\bvideo\b)?[^>]*>(?:[^<]*|<(?!\/iframe>))*<\/iframe>/g
exports.regexOptimizeForPerformanceNormally =
	regexOptimizeForPerformanceNormally
const regexOptimizeForPerformanceHardly =
	/(<style(\s[^>]+)*>(.|[\r\n])*?<\/style>|<style(\s[^>]+)*\/>|<link\s+(?=.*(rel=["']?(stylesheet|shortcut icon)["']?|href=["']?.*?(css|style).*?["']?).*?(\/|)?)(?:.*?\/?>))|<video(?![\s\S]*seo-tag)(\s[^>]+)*>(.|[\r\n])*?<\/video>|<audio(?![\s\S]*seo-tag)(\s[^>]+)*>(.|[\r\n])*?<\/audio>|<(video|audio)(?![\s\S]*seo-tag)(\s[^>]+)*\/>|<form(\s[^>]+)*>(.|[\r\n])*?<\/form>|<input(?![^>]*\b(?:type=['"](?:button|submit)['"]|type=(?:button|submit)\b)[^>]*>)[^>]*>|<textarea(\s[^>]+)*\/>|<textarea(\s[^>]+)*>(.|[\r\n])*?<\/textarea>|<label\s+(?=.*(for=["']?.*?["']?).*?(\/|)?)(?:.*?\/?>)|<svg(\s[^>]+)*>(.|[\r\n])*?<\/svg>|<span\s+(?:[^>]*?\s+)?class=["']?[^"]*\b((fa-|material-icons|icon(-\w*)*|ri-)(?:-[a-z]+)?)\b[^"]*["']?[^>]*>(?:[^<]*|<(?!\/span>))*<\/span>|<i\s+(?:[^>]*?\s+)?class=["']?[^"]*\b((fa-|material-icons|icon(-\w*)*|ri-)(?:-[a-z]+)?)\b[^"]*["']?[^>]*>(?:[^<]*|<(?!\/i>))*<\/i>|<img\s+(?=.*class=["']?.*?\b((fa-|material-icons|icon(-\w*)*|ri-)(?:-[a-z]+)?)\b.*?["']?.*?(\/|)?)(?:.*?\/?>)|<img\s+(?=.*alt=["']?.*?\b(icon(-\w*)*(?:-[a-z]+)?)\b.*?["']?.*?(\/|)?)(?:.*?\/?>)|style=(?:("|'|)([^"']+)("|'|)[^>\s]*)|class=(?:("|'|)([^"']+)("|'|)[^>\s]*)|(<div(>|[\s\S]*?(>))|<\/div>)(?:[\s\S]*?|$)/g
exports.regexOptimizeForPerformanceHardly = regexOptimizeForPerformanceHardly
// const regexRemoveDivTag =
// 	/<div(>|[\s\S](?!only-dev)[\s\S]*?(>))[\s\S]*?<\/div>(?:[\s\S]*?|$)/g
// export const regexRemoveDivTag: RegExp =
// 	/(<div(>|[\s\S]*?(>))|<\/div>)(?:[\s\S]*?|$)/g
const regexHandleAttrsImageTag = /<(source|img)([^>]*)(\/|)>/g
exports.regexHandleAttrsImageTag = regexHandleAttrsImageTag
const regexHandleAttrsHtmlTag = /<(html)([^>]*)>/g
exports.regexHandleAttrsHtmlTag = regexHandleAttrsHtmlTag
// export const regexHandleAttrsInteractiveTag: RegExp =
// 	/<(a|button|input)(?![^>]*rel="nofollow")([^>]*)(\/|)>([\s\S]*?)<\/(a|button)>/g
const regexHandleAttrsInteractiveTag =
	/<(a|button|input)([^>]*)(\/|)>([\s\S]*?)<\/(a|button)>/g
exports.regexHandleAttrsInteractiveTag = regexHandleAttrsInteractiveTag
const regexQueryStringSpecialInfo =
	/botInfo=(?<botInfo>[^&]*)&deviceInfo=(?<deviceInfo>[^&]*)&localeInfo=(?<localeInfo>[^&]*)&environmentInfo=(?<environmentInfo>[^&]*)/
exports.regexQueryStringSpecialInfo = regexQueryStringSpecialInfo

const MAX_WORKERS = _InitEnv.PROCESS_ENV.MAX_WORKERS
	? Number(_InitEnv.PROCESS_ENV.MAX_WORKERS)
	: 7
exports.MAX_WORKERS = MAX_WORKERS
const DURATION_TIMEOUT = _constants.SERVER_LESS
	? 5000
	: _InitEnv.PROCESS_ENV.DURATION_TIMEOUT
	? Number(_InitEnv.PROCESS_ENV.DURATION_TIMEOUT)
	: 20000
exports.DURATION_TIMEOUT = DURATION_TIMEOUT

const DISABLE_COMPRESS_HTML = !!_InitEnv.PROCESS_ENV.DISABLE_COMPRESS_HTML
exports.DISABLE_COMPRESS_HTML = DISABLE_COMPRESS_HTML
const DISABLE_DEEP_OPTIMIZE = !!_InitEnv.PROCESS_ENV.DISABLE_DEEP_OPTIMIZE
exports.DISABLE_DEEP_OPTIMIZE = DISABLE_DEEP_OPTIMIZE
const DISABLE_OPTIMIZE = !!_InitEnv.PROCESS_ENV.DISABLE_OPTIMIZE
exports.DISABLE_OPTIMIZE = DISABLE_OPTIMIZE

const NOT_FOUND_PAGE_ID = _InitEnv.PROCESS_ENV.NOT_FOUND_PAGE_ID || '404-page'
exports.NOT_FOUND_PAGE_ID = NOT_FOUND_PAGE_ID
const regexNotFoundPageID = new RegExp(
	`id=["']?${exports.NOT_FOUND_PAGE_ID}["']?`
)
exports.regexNotFoundPageID = regexNotFoundPageID

const CACHEABLE_STATUS_CODE = { 200: true, 302: true }
exports.CACHEABLE_STATUS_CODE = CACHEABLE_STATUS_CODE

const chromiumPath =
	'https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar'
exports.chromiumPath = chromiumPath

const canUseLinuxChromium =
	_InitEnv.PROCESS_ENV.IS_SERVER &&
	_InitEnv.PROCESS_ENV.PLATFORM.toLowerCase() === 'linux'
exports.canUseLinuxChromium = canUseLinuxChromium

const puppeteer = (() => {
	if (exports.canUseLinuxChromium) return require('puppeteer-core')
	return require('puppeteer')
})()
exports.puppeteer = puppeteer

const DISABLE_SSR_CACHE = Boolean(_InitEnv.PROCESS_ENV.DISABLE_SSR_CACHE)
exports.DISABLE_SSR_CACHE = DISABLE_SSR_CACHE
