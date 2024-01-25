import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import detectDevice from '../../utils/DetectDevice.uws'

const DetectDeviceMiddle = (res: HttpResponse, req: HttpRequest) => {
	if (!res.cookies) res.cookies = {}

	res.cookies.deviceInfo = (() => {
		const tmpDeviceInfo =
			req.getHeader('deviceinfo') || req.getHeader('deviceInfo')

		if (tmpDeviceInfo) return JSON.parse(tmpDeviceInfo)

		return detectDevice(req as any)
	})()
}

export default DetectDeviceMiddle
