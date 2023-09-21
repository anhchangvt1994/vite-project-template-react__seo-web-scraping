import ModuleSection from 'components/home-page/ModuleSection'

function HomePage() {
	setSeoTag({
		title: 'Trang chủ',
		keywords: 'trang chủ, vue 3, wsc-seo',
		description: 'Trang chủ Vue 3.x and WSC-SEO',
		'og:type': 'website',
		'og:title': 'Trang chủ',
		'og:description': 'Trang chủ Vue 3.x and WSC-SEO',
		'og:url': window.location.pathname,
		'og:site_name': 'Vue 3.x and WSC-SEO',
		'og:image': '',
		'og:image:width': '1200',
		'og:image:height': '628',
		robots: 'index, follow',
	})
	return (
		<div className="home-page">
			<ModuleSection />
		</div>
	)
}

export default HomePage
