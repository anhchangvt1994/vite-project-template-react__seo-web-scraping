import { useEffect } from 'react'

class useEffectCustomize {
	private _state: Array<string> = []

	constructor(_state) {
		this._state = _state
	}

	init(cb) {
		useEffect(cb, this._state)
	}
}

export default useEffectCustomize
