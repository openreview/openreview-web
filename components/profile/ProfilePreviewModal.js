/* globals promptError,$: false */
import { useEffect, useState } from 'react'
import BasicProfileView from './BasicProfileView'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import ProfilePublications from './ProfilePublications'
import ProfileViewSection from './ProfileViewSection'
import MessagesSection from './MessagesSection'
import { getRejectionReasons } from '../../lib/utils'
import ProfileTag from '../ProfileTag'
import ErrorAlert from '../ErrorAlert'
import { Button, Flex, Input, Modal, Select, Space } from 'antd'

const ProfilePreviewModal = ({
  profileToPreview,
  setProfileToPreview,
  contentToShow,
  sortFn,
  showNextProfile,
  acceptUser,
  rejectUser,
}) => {
  const [publications, setPublications] = useState(null)
  const [tags, setTags] = useState([])
  const { accessToken } = useUser()
  const [rejectionMessage, setRejectionMessage] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReasons, setRejectReasons] = useState([])
  const [error, setError] = useState(null)
  const [tagLabel, setTagLabel] = useState([])
  const tagInvitationOptions = [
    {
      label: 'General Moderation Tag',
      value: `${process.env.SUPER_USER}/Support/-/Profile_Moderation_Label`,
    },
    {
      label: 'Vouched by Tag',
      value: `${process.env.SUPER_USER}/Support/-/Vouch`,
    },
  ]
  const [tagInvitation, setTagInvitation] = useState(tagInvitationOptions[0].value)
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
    } catch (apiError) {
      setError(apiError)
    }
  }

  const addTag = async (tagLabel) => {
    const isVouchInvitation = tagInvitation === `${process.env.SUPER_USER}/Support/-/Vouch`

    try {
      await api.post('/tags', {
        profile: profileToPreview.id,
        ...(!isVouchInvitation && { label: tagLabel }),
        signature: isVouchInvitation ? tagLabel : `${process.env.SUPER_USER}/Support`,
        invitation: tagInvitation,
      })
      await loadTags()
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    setRejectionMessage('')
    setIsRejecting(false)
    setTags([])
    setTagInvitation(tagInvitationOptions[0].value)
    setError(null)
    const currentInstitutionName = profileToPreview?.history?.find(
      (p) => !p.end || p.end >= new Date().getFullYear()
    )?.institution?.name
    setRejectReasons(getRejectionReasons(currentInstitutionName))
    if (profileToPreview && contentToShow?.includes('publications')) loadPublications()
    if (profileToPreview && contentToShow?.includes('tags')) loadTags()
  }, [profileToPreview?.id])

  if (!profileToPreview) return null
  return (
    <Modal
      footer={null}
      mask={{ blur: false }}
      centered={true}
      title="Profile Preview"
      open={profileToPreview}
      onCancel={() => setProfileToPreview(null)}
      closable={true}
      zIndex={1032}
      width={{
        xs: '90%',
        sm: '70%',
      }}
    >
      <Flex vertical gap="small">
        {error && <ErrorAlert error={error} />}
        <BasicProfileView
          profile={profileToPreview}
          showLinkText={true}
          moderation={true}
          contentToShow={contentToShow}
        />
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
            <MessagesSection
              email={profileToPreview.preferredEmail}
              accessToken={accessToken}
              rejectMessagesOnly
            />
          </ProfileViewSection>
        )}
        <Flex vertical gap="small">
          <Space wrap={true}>
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
                options={tagInvitationOptions}
                value={tagInvitation}
                onChange={(e) => setTagInvitation(e)}
              />
              <Select
                allowClear
                showSearch={false}
                style={{ flex: 1, minWidth: 0 }}
                mode="tags"
                notFoundContent={null}
                value={null}
                placeholder={
                  tagInvitation === `${process.env.SUPER_USER}/Support/-/Vouch`
                    ? 'enter tilde id of the user vouching for this user'
                    : 'select or create tag label'
                }
                options={
                  tagInvitation === `${process.env.SUPER_USER}/Support/-/Vouch`
                    ? []
                    : [
                        { label: 'require vouch', value: 'require vouch' },
                        { label: 'potential spam', value: 'potential spam' },
                      ]
                }
                onChange={(values) => {
                  addTag(values[0])
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
            <Flex justify="space-between" wrap>
              <Button type="primary" onClick={() => showNextProfile(profileToPreview.id)}>
                Skip
              </Button>

              <Space.Compact>
                <Button
                  type="primary"
                  onClick={() => {
                    showNextProfile(profileToPreview.id)
                    acceptUser(profileToPreview.id)
                  }}
                >
                  Accept
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    setIsRejecting(true)
                  }}
                >
                  Show Reject Options
                </Button>
                <Button
                  type="primary"
                  onClick={async () => {
                    await rejectUser(rejectionReasons[0]?.rejectionText, profileToPreview.id)
                    showNextProfile(profileToPreview.id)
                  }}
                >
                  Reject
                </Button>
              </Space.Compact>
            </Flex>
          )}
          {isRejecting && (
            <Flex vertical gap="small" align="flex-start">
              <Select
                allowClear
                style={{ width: '100%' }}
                placeholder="Choose a common reject reason..."
                options={rejectionReasons}
                onChange={(value) => {
                  const rejectOption = rejectionReasons.find((r) => r.value === value)
                  setRejectionMessage(rejectOption?.rejectionText || '')
                }}
              />
              <Space wrap>
                <Button
                  type="primary"
                  onClick={() =>
                    updateMessageForPastRejectProfile(
                      "Submitting invalid info is a violation of OpenReview's Terms and Conditions (https://openreview.net/legal/terms) which may result in terminating your access to the system."
                    )
                  }
                >
                  Add Invalid Info Warning
                </Button>
                <Button
                  type="primary"
                  onClick={() =>
                    updateMessageForPastRejectProfile(
                      'If invalid info is submitted again, your email will be blocked.'
                    )
                  }
                >
                  Add Last Notice Warning
                </Button>
              </Space>
              <Input.TextArea
                autoSize={{ minRows: 5 }}
                value={rejectionMessage}
                onChange={(e) => {
                  setRejectionMessage(e.target.value)
                }}
              />
              <Button
                type="primary"
                onClick={async () => {
                  await rejectUser(rejectionMessage, profileToPreview.id)
                  showNextProfile(profileToPreview.id)
                }}
              >
                Reject
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Modal>
  )
}

export default ProfilePreviewModal
