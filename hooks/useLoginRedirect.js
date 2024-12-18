import { useEffect } from 'react'
import { useRouter } from 'next/router'
import useUser from './useUser'

// Returns the user object and accessToken if the user is logged in, or if not
// redirects the user to /login with the redirect param set.
export default function useLoginRedirect() {
  const { user, accessToken, isRefreshing, userLoading, logoutRedirect } = useUser()
  const router = useRouter()

  // useEffect(() => {
  //   if (!userLoading && !user && !logoutRedirect) {
  //     router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
  //   }
  // }, [userLoading, user, logoutRedirect])
  useEffect(() => {
    if (isRefreshing || user) return
    router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
  }, [user, isRefreshing])

  return { user, accessToken, userLoading }
}
