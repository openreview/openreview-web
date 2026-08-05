import { Button, Col, Flex, Input, Row, Select, Tooltip } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { sortBy } from 'lodash'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import { formatDateTime, isValidEmail } from '../../../lib/utils'

import { moderation as legacyStyles } from '../../../lib/legacy-bootstrap-styles'

dayjs.extend(relativeTime)

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
    <Flex gap="small" align="center" wrap style={legacyStyles.filterForm}>
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
  )
}

const IdentityDocumentsTab = () => {
  const [profileWithIdentityDocuments, setProfileWithIdentityDocuments] = useState(null)

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
      return <div>No profiles with identity documents found.</div>
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
            ({ profileId, documentCount, minTcdate, maxTcdate }) => (
              <Row key={profileId} align="middle" gutter={[8, 8]}>
                <Col xs={6} lg={8}>
                  <Link href={`/user/moderation?id=${profileId}`}>{profileId}</Link>
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
            )
          )}
        </Flex>
      </>
    )
  }

  return (
    <>
      <UploadLinkForm />
      {renderDocumentsList()}
    </>
  )
}

export default IdentityDocumentsTab
