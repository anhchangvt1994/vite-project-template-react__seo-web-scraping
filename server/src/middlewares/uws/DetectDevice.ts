import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import detectDevice from '../../utils/DetectDevice.uws'
import { getStore, setStore } from '../../store'

const DetectDeviceMiddle = (res: HttpResponse, req: HttpRequest) => {
	if (!res.cookies) res.cookies = {}

	res.cookies.deviceInfo = (() => {
		const tmpDeviceInfo =
			req.getHeader('deviceinfo') || req.getHeader('deviceInfo')

		if (tmpDeviceInfo) return JSON.parse(tmpDeviceInfo)

		return detectDevice(req as any)
	})()

	if (!process.env.IS_REMOTE_CRAWLER) {
		const headersStore = getStore('headers')
		headersStore.deviceInfo = JSON.stringify(res.cookies.deviceInfo)
		setStore('headers', headersStore)
	}
}

export default DetectDeviceMiddle
