import ErrorBoundary from 'utils/ErrorBoundary'
import LoadingBoundary from 'utils/LoadingBoundary'
import LoadingPageComponent from 'components/LoadingPageComponent'
import ErrorLoadingPageComponent from 'components/ErrorPageComponent'
import { useUserInfo } from 'store/UserInfoContext'

const MainContainer = styled.div`
	max-width: 1280px;
	min-width: 0;
	min-height: 100vh;
	overflow: hidden;
	padding: 16px;
	margin: 0 auto;
`

const Header = styled.header`
	padding: 16px;
	text-align: right;
`

function Layout() {
	const location = useLocation()
	const route = useRoute()
	const { userState, setUserState } = useUserInfo()
	const { localeState } = useLocaleInfo()
	const curLocale = useMemo(
		() => getLocale(localeState.lang, localeState.country),
		[localeState.lang, localeState.country]
	)

	if (BotInfo.isBot) {
		setMetaViewportTag('width=device-width, initial-scale=1')
	} else {
		setMetaViewportTag(
			'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
		)
	}

	const onClickLogout = () => {
		setUserState({ email: '' })
		route.handle.reProtect?.()
	}

	return (
		<div className="layout">
			<MainContainer>
				<Header>
					<div>
						<Link
							style={{ cursor: 'pointer' }}
							to={route.fullPath?.replace(curLocale, 'vi-vn') ?? ''}
							replace
						>
							VI
						</Link>
						<span style={{ display: 'inline-block', margin: '0 8px' }}>|</span>
						<Link
							style={{ cursor: 'pointer' }}
							to={route.fullPath?.replace(curLocale, 'en-us') ?? ''}
							replace
						>
							EN
						</Link>
					</div>
					{userState && userState.email ? (
						<>
							{userState.email + ' | '}
							<span style={{ cursor: 'pointer' }} onClick={onClickLogout}>
								Logout
							</span>
						</>
					) : (
						<Link
							style={{ cursor: 'pointer' }}
							to={import.meta.env.ROUTER_LOGIN_PATH}
						>
							Login
						</Link>
					)}
				</Header>
				<ErrorBoundary fallback={<ErrorLoadingPageComponent />}>
					<LoadingBoundary
						key={location.pathname}
						delay={150}
						fallback={<LoadingPageComponent />}
					>
						<Outlet />
					</LoadingBoundary>
				</ErrorBoundary>
			</MainContainer>
		</div>
	)
} // App()

export default Layout
