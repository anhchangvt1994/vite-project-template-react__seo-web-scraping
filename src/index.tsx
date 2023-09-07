import 'assets/styles/main.css'
import 'assets/styles/tailwind.css'
import router from 'config/router/index'
import { UserInfoProvider } from 'context/UserInfoContext'

const root = createRoot(document.getElementById('root'))

root.render(
	<StrictMode>
		<UserInfoProvider>
			<RouterProvider router={router} />
		</UserInfoProvider>
	</StrictMode>
)
