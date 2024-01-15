export interface IStores {
	browser: {
		userDataPath?: string
		executablePath?: string
	}
	promise: {
		executablePath?: Promise<string>
	}
}
