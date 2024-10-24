/* globals promptError,$: false */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import BasicModal from '../BasicModal'
import BasicProfileView from './BasicProfileView'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import ProfilePublications from './ProfilePublications'
import ProfileViewSection from './ProfileViewSection'
import MessagesSection from './MessagesSection'

const ProfilePreviewModal = ({
  profileToPreview,
  setProfileToPreview,
  setLastPreviewedProfileId,
  contentToShow,
  sortFn,
}) => {
  const [publications, setPublications] = useState(null)
  const { accessToken } = useUser()
  const router = useRouter()

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

  useEffect(() => {
    router.events.on('routeChangeStart', () => {
      $('#profile-preview').modal('hide')
    })
  }, [])

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
        moderation={true}
        contentToShow={contentToShow}
      />
      {contentToShow?.includes('publications') && (
        <ProfileViewSection name="publications" title="Publications">
          <ProfilePublications publications={publications} numPublicationsToShow={3} />
        </ProfileViewSection>
      )}
      {contentToShow?.includes('messages') && (
        <ProfileViewSection
          name="messages"
          title={
            <a
              href={`/messages?to=${profileToPreview.preferredEmail}&page=1`}
              target="_blank"
              rel="noreferrer"
            >
              Messages
            </a>
          }
        >
          <MessagesSection email={profileToPreview.preferredEmail} accessToken={accessToken} />
        </ProfileViewSection>
      )}
    </BasicModal>
  )
}

export default ProfilePreviewModal
