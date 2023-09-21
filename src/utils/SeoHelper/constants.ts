import { generateLinkTag, generateMetaTag, generateTitleTag } from './utils'

export const enum SeoTagsEnum {
	title = 'title',
	description = 'description',
	keywords = 'keywords',
	robots = 'robots',
	canonical = 'canonical',
	viewport = 'viewport',
	og_title = 'og:title',
	og_description = 'og:description',
	og_image = 'og:image',
	og_image_width = 'og:image:width',
	og_image_height = 'og:image:height',
	og_url = 'og:url',
	og_type = 'og:type',
	og_site_name = 'og:site_name',
	author = 'author',
	author_link = 'author_link',
	googlebot = 'googlebot',
	'google_site_verification' = 'google-site-verification',
	alternate = 'alternate',
	geo_region = 'geo.region',
	geo_placename = 'geo.placename',
	geo_position = 'geo.position',
	ICBM = 'ICBM',
	next = 'next',
	prev = 'prev',
	amphtml = 'amphtml',
	twitter_title = 'twitter:title',
	twitter_description = 'twitter:description',
	twitter_image = 'twitter:image',
	twitter_card = 'twitter:card',
	article_published_time = 'article:published_time',
	article_modified_time = 'article:modified_time',
	article_section = 'article:section',
	article_tag = 'article:tag',
}

export const SeoTags = {
	[SeoTagsEnum.title]: generateTitleTag,
	[SeoTagsEnum.description]: (val) =>
		generateMetaTag(SeoTagsEnum.description, val),
	[SeoTagsEnum.keywords]: (val) => generateMetaTag(SeoTagsEnum.keywords, val),
	[SeoTagsEnum.robots]: (val) => generateMetaTag(SeoTagsEnum.robots, val),
	[SeoTagsEnum.canonical]: (val) => generateLinkTag(SeoTagsEnum.canonical, val),
	[SeoTagsEnum.viewport]: (val) => generateMetaTag(SeoTagsEnum.viewport, val),
	[SeoTagsEnum.og_title]: (val) => generateMetaTag(SeoTagsEnum.og_title, val),
	[SeoTagsEnum.og_description]: (val) =>
		generateMetaTag(SeoTagsEnum.og_description, val),
	[SeoTagsEnum.og_image]: (val) => generateMetaTag(SeoTagsEnum.og_image, val),
	[SeoTagsEnum.og_image_width]: (val) =>
		generateMetaTag(SeoTagsEnum.og_image_width, val),
	[SeoTagsEnum.og_image_height]: (val) =>
		generateMetaTag(SeoTagsEnum.og_image_height, val),
	[SeoTagsEnum.og_url]: (val) => generateMetaTag(SeoTagsEnum.og_url, val),
	[SeoTagsEnum.og_type]: (val) => generateMetaTag(SeoTagsEnum.og_type, val),
	[SeoTagsEnum.og_site_name]: (val) =>
		generateMetaTag(SeoTagsEnum.og_site_name, val),
	[SeoTagsEnum.author]: (val) => generateMetaTag(SeoTagsEnum.author, val),
	[SeoTagsEnum.googlebot]: (val) => generateMetaTag(SeoTagsEnum.googlebot, val),
	[SeoTagsEnum.google_site_verification]: (val) =>
		generateMetaTag(SeoTagsEnum.google_site_verification, val),
	[SeoTagsEnum.alternate]: (val) => generateLinkTag(SeoTagsEnum.alternate, val),
	[SeoTagsEnum.geo_region]: (val) =>
		generateMetaTag(SeoTagsEnum.geo_region, val),
	[SeoTagsEnum.geo_position]: (val) =>
		generateMetaTag(SeoTagsEnum.geo_position, val),
	[SeoTagsEnum.ICBM]: (val) => generateMetaTag(SeoTagsEnum.ICBM, val),
	[SeoTagsEnum.next]: (val) => generateLinkTag(SeoTagsEnum.next, val),
	[SeoTagsEnum.prev]: (val) => generateLinkTag(SeoTagsEnum.prev, val),
	[SeoTagsEnum.author_link]: (val) => generateLinkTag(SeoTagsEnum.author, val),
	[SeoTagsEnum.amphtml]: (val) => generateLinkTag(SeoTagsEnum.amphtml, val),
	[SeoTagsEnum.twitter_title]: (val) =>
		generateMetaTag(SeoTagsEnum.twitter_title, val),
	[SeoTagsEnum.twitter_description]: (val) =>
		generateMetaTag(SeoTagsEnum.twitter_description, val),
	[SeoTagsEnum.twitter_image]: (val) =>
		generateMetaTag(SeoTagsEnum.twitter_image, val),
	[SeoTagsEnum.twitter_card]: (val) =>
		generateMetaTag(SeoTagsEnum.twitter_card, val),
}
