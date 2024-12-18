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

export default async function Profile({ profile, publicProfile }) {
  const { token } = await serverAuth()
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
            <h3 key={index}>
              {[posititon, department, institutionName].filter(Boolean).join(', ')}
            </h3>
          )
        })}
      </>
    )
  }

  let count = 0
  let publications = []
  let coAuthors = []

  const loadPublications = async () => {
    let apiRes
    const queryParam = {
      'content.authorids': profile.id,
      sort: 'cdate:desc',
      limit: 1000,
    }
    try {
      apiRes = await api.getCombined('/notes', queryParam, null, { accessToken: token })
    } catch (error) {
      apiRes = error
      console.log('error:', error)
    }
    if (apiRes.notes) {
      publications = apiRes.notes
      count = apiRes.count
      coAuthors = getCoAuthorsFromPublications(profile, publications)
    }
  }
  await loadPublications()

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
          <BasicProfileView profile={profile} publicProfile={publicProfile} />
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
