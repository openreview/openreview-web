import { useEffect } from 'react'
import LegacyProfileEditor from '../../components/LegacyProfileEditor'
import DblpImportModal from '../../components/DblpImportModal'
import api from '../../lib/api-client'
import { auth } from '../../lib/auth'
import { formatProfileData } from '../../lib/profiles'
import { referrerLink } from '../../lib/banner-links'

// Page Styles
import '../../styles/pages/profile-edit.less'

function ProfileEdit({ profile, appContext }) {
  const { setBannerContent, clientJsLoading } = appContext
  const profileNames = profile.names.map(name => (
    name.middle ? `${name.first} ${name.middle} ${name.last}` : `${name.first} ${name.last}`
  ))

  useEffect(() => {
    if (clientJsLoading) return

    setBannerContent(referrerLink(`[public profile](/profile?id=${profile.id})`))
  }, [clientJsLoading])

  return (
    <div>
      <header>
        <h1>Edit Profile</h1>
      </header>

      <LegacyProfileEditor profile={profile} loading={clientJsLoading} />

      <DblpImportModal profileId={profile.id} profileNames={profileNames} />
    </div>
  )
}

ProfileEdit.getInitialProps = async (ctx) => {
  const { token } = auth(ctx)
  const profileRes = await api.get('/profiles', {}, { accessToken: token })
  if (!profileRes.profiles?.length) {
    return { statusCode: 404, message: 'Profile not found' }
  }

  const profileFormatted = formatProfileData(profileRes.profiles[0])
  return {
    profile: profileFormatted,
  }
}

ProfileEdit.bodyClass = 'profile-edit'

export default ProfileEdit
