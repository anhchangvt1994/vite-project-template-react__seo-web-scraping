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
}
