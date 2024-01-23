import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import detectBot from '../../utils/DetectBot.uws'
import { getStore, setStore } from '../../store'

const DetectBotMiddle = (res: HttpResponse, req: HttpRequest) => {
	if (!res.cookies) res.cookies = {}

	res.cookies.botInfo = (() => {
		const tmpBotInfo = req.getHeader('botinfo') || req.getHeader('botInfo')

		if (tmpBotInfo) return JSON.parse(tmpBotInfo)
		return detectBot(req as any)
	})()

	if (!process.env.IS_REMOTE_CRAWLER) {
		const headersStore = getStore('headers')
		headersStore.botInfo = JSON.stringify(res.cookies.botInfo)
		setStore('headers', headersStore)
	}
}

export default DetectBotMiddle
