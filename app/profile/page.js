import { redirect } from 'next/navigation'
import Link from 'next/link'
import serverAuth, { isSuperUser } from '../auth'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import ErrorDisplay from '../../components/ErrorDisplay'
import Profile from './Profile'
import { formatProfileData } from '../../lib/profiles'
import CommonLayout from '../CommonLayout'
import EditBanner from '../../components/EditBanner'
import ProfileOwnerRedirect from './ProfileOwnerRedirect'

export const dynamic = 'force-dynamic'

export default async function page({ searchParams }) {
  const { user, token } = await serverAuth()
  const { id, email } = await searchParams
  if (!user && !id && !email) redirect('/login')
  // if (searchParams.id)
  //   redirect(`/login?redirect=${encodeURIComponent(`/profile?id=${searchParams.id}`)}`)
  // if (searchParams.email)
  //   redirect(`/login?redirect=${encodeURIComponent(`/profile?email=${searchParams.email}`)}`)
  const isProfileOwner =
    (id && user?.profile?.usernames?.includes(id)) ||
    (email && user?.profile?.emails?.includes(email)) ||
    id === '' ||
    email === '' ||
    (!id && !email)

  let profileResult
  try {
    profileResult = await api.get('/profiles', isProfileOwner ? {} : id ? { id } : { email }, {
      accessToken: token,
    })
  } catch (error) {
    return (
      <CommonLayout banner={null} editBanner={null}>
        <ErrorDisplay statusCode={404} message="Profile not found" />
      </CommonLayout>
    )
  }
  const profile = profileResult?.profiles?.[0]
  if (!profile)
    return (
      <CommonLayout banner={null} editBanner={null}>
        <ErrorDisplay
          statusCode={404}
          message={`The profile ${id || email} does not exist or it's not public`}
        />
      </CommonLayout>
    )
  if (!profile.active && !isSuperUser(user)) {
    return (
      <CommonLayout banner={null} editBanner={null}>
        <ErrorDisplay statusCode={400} message={`The profile ${id || email} is not active`} />
      </CommonLayout>
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

  const shouldRedirect = email || id !== profile.preferredId || (!email && !id)
  const formattedProfile = formatProfileData(profile)
  const preferredId = formattedProfile.preferredId
  return (
    <CommonLayout banner={null} editBanner={editBanner}>
      <ProfileOwnerRedirect shouldRedirect={shouldRedirect} preferredId={preferredId} />
      <Profile profile={formattedProfile} publicProfile={id || email} />
    </CommonLayout>
  )
}
