import { Button, Flex, Modal, Select, Space, Tooltip } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { deleteIdentityDocuments } from '../../lib/profile-moderation'
import { formatDateTime, getDeviceFromUserAgent, inflect } from '../../lib/utils'
import ErrorAlert from '../ErrorAlert'
import ProfileTag from '../ProfileTag'
import BasicProfileView from './BasicProfileView'
import { IdentityDocumentsSection, ParentalConsentSection } from './IdentityDocumentsSection'
import MessagesSection from './MessagesSection'
import ModerationActions from './ModerationActions'
import PastStatesSection from './PastStatesSection'
import ProfileEditsSection from './ProfileEditsSection'
import ProfilePublications from './ProfilePublications'
import ProfileViewSection from './ProfileViewSection'

dayjs.extend(relativeTime)

const ProfilePreviewModal = ({
  profileToPreview,
  setProfileToPreview,
  contentToShow,
  sortFn,
  showNextProfile,
  showPreviousProfile,
  acceptUser,
  rejectUser,
  profileStateInvitation,
}) => {
  const [publications, setPublications] = useState(null)
  const [tags, setTags] = useState([])
  const [profileDocuments, setProfileDocuments] = useState(null)
  const [profileEdits, setProfileEdits] = useState(null)
  const [loginActivity, setLoginActivity] = useState(null)
  const [error, setError] = useState(null)
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const [openTagOptions, setOpenTagOptions] = useState(false)
  const router = useRouter()

  const needsModeration = profileToPreview?.state === 'Needs Moderation'
  const isProfileActivatable = profileToPreview?.state === 'Rejected' || needsModeration
  const showLoginActivity =
    loginActivity &&
    loginActivity.notifyUnusualLogins !== false &&
    loginActivity.knownLocations?.length > 0

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
        null
      )
    } catch (apiError) {
      promptError(apiError)
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
    } catch (apiError) {
      setError(apiError)
    }
  }

  const loadIdentityDocuments = async () => {
    try {
      const { profileDocuments } = await api.get('/profile-documents', {
        profileId: profileToPreview.id,
        trash: true,
      })
      setProfileDocuments(profileDocuments)
    } catch (apiError) {
      setError(apiError)
    }
  }

  const deleteAllIdentityDocuments = async () => {
    const { deletedCount } = await deleteIdentityDocuments(profileToPreview.id)
    promptMessage(
      `${inflect(deletedCount, 'document has', 'documents have', true)} been deleted`
    )
    await loadIdentityDocuments()
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllIdentityDocuments()
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const handleActivateWithIdCheck = async () => {
    const activated = await acceptUser(profileToPreview.id, false)
    if (!activated) return
    try {
      await deleteAllIdentityDocuments()
      showNextProfile(profileToPreview.id)
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const loadProfileEdits = async () => {
    try {
      const { edits } = await api.get('/profiles/edits', {
        'profile.id': profileToPreview.id,
      })
      setProfileEdits(edits ?? [])
    } catch (apiError) {
      setError(apiError)
    }
  }

  const loadLoginActivity = async () => {
    try {
      const result = await api.get('/profiles/activity', { id: profileToPreview.id })
      setLoginActivity(result)
    } catch (apiError) {
      setError(apiError)
    }
  }

  const deleteTag = async (tag) => {
    setIsLoadingTags(true)
    try {
      await api.post('/tags', {
        id: tag.id,
        ddate: Date.now(),
        profile: tag.profile,
        label: tag.label,
        readers: tag.readers,
        signature: tag.signature,
        invitation: tag.invitation,
      })
      await loadTags()
    } catch (apiError) {
      setError(apiError)
    }
    setIsLoadingTags(false)
  }

  const addTag = async (tagLabel) => {
    setIsLoadingTags(true)
    try {
      await api.post('/tags', {
        profile: profileToPreview.id,
        label: tagLabel,
        signature: `${process.env.SUPER_USER}/Support`,
        invitation: `${process.env.SUPER_USER}/Support/-/Profile_Moderation_Label`,
      })
      await loadTags()
    } catch (apiError) {
      setError(apiError)
    }
    setIsLoadingTags(false)
  }

  useEffect(() => {
    if (!profileToPreview || !needsModeration) return undefined
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        showNextProfile(profileToPreview.id)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        showPreviousProfile(profileToPreview.id)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [profileToPreview, needsModeration])

  useEffect(() => {
    setTags([])
    setProfileEdits(null)
    setLoginActivity(null)
    setError(null)
    if (profileToPreview) loadProfileEdits()
    if (profileToPreview && contentToShow?.includes('publications')) loadPublications()
    if (profileToPreview && contentToShow?.includes('tags')) loadTags()
    if (profileToPreview && contentToShow?.includes('identityDocuments'))
      loadIdentityDocuments()
    if (profileToPreview && contentToShow?.includes('loginActivity')) loadLoginActivity()
  }, [profileToPreview?.id])

  if (!profileToPreview) return null
  return (
    <Modal
      footer={[
        <Button key="ok" size="large" onClick={() => setProfileToPreview(null)}>
          OK
        </Button>,
      ]}
      mask={{ blur: false }}
      centered={true}
      open={profileToPreview}
      onCancel={() => setProfileToPreview(null)}
      closable={true}
      zIndex={1032}
      width={{
        xs: '90%',
        sm: '70%',
      }}
      maskTransitionName=""
      styles={{ wrapper: { overscrollBehavior: 'contain' } }}
    >
      <Flex vertical gap="small">
        {error && <ErrorAlert error={error} />}
        <BasicProfileView
          profile={profileToPreview}
          showLinkText={true}
          moderation={true}
          contentToShow={contentToShow}
          profileEdits={profileEdits ?? []}
        />
        {contentToShow?.includes('loginActivity') && showLoginActivity && (
          <ProfileViewSection title="Login Activity">
            <Flex vertical>
              {loginActivity.knownLocations.map((location, index) => (
                <span key={index}>
                  {location.city}
                  {' - '}
                  <Tooltip title={formatDateTime(location.lastSeen)}>
                    <span>{dayjs(location.lastSeen).fromNow()}</span>
                  </Tooltip>
                  {' - '}
                  {getDeviceFromUserAgent(location.userAgent)}
                </span>
              ))}
            </Flex>
          </ProfileViewSection>
        )}
        {contentToShow?.includes('publications') && (
          <ProfileViewSection title="Publications">
            <ProfilePublications
              publications={publications}
              numPublicationsToShow={3}
              openNoteInNewWindow={true}
            />
          </ProfileViewSection>
        )}
        {contentToShow?.includes('messages') && (
          <ProfileViewSection
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
            <MessagesSection email={profileToPreview.preferredEmail} rejectMessagesOnly />
          </ProfileViewSection>
        )}
        {contentToShow?.includes('profileEdits') &&
          profileEdits &&
          (profileEdits.length > 0 ? (
            <ProfileViewSection title="Profile Edits">
              <ProfileEditsSection
                profileEdits={profileEdits}
                onEditUpdated={(updatedEdit) =>
                  setProfileEdits((edits) =>
                    edits.map((p) => (p.id === updatedEdit.id ? updatedEdit : p))
                  )
                }
              />
            </ProfileViewSection>
          ) : (
            profileToPreview.pastStates && (
              <ProfileViewSection title="Past States">
                <PastStatesSection
                  email={profileToPreview.preferredEmail}
                  pastStates={profileToPreview.pastStates}
                />
              </ProfileViewSection>
            )
          ))}
        {contentToShow?.includes('identityDocuments') && (
          <>
            {profileDocuments?.some((document) => document.type === 'parentalConsent') && (
              <ProfileViewSection title="Parental Consent">
                <Flex vertical gap="small" align="flex-start">
                  <ParentalConsentSection
                    profileDocuments={profileDocuments}
                    loadIdentityDocuments={loadIdentityDocuments}
                  />
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                      setProfileToPreview(null)
                      router.push(
                        `/user/moderation?tab=documents&consent=${profileToPreview.id}`
                      )
                    }}
                  >
                    Review Parental Consent
                  </Button>
                </Flex>
              </ProfileViewSection>
            )}
            {profileDocuments?.some((document) => document.type !== 'parentalConsent') && (
              <ProfileViewSection title="Identity Documents">
                <IdentityDocumentsSection
                  profileId={profileToPreview.id}
                  profileDocuments={profileDocuments}
                  isProfileActivatable={isProfileActivatable}
                  loadIdentityDocuments={loadIdentityDocuments}
                  onDeleteAll={handleDeleteAll}
                  onActivateWithIdCheck={handleActivateWithIdCheck}
                />
              </ProfileViewSection>
            )}
          </>
        )}
        <Flex vertical gap="small">
          <Space wrap={true} style={isLoadingTags ? { opacity: 0.5 } : {}}>
            {tags.map((tag, index) => (
              <ProfileTag
                key={index}
                tag={tag}
                onDelete={() => deleteTag(tag)}
                showProfileId={false}
              />
            ))}
          </Space>
          {profileToPreview.state !== 'Merged' && (
            <Flex>
              <Select
                allowClear
                showSearch={false}
                style={{ flex: 1, minWidth: 0 }}
                mode="tags"
                notFoundContent={null}
                value={null}
                open={openTagOptions}
                onOpenChange={setOpenTagOptions}
                placeholder="select or create tag label"
                options={[
                  { label: 'require vouch', value: 'require vouch' },
                  { label: 'user sent document', value: 'user sent document' },
                  { label: 'potential spam', value: 'potential spam' },
                ]}
                getPopupContainer={(triggerNode) => triggerNode.parentElement}
                onChange={(values) => {
                  addTag(values[0])
                  setOpenTagOptions(false)
                }}
                onInputKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  e.stopPropagation()
                }}
              />
            </Flex>
          )}
          {needsModeration && (
            <ModerationActions
              key={profileToPreview.id}
              profile={profileToPreview}
              profileStateInvitation={profileStateInvitation}
              onSkip={() => showNextProfile(profileToPreview.id)}
              onAccept={() => {
                showNextProfile(profileToPreview.id)
                acceptUser(profileToPreview.id, false)
              }}
              onReject={async (message, labels) => {
                await rejectUser(message, profileToPreview.id, labels)
                showNextProfile(profileToPreview.id)
              }}
            />
          )}
        </Flex>
      </Flex>
    </Modal>
  )
}

export default ProfilePreviewModal
