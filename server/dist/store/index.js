'use strict'
Object.defineProperty(exports, '__esModule', { value: true })

const BrowserStore = {}
exports.BrowserStore = BrowserStore
const HeadersStore = {}
exports.HeadersStore = HeadersStore
const PromiseStore = {}
exports.PromiseStore = PromiseStore

const store = {
	browser: exports.BrowserStore,
	headers: exports.HeadersStore,
	promise: exports.PromiseStore,
}
exports.store = store

const getStoreList = () => {
	return exports.store
}
exports.getStoreList = getStoreList // getStoreList

const getStore = (key) => {
	if (!key) return
	if (
		!exports.store[key] ||
		exports.store[key] === null ||
		Array.isArray(exports.store[key]) ||
		typeof exports.store[key] !== 'object'
	)
		return exports.store[key]

	return exports.store[key]
}
exports.getStore = getStore // getStore

const setStore = (key, value) => {
	if (!key || !value) return

	exports.store[key] = value
}
exports.setStore = setStore // getStores
