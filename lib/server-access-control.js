import { headers } from 'next/headers'
import { isSuperUser } from '../app/auth'
import api from './api-client'
import 'server-only'

// eslint-disable-next-line import/prefer-default-export
export async function checkAccess(user, token, page, groupToGrantAccess, suAccess = false) {
  if (!token || !user?.id) return false
  if (suAccess && isSuperUser(user)) return true

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  try {
    const supportGroupResult = await api.get(
      '/groups',
      { id: groupToGrantAccess, select: 'id,members' },
      { accessToken: token, remoteIpAddress }
    )

    const isMember = supportGroupResult?.groups?.[0]?.members?.some((member) =>
      user.profile?.usernames?.includes(member)
    )
    if (!isMember) {
      // oxlint-disable-next-line no-console
      console.log(`User is not member of ${groupToGrantAccess} group`, {
        page,
        user: user.id,
        remoteIpAddress,
      })
      return false
    }
  } catch (error) {
    // oxlint-disable-next-line no-console
    console.log(`Error in ${page} page Access Control`, {
      page,
      user: user.id,
      remoteIpAddress,
      apiError: error,
    })
    return false
  }
  return true
}
