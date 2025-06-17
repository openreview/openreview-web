/* globals promptError,$: false */
import { useEffect, useState } from 'react'
import BasicModal from '../BasicModal'
import BasicProfileView from './BasicProfileView'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import ProfilePublications from './ProfilePublications'
import ProfileViewSection from './ProfileViewSection'
import MessagesSection from './MessagesSection'
import Dropdown, { CreatableDropdown } from '../Dropdown'
import { getRejectionReasons, prettyInvitationId, prettyId } from '../../lib/utils'
import CheckableTag from '../CheckableTag'

const ProfilePreviewModal = ({
  profileToPreview,
  setProfileToPreview,
  setLastPreviewedProfileId,
  contentToShow,
  sortFn,
  showNextProfile,
  acceptUser,
  setProfileToReject,
  rejectUser,
}) => {
  const [publications, setPublications] = useState(null)
  const [tags, setTags] = useState([])
  const { accessToken } = useUser()
  const [rejectionMessage, setRejectionMessage] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReasons, setRejectReasons] = useState([])
  const needsModeration = profileToPreview?.state === 'Needs Moderation'

  const updateMessageForPastRejectProfile = (messageToAdd) => {
    setRejectionMessage((p) => `${messageToAdd}\n\n${p}`)
  }

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

  const loadTags = async () => {
    if (profileToPreview.state === 'Merged') return
    try {
      const result = await api.get('/tags', {
        profile: profileToPreview.id,
      })
      setTags(result.tags)
    } catch (error) {
      /* empty */
    }
  }

  const deleteTag = async (tag) => {
    try {
      await api.post('/tags', {
        id: tag.id,
        ddate: Date.now(),
        profile: tag.profile,
        label: tag.label,
        signature: tag.signature,
        invitation: tag.invitation,
      })
      await loadTags()
    } catch (error) {
      promptError(error.message)
    }
  }

  const addTag = async (tagLabel) => {
    try {
      await api.post('/tags', {
        profile: profileToPreview.id,
        label: tagLabel,
        signature: `${process.env.SUPER_USER}/Support`,
        invitation: `${process.env.SUPER_USER}/Support/-/Profile_Moderation_Label`,
      })
      await loadTags()
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    setRejectionMessage('')
    setIsRejecting(false)
    setTags([])
    const currentInstitutionName = profileToPreview?.history?.find(
      (p) => !p.end || p.end >= new Date().getFullYear()
    )?.institution?.name
    setRejectReasons(getRejectionReasons(currentInstitutionName))
    if (profileToPreview && contentToShow?.includes('publications')) loadPublications()
    if (profileToPreview && contentToShow?.includes('tags')) loadTags()
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
      options={{ hideFooter: !!needsModeration }}
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
              href={`/messages?to=${profileToPreview.preferredEmail}`}
              target="_blank"
              rel="noreferrer"
            >
              Messages
            </a>
          }
        >
          <MessagesSection
            email={profileToPreview.preferredEmail}
            accessToken={accessToken}
            rejectMessagesOnly
          />
        </ProfileViewSection>
      )}
      <div className="moderation-actions">
        <div className={`tags-container ${tags.length ? 'mb-2' : ''}`}>
          {tags.map((tag, index) => (
            <CheckableTag
              key={index}
              label={`${prettyInvitationId(tag.invitation)}${tag.label !== undefined ? ` "${tag.label}"` : ''}${tag.weight !== undefined ? ` (${tag.weight})` : ''}${!tag.invitation.startsWith(tag.signature) ? '' : ` by ${prettyId(tag.signature)}`}`}
              checked={true}
              onDelete={() => deleteTag(tag)}
            />
          ))}
        </div>
        {profileToPreview.state !== 'Merged' && (
          <div className="mb-2">
            <CreatableDropdown
              hideArrow
              isClearable
              classNamePrefix="tags-dropdown"
              placeholder="tag the profile"
              options={[
                { label: 'require vouch', value: 'require vouch' },
                { label: 'potential spam', value: 'potential spam' },
              ]}
              value={null}
              onChange={(e) => {
                if (!e) return
                addTag(e.value)
              }}
            />
          </div>
        )}
        {needsModeration && (
          <div className="moderation-actions-buttons">
            <div className="pull-left">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => showNextProfile(profileToPreview.id)}
              >
                Skip
              </button>
            </div>
            <div>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  showNextProfile(profileToPreview.id)
                  acceptUser(profileToPreview.id)
                }}
              >
                Accept
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setIsRejecting(true)
                  setProfileToReject(profileToPreview)
                }}
              >
                Show Reject Options
              </button>
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  await rejectUser(rejectionReasons[0]?.rejectionText, profileToPreview.id)
                  showNextProfile(profileToPreview.id)
                }}
              >
                Reject
              </button>
            </div>
          </div>
        )}
        {isRejecting && (
          <div className="form-group form-rejection mt-2">
            <Dropdown
              name="rejection-reason"
              instanceId="rejection-reason"
              placeholder="Choose a common reject reason..."
              options={rejectionReasons}
              onChange={(p) => {
                setRejectionMessage(p?.rejectionText || '')
              }}
              isClearable
            />
            <div>
              <button
                className="btn btn-xs mr-2"
                onClick={() =>
                  updateMessageForPastRejectProfile(
                    "Submitting invalid info is a violation of OpenReview's Terms and Conditions (https://openreview.net/legal/terms) which may result in terminating your access to the system."
                  )
                }
              >
                Add Invalid Info Warning
              </button>
              <button
                className="btn btn-xs"
                onClick={() =>
                  updateMessageForPastRejectProfile(
                    'If invalid info is submitted again, your email will be blocked.'
                  )
                }
              >
                Add Last Notice Warning
              </button>
            </div>
            <textarea
              name="message"
              className="form-control mt-2"
              rows="10"
              value={rejectionMessage}
              onChange={(e) => {
                setRejectionMessage(e.target.value)
              }}
            />
            <button
              type="button"
              className="btn"
              onClick={async () => {
                await rejectUser(rejectionMessage, profileToPreview.id)
                showNextProfile(profileToPreview.id)
              }}
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </BasicModal>
  )
}

export default ProfilePreviewModal
