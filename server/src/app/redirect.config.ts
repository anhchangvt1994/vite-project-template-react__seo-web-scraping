import ServerConfig from '../server.config'
import ValidateLocaleCode from './services/ValidateLocaleCode'

export interface IRedirectResult {
	originPath: string
	path: string
	search: string | undefined
	status: number
}
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
export const REDIRECT_INJECTION = (
	redirectResult,
	req,
	res
): IRedirectResult => {
	let statusCode = 200

	// if (/(0|1|2)$/.test(redirectUrl)) {
	// 	statusCode = 302
	// 	redirectUrl = redirectUrl.replace(/(0|1|2)$/, '3')
	// }

	const enableLocale =
		ServerConfig.locale.enable &&
		Boolean(
			!ServerConfig.locale.routes ||
				!ServerConfig.locale.routes[redirectResult.originPath] ||
				ServerConfig.locale.routes[redirectResult.originPath].enable
		)

	if (enableLocale) {
		const localeCodeValidationResult = ValidateLocaleCode(redirectResult, res)

		if (localeCodeValidationResult.status !== 200) {
			redirectResult.status =
				redirectResult.status === 301
					? redirectResult.status
					: localeCodeValidationResult.status
			redirectResult.path = localeCodeValidationResult.path
		}
	}

	return redirectResult
} // REDIRECT_INJECTION
