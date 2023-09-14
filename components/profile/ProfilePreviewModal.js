/* globals promptError: false */
import { useEffect, useState } from 'react'
import BasicModal from '../BasicModal'
import BasicProfileView from './BasicProfileView'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import RecentPublications from './RecentPublications'
import ProfileViewSection from './ProfileViewSection'

const ProfilePreviewModal = ({
  profileToPreview,
  setProfileToPreview,
  setLastPreviewedProfileId,
  contentToShow,
  sortFn,
}) => {
  const [publications, setPublications] = useState(null)
  const { accessToken } = useUser()

  const loadPublications = async () => {
    let apiRes

    try {
      apiRes = await api.getCombined(
        '/notes',
        {
          'content.authorids': profileToPreview.id,
          sort: 'cdate:desc',
          limit: 1000,
        },
        null,
        { accessToken }
      )
    } catch (error) {
      promptError(error.message)
    }
    if (apiRes.notes) {
      const sortedNotes = sortFn ? sortFn(apiRes.notes) : apiRes.notes
      setPublications(sortedNotes)
    }
  }

  useEffect(() => {
    if (profileToPreview && contentToShow?.includes('publications')) loadPublications()
  }, [profileToPreview?.id])

  if (!profileToPreview) return null
  return (
    <BasicModal
      id="profile-preview"
      primaryButtonText={null}
      cancelButtonText="OK"
      onClose={() => {
        setProfileToPreview(null)
        setLastPreviewedProfileId(profileToPreview.id)
      }}
    >
      <BasicProfileView
        profile={profileToPreview}
        showLinkText={true}
        contentToShow={contentToShow}
        publications={publications}
      />
      {contentToShow?.includes('publications') && (
        <ProfileViewSection name="publications" title="Publications">
          <RecentPublications publications={publications} numPublicationsToShow={3} />
        </ProfileViewSection>
      )}
    </BasicModal>
  )
}

export default ProfilePreviewModal
