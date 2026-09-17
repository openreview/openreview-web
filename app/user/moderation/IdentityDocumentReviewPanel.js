import { Col, Collapse, Flex, Image, Row, Select, Typography } from 'antd'
import { useEffect, useState } from 'react'
import ErrorAlert from '../../../components/ErrorAlert'
import Icon from '../../../components/Icon'
import ImageViewer from '../../../components/ImageViewer'
import LoadingSpinner from '../../../components/LoadingSpinner'
import BasicProfileView from '../../../components/profile/BasicProfileView'
import { IdentityDocumentActions } from '../../../components/profile/IdentityDocumentsSection'
import ModerationActions from '../../../components/profile/ModerationActions'
import ProfileEditInvitationEditor from '../../../components/profile/ProfileEditInvitationEditor'
import ProfileViewSection from '../../../components/profile/ProfileViewSection'
import api from '../../../lib/api-client'
import {
  acceptProfile,
  deleteIdentityDocuments,
  rejectProfile,
} from '../../../lib/profile-moderation'
import { formatProfileData } from '../../../lib/profiles'
import { formatDateTime, inflect, prettyInvitationId, prettyList } from '../../../lib/utils'
import ActionButton from './ActionButton'

const profileContentToShow = [
  'names',
  'dob',
  'emails',
  'links',
  'history',
  'relations',
  'expertise',
]

const documentViewerHeight = '70vh'

