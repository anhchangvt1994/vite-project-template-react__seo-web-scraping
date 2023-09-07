import { RouteObject } from 'react-router-dom'
import { RouteObjectCustomize } from 'static'
import Layout from 'Layout'
import NotFoundPage from 'pages/NotFoundPage'
import RouterInit from './utils/RouterInit'
import RouterValidation from './utils/RouterValidation'
import RouterProtection from './utils/RouterProtection'
import RouterDeliver from './utils/RouterDeliver'
import { withLazy } from './utils/LazyComponentHandler'

const WAITING_VERIFY_ROUTER_ID_LIST: { [key: string]: Array<string> } = {
	[import.meta.env.ROUTER_COMMENT_ID]: [import.meta.env.ROUTER_LOGIN_ID],
}

// NOTE - Router Configuration
const routes: RouteObjectCustomize[] = [
	{
		path: import.meta.env.ROUTER_BASE_PATH,
		element: (
			<RouterInit>
				<RouterValidation NotFoundPage>
					<RouterDeliver>
						<RouterProtection
							WatingVerifyRouterIDList={WAITING_VERIFY_ROUTER_ID_LIST}
						>
							<Layout />
						</RouterProtection>
					</RouterDeliver>
				</RouterValidation>
			</RouterInit>
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

const router = createBrowserRouter(routes as RouteObject[], {
	basename: '/',
})

export default router
