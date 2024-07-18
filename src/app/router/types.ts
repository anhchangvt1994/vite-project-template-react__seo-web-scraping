import { IndexRouteObject } from 'react-router-dom'
import { ICertCustomizationInfo } from './hooks/useCertificateCustomizationInfo'
import { ICertInfo } from './utils/RouterProtection'
import { IRouteInfo } from './context/InfoContext'

export interface RouteObjectCustomize
	extends Omit<IndexRouteObject, 'index' | 'children'> {
	index?: boolean
	handle?: {
		params?: {
			validate?: (params: Record<string, string>) => boolean
			[key: string]: any
		}
		protect?: (
			certInfo: ICertInfo & ICertCustomizationInfo,
			route: IRouteInfo
		) => boolean | string
		reProtect?: (
			certInfo: ICertInfo & ICertCustomizationInfo,
			route: IRouteInfo
		) => boolean | string
		[key: string]: any
	}
	children?: RouteObjectCustomize[]
}

export interface IRouterProtectionProps {
	waitingVerifyRouterIDList?: { [key: string]: Array<string> }
	children?: ReactNode
}
