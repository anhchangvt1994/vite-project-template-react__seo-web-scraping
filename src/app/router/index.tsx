import Layout from 'Layout'
import NotFoundPage from 'pages/NotFoundPage'
import { RouteObject } from 'react-router-dom'
import { RouteObjectCustomize } from 'static'
import { withLazy } from './utils/LazyComponentHandler'
import RouterDeliver from './utils/RouterDeliver'
import RouterInit from './utils/RouterInit'
import RouterProtection from './utils/RouterProtection'
import RouterValidation from './utils/RouterValidation'
import RouterPreHandler from './utils/RouterPreHandler'
import { ServerStore } from 'store/ServerStore'
import { LocaleInfoProvider } from './context/LocaleInfoContext'

ServerStore.init()

const WAITING_VERIFY_ROUTER_ID_LIST: { [key: string]: Array<string> } = {
	[import.meta.env.ROUTER_COMMENT_ID]: [import.meta.env.ROUTER_LOGIN_ID],
}

// NOTE - Router Configuration
const routes: RouteObjectCustomize[] = [
	{
		path: import.meta.env.ROUTER_BASE_PATH,
		element: (
			<LocaleInfoProvider>
				<RouterPreHandler>
					<RouterInit>
						<RouterValidation NotFoundPage={NotFoundPage}>
							<RouterDeliver>
								<RouterProtection
									WatingVerifyRouterIDList={WAITING_VERIFY_ROUTER_ID_LIST}
								>
									<Layout />
								</RouterProtection>
							</RouterDeliver>
						</RouterValidation>
					</RouterInit>
				</RouterPreHandler>
			</LocaleInfoProvider>
		),
		children: [
			{
				index: true,
				path: import.meta.env.ROUTER_HOME_PATH,
				element: withLazy(() => import('pages/HomePage')),
			}, // Home Page
			{
				path: import.meta.env.ROUTER_CONTENT_PATH,
				element: withLazy(() => import('pages/ContentPage')),
				handle: {
					params: {
						validate(p) {
							if (typeof p.slugs === 'string') {
								return /\d+$/.test(p.slugs as string)
							}

							return true
						},
						split(p) {
							return {
								slug: p.slugs?.match(/^[a-zA-Z-_.]+[a-zA-Z]/)?.[0],
								id: p.slugs?.match(/\d+$/)?.[0],
							}
						},
					},
				},
				children: [
					{
						path: import.meta.env.ROUTER_CONTENT_COMMENT_PATH,
						element: withLazy(
							() => import('components/comment-page/CommentRow')
						),
					},
					{
						id: import.meta.env.ROUTER_COMMENT_ID,
						path: import.meta.env.ROUTER_COMMENT_PATH,
						element: withLazy(() => import('pages/CommentPage')),

						handle: {
							protect(certInfo) {
								const userInfo = certInfo?.user

								if (!userInfo || !userInfo.email)
									return import.meta.env.ROUTER_LOGIN_PATH

								return true
							},
						},
					},
				],
			}, // Content Page
			{
				id: import.meta.env.ROUTER_LOGIN_ID,
				path: import.meta.env.ROUTER_LOGIN_PATH,
				element: withLazy(() => import('pages/LoginPage')),
				handle: {
					protect(certInfo) {
						const userInfo = certInfo?.user

						if (userInfo && userInfo.email) {
							return certInfo.successPath
								? certInfo.successPath
								: certInfo.navigateInfo?.from
								? certInfo.navigateInfo.from.fullPath
								: import.meta.env.ROUTER_HOME_PATH
						}

						return true
					},
				},
			}, // Login Page
			{
				path: import.meta.env.ROUTER_NOT_FOUND_PATH,
				element: <NotFoundPage />,
			},
		],
	},
]

if (
	routes.length > 0 &&
	routes[0].children &&
	routes[0].children.length > 0 &&
	(LocaleInfo.langSelected || LocaleInfo.countrySelected)
) {
	const formatRoute = (routes) => {
		if (!routes || !routes.length) return

		const total = routes.length

		for (let i = 0; i < total; i++) {
			if (
				(routes[i] && routes[i].path === '*') ||
				(routes[i] && routes[i].path === import.meta.env.ROUTER_LOGIN_PATH)
			)
				continue

			routes[i].path =
				routes[i].path === '/' ? ':locale' : `:locale/${routes[i].path}`
		}
	} // formatRoute

	formatRoute(routes[0].children)
}

const router = createBrowserRouter(routes as RouteObject[], {
	basename: '/',
})

export default router
