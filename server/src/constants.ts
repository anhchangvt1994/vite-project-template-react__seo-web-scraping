import fs from 'fs'
import path from 'path'
import ServerConfig from './server.config'
import Console from './utils/ConsoleHandler'
import { ENV, PROCESS_ENV } from './utils/InitEnv'

export const pagesPath = PROCESS_ENV.IS_SERVER
	? (() => {
			if (ServerConfig.crawl.cache.path) {
				if (fs.existsSync(ServerConfig.crawl.cache.path))
					return ServerConfig.crawl.cache.path
				else {
					try {
						fs.mkdirSync(ServerConfig.crawl.cache.path)

						return ServerConfig.crawl.cache.path
					} catch (err) {
						Console.error(err.message)
					}
				}
			}

			const tmpPath = '/tmp'
			if (fs.existsSync(tmpPath)) return tmpPath + '/pages'

			return path.resolve(__dirname, './puppeteer-ssr/utils/Cache.worker/pages')
	  })()
	: path.resolve(__dirname, './puppeteer-ssr/utils/Cache.worker/pages')

export const dataPath = PROCESS_ENV.IS_SERVER
	? (() => {
			const tmpPath = '/tmp'
			if (fs.existsSync(tmpPath)) return tmpPath + '/data'

			return path.resolve(__dirname, './api/utils/CacheManager/data')
	  })()
	: path.resolve(__dirname, './api/utils/CacheManager/data')

export const storePath = PROCESS_ENV.IS_SERVER
	? (() => {
			const tmpPath = '/tmp'
			if (fs.existsSync(tmpPath)) return tmpPath + '/store'

			return path.resolve(__dirname, './api/utils/CacheManager/store')
	  })()
	: path.resolve(__dirname, './api/utils/CacheManager/store')

export const userDataPath = PROCESS_ENV.IS_SERVER
	? (() => {
			const tmpPath = '/tmp'
			if (fs.existsSync(tmpPath)) return tmpPath + '/browsers'

			return path.resolve(__dirname, './puppeteer-ssr/browsers')
	  })()
	: path.resolve(__dirname, './puppeteer-ssr/browsers')

export const workerManagerPath = PROCESS_ENV.IS_SERVER
	? (() => {
			const tmpPath = '/tmp'
			if (fs.existsSync(tmpPath)) return tmpPath + '/WorkerManager'

			return path.resolve(__dirname, './utils/WorkerManager')
	  })()
	: path.resolve(__dirname, './puppeteer-ssr/browsers')

export const resourceExtension = PROCESS_ENV.IS_SERVER ? 'js' : 'ts'
export const resourceDirectory = PROCESS_ENV.IS_SERVER ? 'dist' : 'src'

export const SERVER_LESS = !!PROCESS_ENV.SERVER_LESS

