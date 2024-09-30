import { SERVER_LESS } from '../../constants'
import {
	cleanAPIDataCache,
	cleanAPIStoreCache,
	cleanBrowsers,
	cleanOther,
	cleanPages,
} from './utils'

let isFirstInitCompleted = false

const CleanerService = async (force = false) => {
	if (isFirstInitCompleted && !force) return

	// NOTE - Browser Cleaner
	cleanBrowsers()

	// NOTE - Pages Cleaner
	cleanPages()

	// NOTE - API Data Cache Cleaner
	cleanAPIDataCache()

	// NOTE - API Store Cache Cleaner
	cleanAPIStoreCache()

	// NOTE - Other cleaner
	cleanOther()

	isFirstInitCompleted = true
}

if (!SERVER_LESS) CleanerService()

export default CleanerService
