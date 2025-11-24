import { redirect } from 'next/navigation'
import Link from 'next/link'
import { stringify } from 'query-string'
import { headers } from 'next/headers'
import { orderBy } from 'lodash'
import serverAuth, { isSuperUser } from '../auth'
import api from '../../lib/api-client'
import ErrorDisplay from '../../components/ErrorDisplay'
import Profile from './Profile'
import { formatProfileData } from '../../lib/profiles'
import CommonLayout from '../CommonLayout'
import EditBanner from '../../components/EditBanner'
import PreferredIdUpdater from './PreferredIdUpdater'
import { prettyId } from '../../lib/utils'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams

  return {
    title: `${prettyId(id)} | OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const { user, token } = await serverAuth()
  const query = await searchParams
  const { id, email } = query
  if (!user && !id && !email)
    redirect(`/login?redirect=/profile?${encodeURIComponent(stringify(query))}`)

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const isProfileOwner =
    (id && user?.profile?.usernames?.includes(id)) ||
    (email && user?.profile?.emails?.includes(email)) ||
    id === '' ||
    email === '' ||
    (!id && !email)

  let profileResult
  try {
    // eslint-disable-next-line no-nested-ternary
    profileResult = await api.get('/profiles', isProfileOwner ? {} : id ? { id } : { email }, {
      accessToken: token,
      remoteIpAddress,
    })
  } catch (error) {
    return <ErrorDisplay message="Profile not found" />
  }
  const profile = profileResult?.profiles?.[0]
  if (!profile)
    return (
      <ErrorDisplay message={`The profile ${id || email} does not exist or it's not public`} />
    )
  if (!profile.active && !isSuperUser(user)) {
    return (
      <ErrorDisplay statusCode={400} message={`The profile ${id || email} is not active`} />
    )
  }

  let serviceRoles = []
  if (isSuperUser(user)) {
    try {
      const serviceRolesResult = await api.get(
        '/tags',
        {
          profile: profile.id,
        },
        {
          remoteIpAddress,
        }
      )

      serviceRoles = orderBy(
        serviceRolesResult.tags?.filter((p) => p.parentInvitations?.endsWith('_Role')),
        ['cdate'],
        ['desc']
      )
    } catch (error) {
      console.log('Error in page', {
        page: 'Home',
        error,
      })
    }
  }

  const editBanner = isProfileOwner ? (
    <EditBanner>
      <span>
        Currently showing your profile in View mode. Switch to Edit mode:{' '}
        <Link href="/profile/edit" className="btn btn-xs btn-primary toggle-mode">
          Edit Profile
        </Link>
      </span>
    </EditBanner>
  ) : null

  const formattedProfile = formatProfileData(profile)
  const { preferredId } = formattedProfile
  const shouldRedirect = email || id !== preferredId || (!email && !id)

  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <PreferredIdUpdater shouldRedirect={shouldRedirect} preferredId={preferredId}>
        <Profile
          profile={formattedProfile}
          publicProfile={!isProfileOwner}
          serviceRoles={serviceRoles}
          remoteIpAddress={remoteIpAddress}
        />
      </PreferredIdUpdater>
    </CommonLayout>
  )
}
