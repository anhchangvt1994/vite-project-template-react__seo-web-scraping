export function Suspender(f) {
	let status
	let result
	let suspender

	return {
		start() {
			useEffect(() => {
				return () => {
					suspender = undefined
				}
			}, [])

			if (!suspender && typeof f === 'function') {
				status = 'pending'
				const promise = f()
				suspender = promise.then(
					(r) => {
						status = 'success'
						result = r
					},
					(e) => {
						status = 'error'
						result = e
					}
				)
			}

			if (status === 'pending') {
				throw suspender
			} else if (status === 'success') {
				return result
			} else if (status === 'error') {
				throw result
			}
		},
	}
}
