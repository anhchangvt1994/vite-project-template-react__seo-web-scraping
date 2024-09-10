import { ILighthouseResponse } from './types'

export const TARGET_OPTIMAL_URL = 'https://spicy-lion-10.telebit.io'

export const LIGHT_HOUSE_RESPONSE_INIT: ILighthouseResponse = {
	image: '',
	original: {
		pageSpeedUrl: '',
		info: [],
	},
	optimal: {
		pageSpeedUrl: '',
		info: [],
	},
}
