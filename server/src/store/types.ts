export interface IStores {
	browser: {
		userDataPath?: string
		reserveUserDataPath?: string
		[key: string]: string | number | undefined
	}
	headers: {
		botInfo?: string
		deviceInfo?: string
		localeInfo?: string
		accept?: string
		[key: string]: string | number | undefined
	}
	promise: {
		executablePath?: Promise<string>
	}
	api: {
		cache: Map<
			string,
			{
				fetch: () => Promise<any>
				controller?: AbortController
				destroy: NodeJS.Timeout
				updateAt: number
				createAt: number
			}
		>
		store: Map<
			string,
			{
				list: string[]
				destroy: NodeJS.Timeout
				updateAt: number
			}
		>
	}
}
