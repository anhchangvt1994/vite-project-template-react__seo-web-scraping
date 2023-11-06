import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import detectBot from '../../utils/DetectBot.uws'

const DetectBotMiddle = (res: HttpResponse, req: HttpRequest) => {
	if (!res.cookies) res.cookies = {}

	if (req.getHeader('service') === 'puppeteer') {
		res.cookies.botInfo = req.getHeader('botInfo')
			? JSON.parse(req.getHeader('botInfo'))
			: {}
	} else {
		res.cookies.botInfo = detectBot(req as any)
	}
}

export default DetectBotMiddle