const DocumentReader = ({ profileDocuments, onDelete }) => {
  if (!profileDocuments) return <LoadingSpinner inline />
  if (!profileDocuments.length) return <p className="empty-message">No documents</p>

  const firstAvailable = profileDocuments.find((document) => !document.ddate)

  return (
    <Image.PreviewGroup>
      <Collapse
        ghost
        size="small"
        defaultActiveKey={firstAvailable ? [firstAvailable.id] : []}
        styles={{ body: { paddingInline: 0 } }}
        items={profileDocuments.map((document) => {
          const src = `${process.env.API_V2_URL}/profile-documents/${document.id}`
          const isDeleted = Boolean(document.ddate)
          const viewer =
            document.extension === 'pdf' ? (
              <iframe
                title={document.filename ?? document.id}
                src={src}
                style={{
                  width: '100%',
                  height: documentViewerHeight,
                  border: '1px solid #f0f0f0',
                  borderRadius: 4,
                  background: '#fff',
                }}
              />
            ) : (
              <ImageViewer
                src={src}
                alt={document.filename ?? 'Identity document'}
                height={documentViewerHeight}
              />
            )
          return {
            key: document.id,
            showArrow: !isDeleted,
            collapsible: isDeleted ? 'disabled' : undefined,
            forceRender: !isDeleted,
            label: (
              <Flex align="center" gap="small" wrap>
                <Typography.Text type="secondary" style={{ fontSize: '0.85em' }}>
                  <span style={isDeleted ? { textDecoration: 'line-through' } : undefined}>
                    {[
                      document.filename,
                      document.type,
                      document.tcdate
                        ? formatDateTime(document.tcdate, { second: undefined })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {isDeleted &&
                    ` · deleted ${formatDateTime(document.ddate, { second: undefined })}`}
                </Typography.Text>
                {!isDeleted && (
                  <span role="presentation" onClick={(e) => e.stopPropagation()}>
                    <ActionButton
                      aria-label={`Delete ${document.filename ?? document.id}`}
                      onClick={() => onDelete(document)}
                    >
                      <span style={{ top: '0px' }}>
                        <Icon name="trash" />
                      </span>
                    </ActionButton>
                  </span>
                )}
              </Flex>
            ),
            children: isDeleted ? null : viewer,
          }
        })}
      />
    </Image.PreviewGroup>
  )
}

const PostedAssertions = ({ profileEdits }) => {
  if (!profileEdits.length) return <p className="empty-message">Nothing verified yet</p>
  return (
    <Flex vertical gap={4}>
      {profileEdits.map((edit) => (
        <div key={edit.id}>
          <strong>{prettyInvitationId(edit.invitation)}</strong>
          {' — '}
          <small style={{ color: '#757575' }}>
            {[
              edit.signatures?.length ? prettyList(edit.signatures) : null,
              edit.tcdate ? formatDateTime(edit.tcdate, { second: undefined }) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </small>
        </div>
      ))}
    </Flex>
  )
}

const IdentityDocumentReviewPanel = ({
  profileId,
  profileEditInvitations,
  reloadProfileList,
}) => {
  const [profile, setProfile] = useState(null)
  const [profileEdits, setProfileEdits] = useState([])
  const [profileDocuments, setProfileDocuments] = useState(null)
  const [selectedInvitationId, setSelectedInvitationId] = useState(null)
  const [error, setError] = useState(null)

  const selectedInvitation = profileEditInvitations.find((p) => p.id === selectedInvitationId)
  const isProfileActivatable =
    profile?.state === 'Rejected' || profile?.state === 'Needs Moderation'

  const loadProfile = async () => {
    try {
      const { profiles } = await api.get('/profiles', { id: profileId })
      if (!profiles?.length) throw new Error(`Profile ${profileId} not found`)
      setProfile(formatProfileData(profiles[0], { includePastStates: true }))
    } catch (apiError) {
      setError(apiError)
    }
  }

  const loadProfileEdits = async () => {
    try {
      const { edits } = await api.get('/profiles/edits', { 'profile.id': profileId })
      setProfileEdits(edits ?? [])
    } catch (apiError) {
      setError(apiError)
    }
  }

  const loadIdentityDocuments = async () => {
    try {
      const { profileDocuments: documents } = await api.get('/profile-documents', {
        profileId,
        trash: true,
      })
      setProfileDocuments(documents ?? [])
    } catch (apiError) {
      setError(apiError)
    }
  }

  useEffect(() => {
    setError(null)
    loadProfile()
    loadProfileEdits()
    loadIdentityDocuments()
  }, [profileId])

  const identityDocuments = profileDocuments?.filter(
    (document) => document.type !== 'parentalConsent'
  )

  const deleteDocument = async (document) => {
    const documentName = document.filename ?? document.id
    const confirmDelete = window.confirm(
      `${documentName} will be deleted. This action cannot be undone.`
    )
    if (!confirmDelete) return
    try {
      await api.delete(`/profile-documents/${document.id}`)
      promptMessage(`${documentName} has been deleted`)
      await loadIdentityDocuments()
      reloadProfileList()
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const handleAccept = async () => {
    try {
      await acceptProfile(profile.id)
      await loadProfile()
      reloadProfileList()
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const handleReject = async (rejectionMessage) => {
    try {
      await rejectProfile(profile.id, rejectionMessage)
      await loadProfile()
      reloadProfileList()
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const deleteAllIdentityDocuments = async () => {
    const { deletedCount } = await deleteIdentityDocuments(profileId)
    promptMessage(
      `${inflect(deletedCount, 'document has', 'documents have', true)} been deleted`
    )
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllIdentityDocuments()
      await loadIdentityDocuments()
      reloadProfileList()
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const handleActivateWithIdCheck = async () => {
    try {
      await acceptProfile(profileId)
      await deleteAllIdentityDocuments()
      await Promise.all([loadProfile(), loadIdentityDocuments()])
      reloadProfileList()
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  return (
    <Row gutter={[16, 16]} style={{ padding: '1rem 0' }}>
      <Col xs={24} lg={12}>
        <div style={{ position: 'sticky', top: '1rem' }}>
          <ProfileViewSection title="Identity Documents">
            <Flex vertical gap="large">
              <DocumentReader profileDocuments={identityDocuments} onDelete={deleteDocument} />
              <IdentityDocumentActions
                profileId={profileId}
                identityDocuments={identityDocuments}
                isProfileActivatable={isProfileActivatable}
                onDeleteAll={handleDeleteAll}
                onActivateWithIdCheck={handleActivateWithIdCheck}
              />
            </Flex>
          </ProfileViewSection>
        </div>
      </Col>

      <Col xs={24} lg={12}>
        <Flex vertical gap="large">
          {error && <ErrorAlert error={error} />}

          {profile ? (
            <BasicProfileView
              profile={profile}
              moderation={true}
              showLinkText={true}
              contentToShow={profileContentToShow}
              profileEdits={profileEdits}
            />
          ) : (
            <LoadingSpinner inline />
          )}

          <ProfileViewSection title="Profile Edits">
            <PostedAssertions profileEdits={profileEdits} />
          </ProfileViewSection>

          {profileEditInvitations.length > 0 && (
            <ProfileViewSection title="Post a Profile Edit">
              <Flex vertical gap="small">
                <Select
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="Select profile edit invitation"
                  value={selectedInvitationId}
                  onChange={setSelectedInvitationId}
                  getPopupContainer={(triggerNode) => triggerNode.parentElement}
                  options={profileEditInvitations.map((p) => ({
                    label: prettyInvitationId(p.id),
                    value: p.id,
                  }))}
                />
                {selectedInvitation && (
                  <ProfileEditInvitationEditor
                    key={selectedInvitation.id}
                    invitation={selectedInvitation}
                    profileId={profileId}
                    onEditPosted={() => {
                      setSelectedInvitationId(null)
                      loadProfileEdits()
                    }}
                  />
                )}
              </Flex>
            </ProfileViewSection>
          )}

          {isProfileActivatable && profile && (
            <ModerationActions
              key={profileId}
              profile={profile}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          )}
        </Flex>
      </Col>
    </Row>
  )
}

export default IdentityDocumentReviewPanel
