import ImageItem, { Outer as ImageOuter } from 'components/ImageItem'

const Row = styled.div`
	display: flex;
	margin-bottom: 24px;

	&:last-child {
		margin-bottom: 0;
	}
`
const AvatarCol = styled.div`
	margin-right: 8px;
	flex: 0 0 50px;
	height: 50px;
	${ImageOuter} {
		height: 100%;
		width: 100%;
		overflow: hidden;
		border-radius: 50%;
		background-color: ${rgba(import.meta.env.STYLE_COLOR_DARK, 0.1)};
		background-size: 16px 16px;
	}
`
const MetaCol = styled.div`
	min-width: 0;
	flex: 1 1 auto;
`
const NameLabel = styled.p`
	width: 25%;
	height: 14px;
	background: ${rgba(import.meta.env.STYLE_COLOR_DARK, 0.1)};
	margin-bottom: 8px;
`
const ContentLabel = styled.div`
	width: 50%;
	height: 14px;
	margin-bottom: 4px;
	background: ${rgba(import.meta.env.STYLE_COLOR_DARK, 0.1)};

	&:last-child {
		margin-bottom: 0;
	}

	&:nth-of-type(2) {
		width: 40%;
	}
`

export default function CommentLoader({ amount }: { amount: number }) {
	const commentList = new Array(amount).fill(null).map((val, idx) => (
		<Row key={idx}>
			<AvatarCol>
				<ImageItem src="" />
			</AvatarCol>
			<MetaCol>
				<NameLabel></NameLabel>
				<ContentLabel></ContentLabel>
				<ContentLabel></ContentLabel>
			</MetaCol>
		</Row>
	))
	return <>{commentList}</>
}
