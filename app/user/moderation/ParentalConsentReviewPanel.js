import { Col, Flex, Row, Typography } from 'antd'
import { useEffect, useState } from 'react'
import ErrorAlert from '../../../components/ErrorAlert'
import Icon from '../../../components/Icon'
import LoadingSpinner from '../../../components/LoadingSpinner'
import BasicProfileView from '../../../components/profile/BasicProfileView'
import ModerationActions from '../../../components/profile/ModerationActions'
import ProfileEditInvitationEditor from '../../../components/profile/ProfileEditInvitationEditor'
import ProfileEditsSection from '../../../components/profile/ProfileEditsSection'
import ProfileViewSection from '../../../components/profile/ProfileViewSection'
import api from '../../../lib/api-client'
import { acceptProfile, rejectProfile } from '../../../lib/profile-moderation'
import { formatProfileData } from '../../../lib/profiles'
import { formatDateTime } from '../../../lib/utils'
import ActionButton from './ActionButton'
import DocumentViewer from './DocumentViewer'

const profileContentToShow = [
  'names',
  'dob',
  'emails',
  'links',
  'history',
  'relations',
  'expertise',
]

const ConsentDocuments = ({ profileDocuments, onDelete }) => {
  const activeDocuments = profileDocuments.filter((document) => !document.ddate)
  const deletedDocuments = profileDocuments.filter((document) => document.ddate)

  return (
    <Flex vertical gap="small">
      {activeDocuments.map((document) => (
        <Flex key={document.id} vertical gap="small">
          <Flex align="center" gap="small" wrap>
            <Typography.Text type="secondary" style={{ fontSize: '0.85em' }}>
              {[
                document.filename,
                document.tcdate
                  ? formatDateTime(document.tcdate, { second: undefined })
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography.Text>
            <ActionButton
              aria-label={`Delete ${document.filename ?? document.id}`}
              onClick={() => onDelete(document)}
            >
              <span style={{ top: '0px' }}>
                <Icon name="trash" />
              </span>
            </ActionButton>
          </Flex>
          <DocumentViewer document={document} />
        </Flex>
      ))}
      {deletedDocuments.map((document) => (
        <Typography.Text key={document.id} type="secondary" style={{ fontSize: '0.85em' }}>
          <span style={{ textDecoration: 'line-through' }}>
            {document.filename ?? document.id}
          </span>
          {` · deleted ${formatDateTime(document.ddate, { second: undefined })}`}
        </Typography.Text>
      ))}
    </Flex>
  )
}

const ParentalConsentReviewPanel = ({ profileId, invitation, profileStateInvitation }) => {
  const [profile, setProfile] = useState(null)
  const [profileEdits, setProfileEdits] = useState([])
  const [profileDocuments, setProfileDocuments] = useState([])
  const [postedEditCount, setPostedEditCount] = useState(0)
  const [error, setError] = useState(null)

  const isProfileActivatable =
    profile?.state === 'Rejected' || profile?.state === 'Needs Moderation'

  const loadParentalConsentInfo = async () => {
    const getProfileP = api.get('/profiles', { id: profileId })
    const getProfileEditsP = api.get('/profiles/edits', { 'profile.id': profileId })
    const getConsentDocumentsP = api.get('/profile-documents', {
      profileId,
      type: 'parentalConsent',
      trash: true,
    })
    try {
      const [{ profiles }, { edits }, { profileDocuments: documents }] = await Promise.all([
        getProfileP,
        getProfileEditsP,
        getConsentDocumentsP,
      ])
      if (!profiles?.length) throw new Error(`Profile ${profileId} not found`)
      setProfile(formatProfileData(profiles[0], { includePastStates: true }))
      setProfileEdits(edits ?? [])
      setProfileDocuments(documents ?? [])
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    loadParentalConsentInfo()
  }, [])

  const deleteDocument = async (document) => {
    const documentName = document.filename ?? document.id
    const confirmDelete = window.confirm(
      `${documentName} will be deleted. This action cannot be undone.`
    )
    if (!confirmDelete) return
    try {
      await api.delete(`/profile-documents/${document.id}`)
      promptMessage(`${documentName} has been deleted`)
      await loadParentalConsentInfo()
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const handleEditPosted = async () => {
    setPostedEditCount((count) => count + 1)
    await loadParentalConsentInfo()
  }

  const handleAccept = async () => {
    try {
      await acceptProfile(profileId)
      window.location.replace('/user/moderation')
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const handleReject = async (rejectionMessage, labels) => {
    try {
      await rejectProfile(profileId, rejectionMessage, labels)
      window.location.replace('/user/moderation')
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  if (error) return <ErrorAlert error={error} />
  if (!profile) return <LoadingSpinner />

  return (
    <Row gutter={[16, 16]} style={{ padding: '1rem 0' }}>
      <Col xs={24} lg={12}>
        <div style={{ position: 'sticky', top: '1rem' }}>
          <ProfileViewSection title="Parental Consent">
            <ConsentDocuments profileDocuments={profileDocuments} onDelete={deleteDocument} />
          </ProfileViewSection>
        </div>
      </Col>

      <Col xs={24} lg={12}>
        <Flex vertical gap="large">
          <BasicProfileView
            profile={profile}
            moderation={true}
            showLinkText={true}
            contentToShow={profileContentToShow}
            profileEdits={profileEdits}
          />

          <ProfileViewSection title="Profile Edits">
            <ProfileEditsSection profileEdits={profileEdits} />
          </ProfileViewSection>

          {invitation && (
            <ProfileViewSection title="Record Parental Consent">
              <ProfileEditInvitationEditor
                key={postedEditCount}
                invitation={invitation}
                profile={profile}
                onEditPosted={handleEditPosted}
              />
            </ProfileViewSection>
          )}

          {isProfileActivatable && (
            <ModerationActions
              profile={profile}
              profileStateInvitation={profileStateInvitation}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          )}
        </Flex>
      </Col>
    </Row>
  )
}

export default ParentalConsentReviewPanel
