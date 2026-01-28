import { upperFirst } from 'lodash'
import Icon from '../../components/Icon'
import styles from './Profile.module.scss'
import BasicProfileView from '../../components/profile/BasicProfileView'
import ProfileViewSection from '../../components/profile/ProfileViewSection'
import ProfilePublications from '../../components/profile/ProfilePublications'
import serverAuth from '../auth'
import api from '../../lib/api-client'
import CoAuthorsList from './CoAuthorsList'
import { getCoAuthorsFromPublications } from '../../lib/profiles'
import { Col, Flex, Row, Space, Typography } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'

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
      <>
        {currentHistories?.map((history, index) => {
          const posititon = upperFirst(history.position).trim()
          const department = history.institution.department?.trim()
          const institutionName = history.institution.name?.trim()

          return (
            <h3 key={index} style={{ color: '#616161' }}>
              {[posititon, department, institutionName].filter(Boolean).join(', ')}
            </h3>
          )
        })}
      </>
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
  }
  const { publications, count, coAuthors } = await loadPublications()

  return (
    <Flex vertical gap="small">
      <h1 style={{ fontWeight: 'bold', fontSize: '2.5rem', marginBottom: 0 }}>
        {profile.preferredName}
      </h1>
      {profile.pronouns && profile.pronouns !== '' && profile.pronouns !== 'Not Specified' && (
        <h4>Pronouns: {profile.pronouns}</h4>
      )}
      {getCurrentInstitutionInfo()}
      <Space>
        <CalendarOutlined /> Joined{profile.joined}
      </Space>
      <Row>
        <Col xs={24} lg={16}>
          <BasicProfileView
            profile={profile}
            publicProfile={publicProfile}
            serviceRoles={serviceRoles}
          />
        </Col>
        <Col xs={24} lg={8}>
          <Flex vertical>
            <ProfileViewSection title="Publications">
              <ProfilePublications
                profileId={profile.preferredId}
                publications={publications}
                count={count}
                loading={!publications}
                preferredName={profile.preferredName}
              />
            </ProfileViewSection>

            <ProfileViewSection title="Co-Authors">
              <CoAuthorsList coAuthors={coAuthors} />
            </ProfileViewSection>
          </Flex>
        </Col>
      </Row>
    </Flex>
  )

  return (
    <div className={styles.profile}>
      <header className="clearfix">
        <div className="title-container">
          <h1>{profile.preferredName}</h1>
          {profile.pronouns &&
            profile.pronouns !== '' &&
            profile.pronouns !== 'Not Specified' && (
              <h4 className="pronouns">Pronouns: {profile.pronouns}</h4>
            )}
          {getCurrentInstitutionInfo()}
          <ul className="list-inline">
            <li>
              <Icon name="calendar" extraClasses="pr-1" /> Joined {profile.joined}
            </li>
          </ul>
        </div>
      </header>
      <div className="row equal-height-cols">
        <div className="col-md-12 col-lg-8">
          <BasicProfileView
            profile={profile}
            publicProfile={publicProfile}
            serviceRoles={serviceRoles}
          />
        </div>

        <aside className="col-md-12 col-lg-4">
          <ProfileViewSection name="publications" title="Publications">
            <ProfilePublications
              profileId={profile.preferredId}
              publications={publications}
              count={count}
              loading={!publications}
              preferredName={profile.preferredName}
            />
          </ProfileViewSection>

          <ProfileViewSection name="coauthors" title="Co-Authors">
            <CoAuthorsList coAuthors={coAuthors} />
          </ProfileViewSection>
        </aside>
      </div>
    </div>
  )
}
