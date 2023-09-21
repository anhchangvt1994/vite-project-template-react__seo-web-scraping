import { Request } from 'express'

export interface IRedirectInfoItem {
	statusCode: number
	path: string
	targetPath: string
}

// NOTE - Declare redirects
export const REDIRECT_INFO: IRedirectInfoItem[] = [
	{
		path: '/test',
		targetPath: '/',
		statusCode: 302,
	},
]

// NOTE - Declare redirect middleware
export const REDIRECT_INJECTION = (req: Request) => {} // REDIRECT_INJECTION
