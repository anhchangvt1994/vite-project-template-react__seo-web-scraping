interface ILighthouseInfo {
	pageSpeedUrl: string
	info: ({ title: string; score: number } | undefined)[]
}

export interface ILighthouseResponse {
	image: string
	original: ILighthouseInfo
	optimal: ILighthouseInfo
}

interface IPageSpeedCategoryInfo {
	title: string
	score: number
}

export type IPageSpeedCategories = IPageSpeedCategoryInfo[]
