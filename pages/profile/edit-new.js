import Head from 'next/head'
import { useEffect, useState } from 'react'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import GenderSection from '../../components/profile/GenderSection'
import NamesSection from '../../components/profile/NameSection'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import api from '../../lib/api-client'
import { viewProfileLink } from '../../lib/banner-links'
import { formatProfileData } from '../../lib/profiles'
import '../../styles/pages/profile-edit.less'
import EmailsSection from '../../components/profile/EmailsSection'
import PersonalLinksSection from '../../components/profile/PersonalLinksSection'
import EducationHisotrySection from '../../components/profile/EducationHisotrySection'
import RelationsSection from '../../components/profile/RelationsSection'

const profileEditNew = ({ appContext }) => {
  const { accessToken } = useLoginRedirect()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const { setBannerContent } = appContext
  const [dropdownOptions, setDropdownOptions] = useState(null)
  const relations = dropdownOptions?.prefixedRelations
  const relationReaders = dropdownOptions?.relationReaders
  const positions = dropdownOptions?.prefixedPositions
  const institutions = dropdownOptions?.institutions

  const loadProfile = async () => {
    try {
      const { profiles } = await api.get('/profiles', {}, { accessToken })
      if (profiles?.length > 0) {
        setProfile(formatProfileData(profiles[0]))
      } else {
        setError({ statusCode: 404, message: 'Profile not found' })
      }
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  useEffect(() => {
    if (!accessToken) return
    setBannerContent(viewProfileLink())
    loadProfile()
  }, [accessToken])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const result = await api.get('/profiles/options')
        console.log(result)
        setDropdownOptions(result)
      } catch (apiError) {
        setDropdownOptions({})
      }
    }
    loadOptions()
  }, [])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  if (!profile) return <LoadingSpinner />

  return (
    <div>
      <Head>
        <title key="title">Edit Profile | OpenReview</title>
      </Head>
      <header>
        <h1>Edit Profile</h1>
      </header>
      <div className="profile-edit-container">
        {console.log(profile)}
        <NamesSection profileNames={profile?.names} />
        <GenderSection profileGender={profile?.gender} />
        <EmailsSection profileEmails={profile?.emails} profileId={profile?.id} />
        <PersonalLinksSection profileLinks={profile?.links} />
        <EducationHisotrySection
          profileHistory={profile?.history}
          positions={positions}
          institutions={institutions}
        />
        <RelationsSection
          profileRelation={profile?.relations}
          relations={relations}
          relationReaders={relationReaders}
        />
        <button type="button" className="btn">Register for OpenReview</button>
        <button type="button" className="btn">Cancel</button>
      </div>
    </div>
  )
}

profileEditNew.bodyClass = 'profile-edit'
export default profileEditNew
