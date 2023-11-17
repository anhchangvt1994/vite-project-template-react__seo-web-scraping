import 'assets/styles/main.css'
import 'assets/styles/tailwind.css'
import router from 'app/router/index'
import { UserInfoProvider } from 'store/UserInfoContext'
import { LocaleInfoProvider } from 'app/router/context/LocaleInfoContext'

const root = createRoot(document.getElementById('root'))

root.render(
	<StrictMode>
		<LocaleInfoProvider>
			<UserInfoProvider>
				<RouterProvider router={router} />
			</UserInfoProvider>
		</LocaleInfoProvider>
	</StrictMode>
)
