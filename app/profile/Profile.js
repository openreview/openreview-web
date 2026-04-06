import { Col, Flex, Row, Space } from 'antd'
import { upperFirst } from 'lodash'
import Icon from '../../components/Icon'
import BasicProfileView from '../../components/profile/BasicProfileView'
import ProfilePublications from '../../components/profile/ProfilePublications'
import ProfileViewSection from '../../components/profile/ProfileViewSection'
import api from '../../lib/api-client'
import { getCoAuthorsFromPublications } from '../../lib/profiles'
import serverAuth from '../auth'
import CoAuthorsList from './CoAuthorsList'

import styles from './Profile.module.scss'
import { colors } from '../../lib/legacy-bootstrap-styles'

export default async function Profile({
  profile,
  publicProfile,
  serviceRoles,
  remoteIpAddress,
}) {
  const { token, user } = await serverAuth()
  const getCurrentInstitutionInfo = () => {
    const currentHistories = profile?.history?.filter(
      (p) => !p.end || p.end >= new Date().getFullYear()
    )
    return (
      <div>
        {currentHistories?.map((history, index) => {
          const posititon = upperFirst(history.position).trim()
          const department = history.institution.department?.trim()
          const institutionName = history.institution.name?.trim()

          return (
            <div
              key={index}
              style={{
                fontSize: '1.375rem',
                color: colors.subtleGray,
                lineHeight: 'normal',
                marginTop: index > 0 ? '0.25rem' : 0,
              }}
            >
              {[posititon, department, institutionName].filter(Boolean).join(', ')}
            </div>
          )
        })}
      </div>
    )
  }

  const loadPublications = async () => {
    let apiRes
    const queryParam = {
      'content.authorids': profile.id,
      sort: 'cdate:desc',
      limit: 1000,
    }
    try {
      apiRes = await api.getCombined(
        '/notes',
        queryParam,
        { ...queryParam, count: true },
        { accessToken: token, remoteIpAddress }
      )
      if (apiRes.notes) {
        const publications = apiRes.notes
        const coAuthors = getCoAuthorsFromPublications(profile, publications)
        return { publications, count: apiRes.count, coAuthors }
      }
    } catch (error) {
      apiRes = error
      // oxlint-disable-next-line no-console
      console.error('Error in loadPublications', {
        page: 'profile',
        component: 'Profile',
        user: user?.id,
        apiError: error,
        apiRequest: {
          endpoint: '/notes',
          params: queryParam,
        },
      })
    }
    return {}
  }
  const { publications, count, coAuthors } = await loadPublications()

  return (
    <Flex vertical gap="small" className={styles.profileContainer}>
      <h1 style={{ fontWeight: 'bold', fontSize: '2.25rem', marginBottom: 0 }}>
        {profile.preferredName}
      </h1>
      {profile.pronouns && profile.pronouns !== '' && profile.pronouns !== 'Not Specified' && (
        <h4 className={styles.pronouns}>Pronouns: {profile.pronouns}</h4>
      )}
      {getCurrentInstitutionInfo()}
      <Space style={{ fontSize: '1rem', color: colors.subtleGray, marginBottom: '1rem' }}>
        <Icon name="calendar" /> Joined{profile.joined}
      </Space>
      <Row>
        <Col xs={24} lg={16} style={{ paddingRight: '15px' }}>
          <BasicProfileView
            profile={profile}
            publicProfile={publicProfile}
            serviceRoles={serviceRoles}
          />
        </Col>
        <Col xs={24} lg={8} className={styles.publicationsSection}>
          <Flex vertical>
            <ProfileViewSection title="Publications">
              <div className={styles.publicationsList}>
                <ProfilePublications
                  profileId={profile.preferredId}
                  publications={publications}
                  count={count}
                  loading={!publications}
                  preferredName={profile.preferredName}
                />
              </div>
            </ProfileViewSection>

            <ProfileViewSection title="Co-Authors">
              <CoAuthorsList coAuthors={coAuthors} />
            </ProfileViewSection>
          </Flex>
        </Col>
      </Row>
    </Flex>
  )
}
