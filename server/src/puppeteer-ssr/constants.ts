import { PuppeteerLaunchOptions } from 'puppeteer-core'
import { ENV, SERVER_LESS, serverInfo, userDataPath } from '../constants'

// NOTE - Browser Options
export const optionArgs = [
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

export const defaultBrowserOptions: PuppeteerLaunchOptions = {
	headless: 'new',
	defaultViewport: {
		width: 1024,
		height: 4098,
	},
	userDataDir: `${userDataPath}/user_data`,
	args: optionArgs,
	ignoreDefaultArgs: false,
	ignoreHTTPSErrors: true,
}

// NOTE - Regex Handler
// export const regexRemoveSpecialHtmlTag: RegExp =
// 	/<script(>|\s(?![\s\S]*only-dev)[\s\S]*?(\/>|>))[\s\S]*?<\/script>(?:[\s\S]*?|$)|<style(>|\s(?![\s\S]*only-dev)[\s\S]*?(\/>|>))[\s\S]*?<\/style>(?:[\s\S]*?|$)|<link[\s\S]*href="[\s\S]*\.(css)+(|\?v=.*)"[\s\S]*?(\/|)>(?:[\s\S]*?|$)|(\s+|)style="([\s\S].+|)"/g
export const regexOptimizeForScriptBlockPerformance: RegExp =
	/(<script(\s[^>]+)*>(.|[\r\n])*?<\/script>|<script(\s[^>]+)*\/>)/g
export const regexOptimizeForPerformanceNormally: RegExp =
	/(<link\s+(?=.*(rel=["']?(modulepreload|preload|prefetch)["']?).*?(\/|)?)(?:.*?\/?>))|<iframe\s+(?:[^>]*?\s+)?((src|id)=["']?[^"]*\b((partytown|insider-worker)(?:-[a-z]+)?)\b[^"]*["']|\bvideo\b)?[^>]*>(?:[^<]*|<(?!\/iframe>))*<\/iframe>/g
export const regexOptimizeForPerformanceHardly: RegExp =
	/(<style(\s[^>]+)*>(.|[\r\n])*?<\/style>|<style(\s[^>]+)*\/>|<link\s+(?=.*(rel=["']?(stylesheet|shortcut icon)["']?|href=["']?.*?(css|style).*?["']?).*?(\/|)?)(?:.*?\/?>))|<video(?![\s\S]*seo-tag)(\s[^>]+)*>(.|[\r\n])*?<\/video>|<audio(?![\s\S]*seo-tag)(\s[^>]+)*>(.|[\r\n])*?<\/audio>|<(video|audio)(?![\s\S]*seo-tag)(\s[^>]+)*\/>|<form(\s[^>]+)*>(.|[\r\n])*?<\/form>|<input(?![^>]*\b(?:type=['"](?:button|submit)['"]|type=(?:button|submit)\b)[^>]*>)[^>]*>|<textarea(\s[^>]+)*\/>|<textarea(\s[^>]+)*>(.|[\r\n])*?<\/textarea>|<label\s+(?=.*(for=["']?.*?["']?).*?(\/|)?)(?:.*?\/?>)|<svg(\s[^>]+)*>(.|[\r\n])*?<\/svg>|<span\s+(?:[^>]*?\s+)?class=["']?[^"]*\b((fa-|material-icons|icon(-\w*)*|ri-)(?:-[a-z]+)?)\b[^"]*["']?[^>]*>(?:[^<]*|<(?!\/span>))*<\/span>|<i\s+(?:[^>]*?\s+)?class=["']?[^"]*\b((fa-|material-icons|icon(-\w*)*|ri-)(?:-[a-z]+)?)\b[^"]*["']?[^>]*>(?:[^<]*|<(?!\/i>))*<\/i>|<img\s+(?=.*class=["']?.*?\b((fa-|material-icons|icon(-\w*)*|ri-)(?:-[a-z]+)?)\b.*?["']?.*?(\/|)?)(?:.*?\/?>)|<img\s+(?=.*alt=["']?.*?\b(icon(-\w*)*(?:-[a-z]+)?)\b.*?["']?.*?(\/|)?)(?:.*?\/?>)|style=(?:("|'|)([^"']+)("|'|)[^>\s]*)|class=(?:("|'|)([^"']+)("|'|)[^>\s]*)|(<div(>|[\s\S]*?(>))|<\/div>)(?:[\s\S]*?|$)/g
// const regexRemoveDivTag =
// 	/<div(>|[\s\S](?!only-dev)[\s\S]*?(>))[\s\S]*?<\/div>(?:[\s\S]*?|$)/g
// export const regexRemoveDivTag: RegExp =
// 	/(<div(>|[\s\S]*?(>))|<\/div>)(?:[\s\S]*?|$)/g
export const regexHandleAttrsImageTag: RegExp = /<(source|img)([^>]*)(\/|)>/g
export const regexHandleAttrsHtmlTag: RegExp = /<(html)([^>]*)>/g
// export const regexHandleAttrsInteractiveTag: RegExp =
// 	/<(a|button|input)(?![^>]*rel="nofollow")([^>]*)(\/|)>([\s\S]*?)<\/(a|button)>/g
export const regexHandleAttrsInteractiveTag: RegExp =
	/<(a|button|input)([^>]*)(\/|)>([\s\S]*?)<\/(a|button)>/g
export const regexQueryStringSpecialInfo =
	/botInfo=(?<botInfo>[^&]*)&deviceInfo=(?<deviceInfo>[^&]*)/

export const MAX_WORKERS = process.env.MAX_WORKERS
	? Number(process.env.MAX_WORKERS)
	: 7
export const DURATION_TIMEOUT = SERVER_LESS
	? 5000
	: process.env.DURATION_TIMEOUT
	? Number(process.env.DURATION_TIMEOUT)
	: 20000
export const POWER_LEVEL = process.env.POWER_LEVEL
	? Number(process.env.POWER_LEVEL)
	: 3
export const enum POWER_LEVEL_LIST {
	ONE = 1, // low of scraping power
	TWO = 2, // medium of scraping power
	THREE = 3, // hight of scraping power
}
export const DISABLE_COMPRESS_HTML = !!process.env.DISABLE_COMPRESS_HTML
export const DISABLE_DEEP_OPTIMIZE = !!process.env.DISABLE_DEEP_OPTIMIZE
export const DISABLE_OPTIMIZE = !!process.env.DISABLE_OPTIMIZE
export const BANDWIDTH_LEVEL = process.env.BANDWIDTH_LEVEL
	? Number(process.env.BANDWIDTH_LEVEL)
	: 2
export const enum BANDWIDTH_LEVEL_LIST {
	ONE = 1, // low
	TWO = 2, // hight
}
export const NOT_FOUND_PAGE_ID = process.env.NOT_FOUND_PAGE_ID || '404-page'
export const regexNotFoundPageID = new RegExp(
	`id=["']?${NOT_FOUND_PAGE_ID}["']?`
)

export const CACHEABLE_STATUS_CODE = { 200: true, 302: true }
export const COOKIE_EXPIRED =
	BANDWIDTH_LEVEL == BANDWIDTH_LEVEL_LIST.TWO && ENV !== 'development'
		? 2000
		: 60000

export const chromiumPath =
	'https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar'

export const canUseLinuxChromium =
	serverInfo &&
	serverInfo.isServer &&
	serverInfo.platform.toLowerCase() === 'linux'

export const puppeteer = (() => {
	if (canUseLinuxChromium) return require('puppeteer-core')
	return require('puppeteer')
})()
