'use strict' /* Non-SSL is simply App() */
const port = 9001

require('uWebSockets.js')
	./*SSL*/ App({
		key_file_name: 'misc/key.pem',
		cert_file_name: 'misc/cert.pem',
		passphrase: '1234',
	})
	.any('*', (res, req) => {
		res.writeHeader('greeting', 'hello world!')
		req.setYield(true)
	})
	.any('/anything', (res, req) => {
		res.end('Any route with method: ' + req.getMethod())
	})
	.get('/user/agent', (res, req) => {
		/* Read headers */
		res.end(
			'Your user agent is: ' +
				req.getHeader('user-agent') +
				' thank you, come again!'
		)
	})
	.get('/static/yes', (res, req) => {
		/* Static match */
		res.end('This is very static')
	})
	.get('/candy/:kind', (res, req) => {
		/* Parameters */
		res.end('So you want candy? Have some ' + req.getParameter(0) + '!')
	})
	.get('/*', async (res, req) => {
		// Gắn một hàm xử lý khi request bị hủy
		res.onAborted(() => {
			console.log('Request aborted')
		})
		// Tạo một promise để đợi 1000ms
		await new Promise((resolve) => setTimeout(resolve, 1000))
		// Sử dụng res.cork để tạo một vùng nhớ tạm thời
		res.cork(() => {
			// Trả lời request bằng cách gửi một chuỗi rỗng
			res.end('test')
		})
	})
	.listen(port, (token) => {
		if (token) {
			console.log('Listening to port ' + port)
		} else {
			console.log('Failed to listen to port ' + port)
		}
	})
