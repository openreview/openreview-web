import { redirect } from 'next/navigation'
import Link from 'next/link'
import serverAuth, { isSuperUser } from '../auth'
import api from '../../lib/api-client'
import ErrorDisplay from '../../components/ErrorDisplay'
import Profile from './Profile'
import { formatProfileData } from '../../lib/profiles'
import CommonLayout from '../CommonLayout'
import EditBanner from '../../components/EditBanner'

export const dynamic = 'force-dynamic'

export default async function page({ searchParams }) {
  const { user, token } = await serverAuth()
  const { id, email } = await searchParams
  if (!user && !id && !email) redirect('/login')
  if (!user && id) redirect(`/login?redirect=${encodeURIComponent(`/profile?id=${id}`)}`)
  if (!user && email)
    redirect(`/login?redirect=${encodeURIComponent(`/profile?email=${email}`)}`)

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

  if (shouldRedirect) redirect(`/profile?id=${preferredId}`)
  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <Profile profile={formattedProfile} publicProfile={id || email} />
    </CommonLayout>
  )
}
