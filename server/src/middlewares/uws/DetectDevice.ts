import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import { getStore, setStore } from '../../store'
import detectDevice from '../../utils/DetectDevice.uws'
import { PROCESS_ENV } from '../../utils/InitEnv'

const DetectDeviceMiddle = (res: HttpResponse, req: HttpRequest) => {
	if (!res.cookies) res.cookies = {}

	res.cookies.deviceInfo = (() => {
		const tmpDeviceInfo =
			req.getHeader('deviceinfo') || req.getHeader('deviceInfo')

		if (tmpDeviceInfo) return JSON.parse(tmpDeviceInfo)

		return detectDevice(req as any)
	})()

	if (!PROCESS_ENV.IS_REMOTE_CRAWLER) {
		const headersStore = getStore('headers')
		headersStore.deviceInfo = JSON.stringify(res.cookies.deviceInfo)
		setStore('headers', headersStore)
	}
}

export default DetectDeviceMiddle
