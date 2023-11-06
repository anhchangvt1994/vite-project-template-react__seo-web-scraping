import {
	LOCALE_LIST_WITH_COUNTRY,
	LOCALE_LIST_WITH_LANGUAGE,
} from '../../constants'
import ServerConfig from '../../server.config'
import { ILocaleInfo } from '../../types'
import { getCookieFromResponse } from '../../utils/CookieHandler'
import { getLocale } from '../../utils/StringHelper'
import { IRedirectResult } from '../redirect.config'

const ValidateLocaleCode = (
	redirectResult: IRedirectResult,
	res
): IRedirectResult => {
	if (!ServerConfig.locale.enable) return redirectResult

	const LocaleInfo =
		res.cookies?.localeInfo ??
		(getCookieFromResponse(res)?.['LocaleInfo'] as ILocaleInfo)

	const defaultLocale = getLocale(
		LocaleInfo.defaultLang,
		LocaleInfo.defaultCountry
	)

	const pathSplitted = redirectResult.path.split('/')
	const firstDispatcherParam = pathSplitted[1]

	// NOTE - Handle hide the default of locale
	if (
		ServerConfig.locale.hideDefaultLocale &&
		firstDispatcherParam === defaultLocale
	) {
		redirectResult.path = redirectResult.path.replace(`/${defaultLocale}`, '')
		redirectResult.status = 301
		return redirectResult
	}

	// NOTE - Check valid locale code id format
	/**
	 * ANCHOR - /^[a-z-0-9]{2}(|-[A-Za-z]{2})(?:$)/
	 * ANCHOR - &  LANGUAGE_CODE_LIST.indexOf([A-Za-z]{2}.toLowerCase())
	 * ANCHOR - || COUNTRY_CODE_LIST.indexOf([A-Za-z]{2}.toUpperCase())
	 */
	const isLocaleCodeIdFormatValid =
		_checkLocaleCodeIdFormatValid(firstDispatcherParam)

	// NOTE - If isLocaleCodeIdFormatValid === false
	/**
	 * ANCHOR - firstDispatcherParam is exist and invalid router
	 * => next() and return
	 */

	const localeSelected = getLocale(
		LocaleInfo.langSelected,
		LocaleInfo.countrySelected
	)

	if (isLocaleCodeIdFormatValid && localeSelected !== firstDispatcherParam) {
		redirectResult.path = redirectResult.path.replace(
			firstDispatcherParam,
			localeSelected
		)
		redirectResult.status = 301
		return redirectResult
	} else if (
		!isLocaleCodeIdFormatValid &&
		(!ServerConfig.locale.hideDefaultLocale || localeSelected !== defaultLocale)
	) {
		redirectResult.path = `/${localeSelected}${redirectResult.path}`
		redirectResult.status = 301

		return redirectResult
	}

	return redirectResult
}

const _checkLocaleCodeIdFormatValid = (firstDispatcherParam) => {
	if (
		!firstDispatcherParam ||
		typeof firstDispatcherParam !== 'string' ||
		!/^[a-z-0-9]{2}(|-[A-Za-z]{2})(?:$)/.test(firstDispatcherParam)
	) {
		return false
	}

	const arrLocale = firstDispatcherParam.toLowerCase().split('-')

	if (
		arrLocale[0] &&
		!LOCALE_LIST_WITH_LANGUAGE[arrLocale[0]] &&
		!LOCALE_LIST_WITH_COUNTRY[arrLocale[0]]
	)
		return false
	if (
		arrLocale[1] &&
		!LOCALE_LIST_WITH_LANGUAGE[arrLocale[1]] &&
		!LOCALE_LIST_WITH_COUNTRY[arrLocale[1]]
	)
		return false

	return true
} // _checkLocaleCodeIdFormatValid()

export default ValidateLocaleCode
