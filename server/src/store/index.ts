import { IStores } from './types'

export const BrowserStore: IStores['browser'] = {}
export const HeadersStore: IStores['headers'] = {}
export const PromiseStore: IStores['promise'] = {}

export const store: IStores = {
	browser: BrowserStore,
	headers: HeadersStore,
	promise: PromiseStore,
}

export const getStoreList = () => {
	return store
} // getStoreList

export const getStore = (key: keyof IStores) => {
	if (!key) return
	if (
		!store[key] ||
		store[key] === null ||
		Array.isArray(store[key]) ||
		typeof store[key] !== 'object'
	)
		return store[key]

	return store[key] as any
} // getStore

export const setStore = (key: keyof IStores, value) => {
	if (!key || !value) return

	store[key] = value
} // getStores
