import {
	INavigateInfo,
	IRouteInfo,
	NavigateInfoContext,
	RouteInfoContext,
	useRouteInit,
} from 'app/router/context/InfoContext'
import type { Params } from 'react-router'
import { resetSeoTag } from 'utils/SeoHelper'

let navigateInfo: INavigateInfo = {
	from: undefined,
	to: undefined,
}

function useSplitParams(): Params<string> {
	const matches = useMatches()
	const params = useParams()

	let newParams = {
		...params,
	}

	matches.forEach(function (item) {
		const splitParams = (
			item as {
				handle?: {
					params?: {
						split: (params: Params) => Params
					}
				}
			}
		)?.handle?.params?.split

		if (params && typeof splitParams === 'function') {
			newParams = {
				...newParams,
				...(splitParams(params) || {}),
			}
		}
	})

	return newParams
} // useSplitParams()

export default function RouterDeliver({ children }) {
	const location = useLocation()
	const routeInit = useRouteInit()
	const params = useSplitParams()
	const queryString = location.search?.substring(1)
	const query = queryString
		? JSON.parse(
				'{"' + queryString.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
				function (key, value) {
					return key === '' ? value : decodeURIComponent(value)
				}
		  )
		: undefined

	const routeInfo: IRouteInfo = {
		params,
		query,
		path: location.pathname,
		fullPath: location.pathname + location.search,
		id: routeInit?.id,
		handle: {},
	}

	navigateInfo = {
		from: navigateInfo.to || navigateInfo.from,
		to: routeInfo,
	}

	if (
		navigateInfo.from &&
		navigateInfo.to &&
		navigateInfo.from.path !== navigateInfo.to.path
	) {
		fetch(navigateInfo.to.path as string, {
			headers: new Headers({
				Accept:
					'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
			}),
		})
		resetSeoTag()
	}

	return (
		<RouteInfoContext.Provider value={routeInfo}>
			<NavigateInfoContext.Provider value={navigateInfo}>
				{children}
			</NavigateInfoContext.Provider>
		</RouteInfoContext.Provider>
	)
} // RouterDiliver()