export const LOCALE_LIST_WITH_COUNTRY = {
	af: ['en'],
	al: ['sq'],
	dz: ['ar'],
	ad: ['ca'],
	ao: ['pt'],
	ag: ['en'],
	ar: ['es'],
	am: ['hy'],
	au: ['en'],
	at: ['de'],
	az: ['az'],
	bs: ['en'],
	bh: ['ar'],
	bd: ['bn'],
	bb: ['en'],
	by: ['be'],
	be: ['nl'],
	bz: ['en'],
	bj: ['fr'],
	bt: ['dz'],
	bo: ['es'],
	ba: ['bs'],
	bw: ['tn'],
	br: ['pt'],
	bn: ['ms'],
	bg: ['bg'],
	bf: ['fr'],
	bi: ['rn'],
	cv: ['pt'],
	kh: ['km'],
	cm: ['en'],
	ca: ['en'],
	cf: ['fr'],
	td: ['fr'],
	cl: ['es'],
	cn: ['zh'],
	co: ['es'],
	km: ['fr'],
	cg: ['fr'],
	cd: ['fr'],
	cr: ['es'],
	ci: ['fr'],
	hr: ['hr'],
	cu: ['es'],
	cy: ['el'],
	cz: ['cs'],
	dk: ['da'],
	dj: ['fr'],
	dm: ['en'],
	do: ['es'],
	tl: ['pt'],
	ec: ['es'],
	eg: ['ar'],
	sv: ['es'],
	gq: ['es'],
	er: ['ti'],
	ee: ['et'],
	et: ['am'],
	fj: ['en'],
	fi: ['fi'],
	fr: ['fr'],
	ga: ['fr'],
	gm: ['en'],
	ge: ['ka'],
	de: ['de'],
	gh: ['en'],
	gr: ['el'],
	gd: ['en'],
	gt: ['es'],
	gn: ['fr'],
	gw: ['pt'],
	gy: ['en'],
	ht: ['fr'],
	hn: ['es'],
	hu: ['hu'],
	is: ['is'],
	in: ['hi'],
	id: ['id'],
	ir: ['fa'],
	iq: ['ar'],
	ie: ['en'],
	il: ['he'],
	it: ['it'],
	jm: ['en'],
	jp: ['ja'],
	jo: ['ar'],
	kz: ['kk'],
	ke: ['sw'],
	ki: ['en'],
	kp: ['ko'],
	kr: ['ko'],
	kw: ['ar'],
	kg: ['ky'],
	la: ['lo'],
	lv: ['lv'],
	lb: ['ar'],
	ls: ['st'],
	lr: ['en'],
	ly: ['ar'],
	li: ['de'],
	lt: ['lt'],
	lu: ['lb'],
	mg: ['mg'],
	mw: ['ny'],
	my: ['ms'],
	mv: ['dv'],
	ml: ['fr'],
	mt: ['mt'],
	mh: ['en'],
	mr: ['ar'],
	mu: ['en'],
	mx: ['es'],
	fm: ['en'],
	md: ['ro'],
	mc: ['fr'],
	mn: ['mn'],
	me: ['srp'],
	ma: ['ar'],
	mz: ['pt'],
	mm: ['my'],
	na: ['en'],
	nr: ['na'],
	np: ['ne'],
	nl: ['nl'],
	nz: ['en'],
	ni: ['es'],
	ne: ['fr'],
	ng: ['en'],
	no: ['nb'],
	om: ['ar'],
	pk: ['ur'],
	pw: ['pau'],
	pa: ['es'],
	pg: ['en'],
	py: ['es'],
	pe: ['es'],
	ph: ['tl'],
	pl: ['pl'],
	pt: ['pt'],
	qa: ['ar'],
	ro: ['ro'],
	ru: ['ru'],
	rw: ['rw'],
	kn: ['en'],
	lc: ['en'],
	vc: ['en'],
	ws: ['sm'],
	sm: ['it'],
	st: ['pt'],
	sa: ['ar'],
	sn: ['fr'],
	rs: ['sr'],
	sc: ['en', 'fr'],
	sl: ['en'],
	sg: ['zh', 'ms'],
	sk: ['sk'],
	si: ['sl'],
	sb: ['en'],
	so: ['so'],
	za: ['zu', 'xh', 'af'],
	es: ['es'],
	lk: ['si'],
	sd: ['ar'],
	sr: ['nl'],
	sz: ['ss'],
	se: ['sv'],
	ch: ['de'],
	sy: ['ar'],
	tw: ['zh'],
	tj: ['tg'],
	tz: ['sw'],
	th: ['th'],
	tg: ['fr'],
	to: ['to'],
	tt: ['en'],
	tn: ['ar'],
	tr: ['tr'],
	tm: ['tk'],
	tv: ['tvl'],
	ug: ['ug'],
	ua: ['uk'],
	ae: ['ar'],
	gb: ['en'],
	us: ['en'],
	uy: ['es'],
	uz: ['uz'],
	vu: ['bi'],
	va: ['it'],
	ve: ['es'],
	vn: ['vi'],
	ye: ['ar'],
	zm: ['en'],
	zw: ['en'],
}

