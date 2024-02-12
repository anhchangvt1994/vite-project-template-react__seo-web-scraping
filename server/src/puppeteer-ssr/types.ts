export type ISSRResult =
	| {
			response: string
			status: number
			html?: string
			file: string
			createdAt: Date
			updatedAt: Date
			requestedAt: Date
			available: boolean
			ttRenderMs: number
			isInit: boolean
			isRaw: boolean
			hasRenew?: boolean
	  }
	| undefined
