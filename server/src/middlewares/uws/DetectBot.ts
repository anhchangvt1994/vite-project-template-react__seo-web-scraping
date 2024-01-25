import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import detectBot from '../../utils/DetectBot.uws'

const DetectBotMiddle = (res: HttpResponse, req: HttpRequest) => {
	if (!res.cookies) res.cookies = {}

	res.cookies.botInfo = (() => {
		const tmpBotInfo = req.getHeader('botinfo') || req.getHeader('botInfo')

		if (tmpBotInfo) return JSON.parse(tmpBotInfo)
		return detectBot(req as any)
	})()
}

export default DetectBotMiddle
