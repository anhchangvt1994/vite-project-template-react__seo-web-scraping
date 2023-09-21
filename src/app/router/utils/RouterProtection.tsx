import type { IUserInfo } from 'store/UserInfoContext'
import type { To } from 'react-router'
import type { INavigateInfo } from 'app/router/context/InfoContext'
import type { IValidation } from 'app/router/context/ValidationContext'
import { useUserInfo } from 'store/UserInfoContext'
import { useNavigateInfo } from 'app/router/context/InfoContext'

export interface ICertInfo {
	user: IUserInfo
	navigateInfo: INavigateInfo
	successPath: string
}

let successPath: string
let successID: string
let WAITING_VERIFY_ROUTER_ID_LIST: { [key: string]: Array<string> }

function useProtectRoute(): IValidation {
	const navigate = useNavigate()
	const route = useRoute()
	const location = useLocation()
	const matches = useMatches()
	const protection: IValidation = {
		status: 200,
	}

	const { userInfo } = useUserInfo()

	const navigateInfo = useNavigateInfo()

	const certificateInfo: ICertInfo = {
		user: userInfo,
		navigateInfo,
		successPath,
	}

	matches.some(function (item) {
		const protect = (
			item?.handle as
				| {
						protect: (certInfo?: ICertInfo) => string
				  }
				| undefined
		)?.protect

		if (protect && typeof protect === 'function') {
			const checkProtection = (isReProtect = false) => {
				const protectInfo = protect(certificateInfo)

				if (!protectInfo) {
					protection.status = 301
					protection.redirect = -1
				} else if (typeof protectInfo === 'string') {
					if (WAITING_VERIFY_ROUTER_ID_LIST[route?.id ?? '']) {
						successPath = location.pathname + location.search
						successID = route?.id ?? ''
					}

					protection.status = 301
					protection.redirect = protectInfo
				}

				if (isReProtect && protection.status !== 200) {
					navigate(protection.redirect as To, {
						replace: protection.status === 301,
					})
				}
			}

			route.handle.reProtect = () => checkProtection(true)

			checkProtection()
		}
	})

	return protection
} // useProtectRoute()

export default function RouterProtection({
	WatingVerifyRouterIDList,
	children,
}) {
	WAITING_VERIFY_ROUTER_ID_LIST = WatingVerifyRouterIDList

	const route = useRoute()
	const protection = useProtectRoute()

	if (protection.status !== 200) {
		const to = protection.redirect || -1

		return <Navigate to={to as To} replace={protection.status === 301} />
	}

	if (
		successID &&
		!WAITING_VERIFY_ROUTER_ID_LIST[successID].includes(route.id as string)
	) {
		successID = ''
		successPath = ''
	}

	return children
} // RouterProtect()
