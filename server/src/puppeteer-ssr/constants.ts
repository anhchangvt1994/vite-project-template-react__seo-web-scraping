import { PuppeteerLaunchOptions } from 'puppeteer-core'
import { SERVER_LESS, userDataPath } from '../constants'
import { PROCESS_ENV } from '../utils/InitEnv'
import ServerConfig from '../server.config'

// NOTE - Browser Options
const _windowWidth = 1920
const _windowHeight = 99999
const _userAgent =
	ServerConfig.crawl.content === 'desktop'
		? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
		: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
export const optionArgs = [
	`--user-agent=${_userAgent}`,
	'--no-sandbox',
	'--disable-setuid-sandbox',
	'--headless',
	`--window-size=${_windowWidth},${_windowHeight}`,
	`--ozone-override-screen-size=${_windowWidth},${_windowHeight}`,
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
	'--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure,IsolateOrigins,site-per-process,BlockInsecurePrivateNetworkRequests',
	'--disable-site-isolation-trials',
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
	// "--shm-size=4gb",
]

export const defaultBrowserOptions: PuppeteerLaunchOptions = {
	headless: 'shell',
	defaultViewport: {
		width: _windowWidth,
		height: _windowHeight,
	},
	userDataDir: `${userDataPath}/user_data`,
	args: optionArgs,
	protocolTimeout: 240000, // NOTE - Handle for error protocol timeout (can test adidas site to got detail of this issue)
	ignoreDefaultArgs: false,
	ignoreHTTPSErrors: true,
}

// NOTE - Regex Handler
export const regexOptimizeForScriptBlockPerformance: RegExp =
	/(<script(?![\s\S]type="application\/(ld\+json|xml|rdf\+xml)")(\s[^>]+)*>(.|[\r\n])*?<\/script>|<script(?![\s\S]type="application\/(ld\+json|xml|rdf\+xml)")(\s[^>]+)*\/>)/g
export const regexOptimizeForPerformanceNormally: RegExp =
	/(<link\s+(?=.*(rel=["']?(dns-prefetch|preconnect|modulepreload|preload|prefetch)["']?).*?(\/|)?)(?:.*?\/?>))|<iframe\s+(?:[^>]*?\s+)?((src|id)=["']?[^"]*\b((partytown|insider-worker)(?:-[a-z]+)?)\b[^"]*["']|\bvideo\b)?[^>]*>(?:[^<]*|<(?!\/iframe>))*<\/iframe>|(<style(\s[^>]+)*>(.|[\r\n])*?<\/style>|<style(\s[^>]+)*\/>|<link\s+(?=.*(rel=["']?(stylesheet|shortcut icon)["']?|href=["']?.*?(css|style).*?["']?).*?(\/|)?)(?:.*?\/?>))/g
export const regexOptimizeForPerformanceHardly: RegExp =
	/<video(?![\s\S]*seo-tag=("|'|)true("|'|\s))(\s[^>]+)*>(.|[\r\n])*?<\/video>|<audio(?![\s\S]*seo-tag=("|'|)true("|'|\s))(\s[^>]+)*>(.|[\r\n])*?<\/audio>|<(video|audio)(?![\s\S]*seo-tag=("|'|)true("|'|\s))(\s[^>]+)*\/>|<form(\s[^>]+)*>(.|[\r\n])*?<\/form>|<input(?![^>]*\b(?:type=['"](?:button|submit)['"]|type=(?:button|submit)\b)[^>]*>)[^>]*>|<textarea(\s[^>]+)*\/>|<textarea(\s[^>]+)*>(.|[\r\n])*?<\/textarea>|<label\s+(?=.*(for=["']?.*?["']?).*?(\/|)?)(?:.*?\/?>)|<svg(\s[^>]+)*>(.|[\r\n])*?<\/svg>|<span\s+(?:[^>]*?\s+)?class=["']?[^"]*\b((fa-|material-icons|icon(-\w*)*|ri-)(?:-[a-z]+)?)\b[^"]*["']?[^>]*>(?:[^<]*|<(?!\/span>))*<\/span>|<i\s+(?:[^>]*?\s+)?class=["']?[^"]*\b((fa-|material-icons|icon(-\w*)*|ri-)(?:-[a-z]+)?)\b[^"]*["']?[^>]*>(?:[^<]*|<(?!\/i>))*<\/i>|<img\s+(?=.*class=["']?.*?\b((fa-|material-icons|icon(-\w*)|ri-)?)\b.*?["']?.*?(\/|)?)(?:.*?\/?>)|<img\s+(?=.*alt=["']?.*?\b(icon(-\w*)*(?:-[a-z]+)?)\b.*?["']?.*?(\/|)?)(?:.*?\/?>)|style=(?:("|'|)([^"']+)("|'|\s)[^>\s]*)|class=(?:("|'|)([^"']+)("|'|\s)[^>\s]*)|(<div(>|[\s\S]*?(>))|<\/div>)(?:[\s\S]*?|$)/g
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
	/botInfo=(?<botInfo>[^&]*)&deviceInfo=(?<deviceInfo>[^&]*)&localeInfo=(?<localeInfo>[^&]*)&environmentInfo=(?<environmentInfo>[^&]*)/

export const MAX_WORKERS = PROCESS_ENV.MAX_WORKERS
	? Number(PROCESS_ENV.MAX_WORKERS)
	: 7
export const DURATION_TIMEOUT = SERVER_LESS
	? 5000
	: PROCESS_ENV.DURATION_TIMEOUT
	? Number(PROCESS_ENV.DURATION_TIMEOUT)
	: 20000

export const DISABLE_COMPRESS_HTML = !!PROCESS_ENV.DISABLE_COMPRESS_HTML
export const DISABLE_DEEP_OPTIMIZE = !!PROCESS_ENV.DISABLE_DEEP_OPTIMIZE
export const DISABLE_OPTIMIZE = !!PROCESS_ENV.DISABLE_OPTIMIZE

export const NOT_FOUND_PAGE_ID = PROCESS_ENV.NOT_FOUND_PAGE_ID || '404-page'
export const regexNotFoundPageID = new RegExp(
	`id=["']?${NOT_FOUND_PAGE_ID}["']?`
)

export const CACHEABLE_STATUS_CODE = { 200: true, 302: true }

export const chromiumPath =
	'https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar'

export const canUseLinuxChromium =
	PROCESS_ENV.PLATFORM.toLowerCase() === 'linux' &&
	['true', 'TRUE', '1'].includes(process.env.USE_CHROME_AWS_LAMBDA || '')

export const puppeteer = (() => {
	if (canUseLinuxChromium) return require('puppeteer-core')
	return require('puppeteer')
})()

export const DISABLE_SSR_CACHE = Boolean(PROCESS_ENV.DISABLE_SSR_CACHE)