export const LOCALE_LIST_WITH_LANGUAGE = {
	en: [
		'ag',
		'ar',
		'au',
		'bs',
		'bb',
		'bz',
		'cm',
		'ca',
		'cl',
		'cn',
		'co',
		'km',
		'cg',
		'cd',
		'cr',
		'ci',
		'cu',
		'dm',
		'do',
		'ec',
		'sv',
		'gq',
		'gd',
		'gt',
		'gn',
		'gy',
		'ht',
		'hn',
		'jm',
		'ke',
		'ki',
		'lr',
		'mg',
		'mw',
		'mx',
		'fm',
		'na',
		'nr',
		'ng',
		'ni',
		'pa',
		'pg',
		'py',
		'pe',
		'ph',
		'rw',
		'kn',
		'lc',
		'vc',
		'ws',
		'sc',
		'sl',
		'sg',
		'sb',
		'za',
		'es',
		'sd',
		'tt',
		'tn',
		'ug',
		'ae',
		'gb',
		'us',
		'uy',
		've',
		'zm',
		'zw',
	],
	sq: ['al'],
	ar: [
		'dz',
		'bh',
		'eg',
		'iq',
		'jo',
		'kw',
		'lb',
		'ly',
		'om',
		'pk',
		'qa',
		'sa',
		'sd',
		'tn',
		'ye',
	],
	ca: ['ad'],
	pt: ['ao', 'br', 'cv', 'gq', 'gw', 'mz', 'pt', 'st'],
	hy: ['am'],
	az: ['az'],
	be: ['by'],
	nl: ['be', 'nl'],
	bg: ['bg'],
	bn: ['bn'],
	bs: ['ba'],
	hr: ['hr'],
	cs: ['cz'],
	da: ['dk'],
	et: ['et'],
	fi: ['fi'],
	fr: [
		'cf',
		'bj',
		'bf',
		'bi',
		'ga',
		'gn',
		'gw',
		'ht',
		'ci',
		'km',
		'cg',
		'cd',
		'lu',
		'mg',
		'ml',
		'mc',
		'ne',
		'sn',
		'tg',
		'bf',
	],
	ka: ['ge'],
	de: ['at', 'de', 'li'],
	el: ['cy', 'gr'],
	hu: ['hu'],
	is: ['is'],
	hi: ['in'],
	id: ['id'],
	it: ['it', 'va'],
	ja: ['jp'],
	kk: ['kz'],
	km: ['kh'],
	ky: ['kg'],
	ko: ['kp', 'kr'],
	lv: ['lv'],
	lt: ['lt'],
	lb: ['lu'],
	mk: ['mk'],
	mg: ['mg'],
	ms: ['bn', 'my', 'sg'],
	mt: ['mt'],
	my: ['mm'],
	ne: ['np'],
	nb: ['no'],
	ny: ['mw'],
	ur: ['pk'],
	pl: ['pl'],
	ro: ['ro'],
	ru: ['ru'],
	srp: ['me', 'rs'],
	sk: ['sk'],
	sl: ['si'],
	st: ['st'],
	tn: ['tz', 'tn'],
	tg: ['tg'],
	tk: ['tm'],
	tr: ['tr'],
	uk: ['ua'],
	uz: ['uz'],
	vi: ['vn'],
}

export const COUNTRY_CODE_DEFAULT = ServerConfig.locale.defaultCountry || 'vn'
export const LANGUAGE_CODE_DEFAULT = ServerConfig.locale.defaultLang || 'vi'
export const ENABLE_CONSOLE_DEBUGGER = Boolean(
	PROCESS_ENV.ENABLE_CONSOLE_DEBUGGER
)
export const POWER_LEVEL = PROCESS_ENV.POWER_LEVEL
	? Number(PROCESS_ENV.POWER_LEVEL)
	: 3
export const enum POWER_LEVEL_LIST {
	ONE = 1, // low of scraping power
	TWO = 2, // medium of scraping power
	THREE = 3, // hight of scraping power
}
export const BANDWIDTH_LEVEL = PROCESS_ENV.BANDWIDTH_LEVEL
	? Number(PROCESS_ENV.BANDWIDTH_LEVEL)
	: 2
export const enum BANDWIDTH_LEVEL_LIST {
	ONE = 1, // low
	TWO = 2, // hight
}
export const COOKIE_EXPIRED =
	BANDWIDTH_LEVEL == BANDWIDTH_LEVEL_LIST.TWO && ENV !== 'development'
		? 20000
		: 60000
export const IS_REMOTE_CRAWLER = PROCESS_ENV.IS_REMOTE_CRAWLER
