import { useContext } from 'react'
import UserContext from '../components/UserContext'

export default function useUser() {
  return useContext(UserContext)
}
