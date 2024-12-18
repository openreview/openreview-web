import { useContext } from 'react'
import { useSelector } from 'react-redux'
import UserContext from '../components/UserContext'

export default function useUser() {
  // return useContext(UserContext) ?? {}
  const { user, token, isRefreshing } = useSelector((state) => state.root)
  return { user, accessToken: token, isRefreshing }
}
