export default class ErrorBoundary extends React.Component<{
	children?: any
	fallback?: any
	onError?: (error: any) => void
	timeout?: number
}> {
	state = { hasError: false }

	static getDerivedStateFromError() {
		// Update state so the next render will show the fallback UI.
		return { hasError: true }
	}

	componentDidCatch(error) {
		this.props.onError?.(error)
	}

	render() {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			const ErrorTemplate = this.props.fallback ? (
				this.props.fallback
			) : (
				<div>'Something went wrong!'</div>
			)
			return ErrorTemplate
		}

		return this.props.children
	}
}
