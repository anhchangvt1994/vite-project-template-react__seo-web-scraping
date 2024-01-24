import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import { getStore, setStore } from '../../store'
import detectBot from '../../utils/DetectBot.uws'
import { PROCESS_ENV } from '../../utils/InitEnv'

const DetectBotMiddle = (res: HttpResponse, req: HttpRequest) => {
	if (!res.cookies) res.cookies = {}

	res.cookies.botInfo = (() => {
		const tmpBotInfo = req.getHeader('botinfo') || req.getHeader('botInfo')

		if (tmpBotInfo) return JSON.parse(tmpBotInfo)
		return detectBot(req as any)
	})()

	if (!PROCESS_ENV.IS_REMOTE_CRAWLER) {
		const headersStore = getStore('headers')
		headersStore.botInfo = JSON.stringify(res.cookies.botInfo)
		setStore('headers', headersStore)
	}
}

export default DetectBotMiddle
