import type { IndexRouteObject } from 'react-router-dom'

declare module '*.svg' {
	const value: string
	export = value
}
declare module '*.png' {
	const value: string
	export = value
}
declare module '*.jpg' {
	const value: string
	export = value
}
declare module '*.jpeg' {
	const value: string
	export = value
}
declare module '*.webp' {
	const value: string
	export = value
}
declare module '*.mp3' {
	const value: string
	export = value
}
declare module '*.mp4' {
	const value: string
	export = value
}
declare module '*.mov' {
	const value: string
	export = value
}
declare module '*.mkv' {
	const value: string
	export = value
}
declare module '*.webm' {
	const value: string
	export = value
}
declare module '*.scss' {
	const value: string
	export = value
}

export interface RouteObjectCustomize extends IndexRouteObject {
	index?: boolean
	handle?: {
		params?: {
			validate?: (params: Record<string, string>) => boolean
			[key: string]: any
		}
		protect?: (certInfo: any) => boolean | string
		reProtect?: (certInfo: any) => boolean | string
		[key: string]: any
	}
	children?: RouteObjectCustomize[]
}
