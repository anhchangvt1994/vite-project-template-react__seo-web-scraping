export type IUserInfo = {
	email: string
}

const INIT_USER_INFO: IUserInfo = { email: '' }

export const UserInfoContext = createContext<{
	userInfo: IUserInfo
	userState: IUserInfo
	setUserState: React.Dispatch<React.SetStateAction<IUserInfo>>
}>({
	userInfo: INIT_USER_INFO,
	userState: INIT_USER_INFO,
	setUserState: () => null,
})

export function UserInfoProvider({ children }) {
	const [userState, setUserState] = useReducer(
		(currentData, updateData) => ({
			...currentData,
			...updateData,
		}),
		INIT_USER_INFO
	)
	const userInfo = userState

	return (
		<UserInfoContext.Provider
			value={{
				userInfo,
				userState,
				setUserState,
			}}
		>
			{children}
		</UserInfoContext.Provider>
	)
} // UserInfoDeliver()

export function useUserInfo() {
	return useContext(UserInfoContext)
} // useUserInfo()
