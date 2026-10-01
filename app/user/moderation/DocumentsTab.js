import { DownOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Col, Flex, Input, Row, Select, Tooltip } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { sortBy } from 'lodash'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import { formatDateTime, isValidEmail } from '../../../lib/utils'
import IdentityDocumentReviewPanel from './IdentityDocumentReviewPanel'
import ParentalConsentReviewPanel from './ParentalConsentReviewPanel'

import { moderation as legacyStyles } from '../../../lib/legacy-bootstrap-styles'

dayjs.extend(relativeTime)

const identityInvitationIds = [
  `${process.env.SUPER_USER}/Support/-/Identity_Verification`,
  `${process.env.SUPER_USER}/Support/-/Affiliation_Verification`,
]
const parentalConsentInvitationId = `${process.env.SUPER_USER}/Support/-/Parent_Consent`
const profileStateInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_State`

const UploadLinkForm = () => {
  const [term, setTerm] = useState('')
  const [linkType, setLinkType] = useState('identity')
  const [isLoading, setIsLoading] = useState(false)

  const getUploadLink = async () => {
    try {
      const cleanTerm = term.trim()
      if (!cleanTerm) return
      if (!cleanTerm.startsWith('~') && !isValidEmail(cleanTerm))
        throw new Error('The tilde ID or email entered is invalid')

      setIsLoading(true)
      let profileId = cleanTerm
      if (!cleanTerm.startsWith('~')) {
        const { profiles } = await api.get('/profiles/search', {
          email: cleanTerm.toLowerCase(),
          es: true,
          withBlocked: true,
        })
        profileId = profiles?.find((profile) =>
          profile.content?.emailsConfirmed?.includes(cleanTerm.toLowerCase())
        )?.id
        if (!profileId) throw new Error(`No profile found with confirmed email ${cleanTerm}`)
      }

      const { url } = await api.post('/profile-documents/upload-link', {
        profileId,
        type: linkType,
      })

      await navigator.clipboard.writeText(url)
      promptMessage(`Upload link for ${profileId} copied to clipboard`)
    } catch (error) {
      promptError(error.message, null, true)
    }
    setIsLoading(false)
  }

  return (
    <>
      <h4>Generate Document Upload Link</h4>
      <Flex
        gap="small"
        align="center"
        wrap
        style={{ ...legacyStyles.filterForm, maxWidth: '44rem' }}
      >
        <Input
          placeholder="Tilde ID or email"
          style={{ ...legacyStyles.formInput, flex: '1 1 250px' }}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onPressEnter={getUploadLink}
        />
        <Select
          options={[
            { label: 'Identity Documents', value: 'identity' },
            { label: 'Parental Consent', value: 'parentalConsent' },
          ]}
          value={linkType}
          onChange={setLinkType}
          style={{ width: 180 }}
        />
        <Button
          type="primary"
          styles={{ root: legacyStyles.formButton }}
          disabled={!term.trim() || isLoading}
          onClick={getUploadLink}
        >
          Copy Upload Link
        </Button>
      </Flex>
    </>
  )
}

const IdentityDocumentQueue = ({ profileEditInvitations, profileStateInvitation }) => {
  const [profileWithIdentityDocuments, setProfileWithIdentityDocuments] = useState(null)
  const [expandedProfileId, setExpandedProfileId] = useState(null)

  const loadProfilesWithIdentityDocuments = async () => {
    try {
      const { documents } = await api.get('/profile-documents/identity/')
      const profilesById = documents.reduce((profiles, { profileId, tcdate }) => {
        const profile = profiles[profileId]
        if (profile) {
          profile.documentCount += 1
          profile.minTcdate = Math.min(profile.minTcdate, tcdate)
          profile.maxTcdate = Math.max(profile.maxTcdate, tcdate)
        } else {
          profiles[profileId] = {
            profileId,
            documentCount: 1,
            minTcdate: tcdate,
            maxTcdate: tcdate,
          }
        }
        return profiles
      }, {})

      setProfileWithIdentityDocuments(
        sortBy(Object.values(profilesById), 'maxTcdate').reverse()
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadProfilesWithIdentityDocuments()
  }, [])

  const renderDocumentsList = () => {
    if (!profileWithIdentityDocuments) return <LoadingSpinner />
    if (!profileWithIdentityDocuments.length)
      return <div>There are no profiles pending identity document check.</div>
    return (
      <>
        <Row
          align="middle"
          gutter={[8, 0]}
          style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}
        >
          <Col xs={6} lg={8}>
            Profile ID
          </Col>
          <Col xs={6} lg={4}>
            Document Count
          </Col>
          <Col xs={6} lg={6}>
            First Upload
          </Col>
          <Col xs={6} lg={6}>
            Last Upload
          </Col>
        </Row>
        <Flex vertical gap="small" style={{ marginBottom: '1.5rem', minHeight: '600px' }}>
          {profileWithIdentityDocuments.map(
            ({ profileId, documentCount, minTcdate, maxTcdate }) => {
              const isExpanded = expandedProfileId === profileId
              return (
                <div key={profileId}>
                  <Row align="middle" gutter={[8, 8]}>
                    <Col xs={6} lg={8}>
                      <Flex align="center" gap="small">
                        <a
                          role="button"
                          tabIndex={0}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setExpandedProfileId(isExpanded ? null : profileId)}
                        >
                          {isExpanded ? <DownOutlined /> : <RightOutlined />} {profileId}
                        </a>
                        <Link href={`/user/moderation?id=${profileId}`}>
                          <SearchOutlined />
                        </Link>
                      </Flex>
                    </Col>
                    <Col xs={6} lg={4}>
                      {documentCount}
                    </Col>
                    <Col xs={6} lg={6}>
                      <Tooltip title={formatDateTime(minTcdate)}>
                        <span>{dayjs(minTcdate).fromNow()}</span>
                      </Tooltip>
                    </Col>
                    <Col xs={6} lg={6}>
                      <Tooltip title={formatDateTime(maxTcdate)}>
                        <span>{dayjs(maxTcdate).fromNow()}</span>
                      </Tooltip>
                    </Col>
                  </Row>
                  {isExpanded && (
                    <IdentityDocumentReviewPanel
                      profileId={profileId}
                      profileEditInvitations={profileEditInvitations}
                      profileStateInvitation={profileStateInvitation}
                      reloadProfileList={loadProfilesWithIdentityDocuments}
                    />
                  )}
                </div>
              )
            }
          )}
        </Flex>
      </>
    )
  }

  return (
    <>
      <h4>
        Profiles pending identity document check
        {profileWithIdentityDocuments ? ` (${profileWithIdentityDocuments.length})` : ''}
      </h4>
      {renderDocumentsList()}
    </>
  )
}

const DocumentsTab = () => {
  const searchParams = useSearchParams()
  const selectedProfileId = searchParams.get('consent')

  const [profileEditInvitations, setProfileEditInvitations] = useState([])

  const identityInvitations = profileEditInvitations.filter((p) =>
    identityInvitationIds.includes(p.id)
  )
  const parentalConsentInvitation = profileEditInvitations.find(
    (p) => p.id === parentalConsentInvitationId
  )
  const profileStateInvitation = profileEditInvitations.find(
    (p) => p.id === profileStateInvitationId
  )

  const loadProfileEditInvitations = async () => {
    try {
      const { invitations } = await api.get('/invitations', {
        ids: [...identityInvitationIds, parentalConsentInvitationId, profileStateInvitationId],
      })
      setProfileEditInvitations(invitations ?? [])
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadProfileEditInvitations()
  }, [])

  if (selectedProfileId) {
    return (
      <Flex vertical gap="large">
        <h4>Parental Consent Review: {selectedProfileId}</h4>
        <ParentalConsentReviewPanel
          key={selectedProfileId}
          profileId={selectedProfileId}
          invitation={parentalConsentInvitation}
          profileStateInvitation={profileStateInvitation}
        />
      </Flex>
    )
  }

  return (
    <Flex vertical gap="large">
      <IdentityDocumentQueue
        profileEditInvitations={identityInvitations}
        profileStateInvitation={profileStateInvitation}
      />
      <UploadLinkForm />
    </Flex>
  )
}

export default DocumentsTab
