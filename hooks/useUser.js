import { useSelector } from 'react-redux'

export default function useUser() {
  const { user, token, isRefreshing } = useSelector((state) => state.root)
  return { user, accessToken: token, isRefreshing }
}
