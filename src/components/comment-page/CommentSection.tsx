import LoadingBoundary from 'utils/LoadingBoundary'
import CommentLoader from 'components/comment-page/CommentLoader'

const Section = styled.section`
	margin-top: 24px;
`

export default function CommentSection({ children }) {
	const { id } = useRoute()
	return (
		<Section>
			<LoadingBoundary key={id} fallback={<CommentLoader amount={3} />}>
				{children}
			</LoadingBoundary>
		</Section>
	)
}
