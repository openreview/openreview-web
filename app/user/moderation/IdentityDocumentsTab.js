import { Col, Flex, Row, Tooltip } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { sortBy } from 'lodash'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import { formatDateTime } from '../../../lib/utils'

dayjs.extend(relativeTime)

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

export default IdentityDocumentsTab
