import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import detectDevice from '../../utils/DetectDevice.uws'

const DetectDeviceMiddle = (res: HttpResponse, req: HttpRequest) => {
	if (!res.cookies) res.cookies = {}
	if (req.getHeader('service') === 'puppeteer') {
		res.cookies.deviceInfo = req.getHeader('deviceInfo')
			? JSON.parse(req.getHeader('deviceInfo'))
			: {}
	} else {
		res.cookies.deviceInfo = detectDevice(req as any)
	}
}

export default DetectDeviceMiddle
