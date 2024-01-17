export interface IStores {
	browser: {
		userDataPath?: string
		[key: string]: string | number | undefined
	}
	promise: {
		executablePath?: Promise<string>
	}
}
