import pick from 'lodash/pick'
import withError from '../components/withError'
import { formatProfileData } from '../lib/profiles'
import api from '../lib/api-client'
import { prettyList } from '../lib/utils'

// Page Styles
import '../styles/pages/profile.less'

const ProfileItem = ({
  itemMeta, className = '', editBadgeDiv = false, children,
}) => {
  if (!itemMeta) {
    return (
      <div className={className}>
        {children}
        {editBadgeDiv && <div className="edited">&nbsp;</div>}
      </div>
    )
  }

  const editBadge = itemMeta.signatures && (
    <span className="edit-badge glyphicon glyphicon-info-sign" aria-hidden="true" />
  )
  return (
    <div
      className={`${className}${itemMeta.confirmed ? ' edit-confirmed' : ''}`}
      data-toggle="tooltip"
      title={`Edited by ${prettyList(itemMeta.signatures)}`}
    >
      {children}
      {' '}
      {editBadgeDiv ? <div className="edited">{editBadge}</div> : editBadge}
    </div>
  )
}

const ProfileNamesList = ({ names }) => (
  <div className="list-compact names">
    {names
      .map((name) => {
        if (name.duplicate) return null
        return <ProfileName key={name.username} name={name} />
      })
      .filter(elem => elem)
      .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
  </div>
)

const ProfileName = ({ name }) => (
  <ProfileItem itemMeta={name.meta}>
    <span>{name.first}</span>
    {' '}
    <span>{name.middle}</span>
    {' '}
    <span>{name.last}</span>
    {' '}
    {name.preferred && <small>(Preferred)</small>}
  </ProfileItem>
)

const ProfileEmailsList = ({ emails, publicProfile }) => (
  <div className="list-compact emails">
    {emails
      .map((email) => {
        if (email.hidden) return null
        return <ProfileEmail key={email.email} email={email} publicProfile={publicProfile} />
      })
      .filter(elem => elem)
      .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
  </div>
)

const ProfileEmail = ({ email, publicProfile }) => (
  <ProfileItem itemMeta={email.meta}>
    <span>{email.email}</span>
    {' '}
    {!publicProfile && email.confirmed && <small>(Confirmed)</small>}
    {' '}
    {!publicProfile && email.preferred && <small>(Preferred)</small>}
  </ProfileItem>
)

const ProfileLink = ({ link }) => (
  <ProfileItem itemMeta={link.meta}>
    <a href={link.url} target="_blank" rel="noopener noreferrer">{link.name}</a>
  </ProfileItem>
)

const ProfileHistory = ({ history }) => (
  <ProfileItem className="table-row" itemMeta={history.meta} editBadgeDiv>
    <div className="position"><strong>{history.position}</strong></div>
    <div className="institution">
      {history.institution.name}
      {' '}
      <small>{`(${history.institution.domain})`}</small>
    </div>
    <div className="timeframe">
      <em>
        {history.start}
        {history.start && <span> &ndash; </span>}
        {history.end ? history.end : 'Present'}
      </em>
    </div>
  </ProfileItem>
)

const ProfileRelation = ({ relation }) => (
  <ProfileItem className="table-row" itemMeta={relation.meta} editBadgeDiv>
    <div><strong>{relation.relation}</strong></div>
    <div><span>{relation.name}</span></div>
    <div><small>{relation.email}</small></div>
    <div>
      <em>
        {relation.start}
        {relation.start && <span> &ndash; </span>}
        {relation.end ? relation.end : 'Present'}
      </em>
    </div>
  </ProfileItem>
)

const ProfileExpertise = ({ expertise }) => (
  <ProfileItem className="table-row" itemMeta={expertise.meta} editBadgeDiv>
    <div><span>{expertise.keywords.join(', ')}</span></div>
    <div>
      <em>
        {expertise.start}
        {expertise.start && <span> &ndash; </span>}
        {expertise.end ? expertise.end : 'Present'}
      </em>
    </div>
  </ProfileItem>
)

const Profile = ({ profile, publicProfile }) => (
  <div id="profile-container" className="profile-controller">
    <header className="clearfix">
      <div className="title-container">
        <h1>{profile.preferredName}</h1>
        <h3>{profile.currentInstitution}</h3>
      </div>
    </header>

    <div className="row equal-height-cols profile-v2">
      <div className="col-md-12 col-lg-8">

        <section className="names">
          <h4>Names</h4>
          <p className="instructions">
            How do you usually write your name as author of a paper? Also add any
            other names you have authored papers under.
          </p>
          <div className="section-content">
            <ProfileNamesList names={profile.names} />
          </div>
          <ul className="actions list-inline">
            <li><a className="suggest">Suggest Name</a></li>
          </ul>
        </section>

        <section className="emails">
          <h4>Emails</h4>
          <p className="instructions">
            Enter email addresses associated with all of your current and historical
            institutional affiliations, as well as all your previous publications,
            and the Toronto Paper Matching System. This information is crucial for
            deduplicating users, and ensuring you see your reviewing assignments.
          </p>
          <div className="section-content">
            <ProfileEmailsList emails={profile.emails} publicProfile={publicProfile} />
          </div>
          <ul className="actions list-inline">
            <li><a className="suggest">Suggest Email</a></li>
          </ul>
        </section>

        <section className="links">
          <h4>Personal Links</h4>
          <p className="instructions">Add links to your profiles on other sites. (Optional)</p>

          <div className="section-content clearfix">
            {profile.links.map(link => <ProfileLink key={link.name} link={link} />)}
          </div>

          <ul className="actions list-inline">
            <li><a className="suggest">Suggest URL</a></li>
          </ul>
        </section>


        <section className="history">
          <h4>Education &amp; Career History</h4>
          <p className="instructions">
            Enter your education and career history. The institution domain is
            used for conflict of interest detection and institution ranking.
            For ongoing positions, leave the end field blank.
          </p>
          <div className="section-content">
            {profile.history.length ? profile.history.map(history => (
              <ProfileHistory
                key={history.position + history.institution.name}
                history={history}
              />
            )) : (
              <p className="empty-message">No history found</p>
            )}
          </div>

          <ul className="actions list-inline">
            <li><a className="suggest">Suggest Position</a></li>
          </ul>
        </section>

        <section className="relations">
          <h4>Advisors, Relations &amp; Conflicts</h4>
          <p className="instructions">
            Enter all advisors, co-workers, and other people that should be
            included when detecting conflicts of interest.
          </p>
          <div className="section-content">
            {profile.relations.length ? profile.relations.map(relation => (
              <ProfileRelation key={relation.relation + relation.name} relation={relation} />
            )) : (
              <p className="empty-message">No relations found</p>
            )}
          </div>

          <ul className="actions list-inline">
            <li><a className="suggest">Suggest Relation</a></li>
          </ul>
        </section>

        <section className="expertise">
          <h4>Expertise</h4>
          <p className="instructions">
            For each line, enter comma-separated keyphrases representing an
            intersection of your interests. Think of each line as a query for
            papers in which you would have expertise and interest. For example:
            <br />
            <em>topic models, social network analysis, computational social science</em>
            <br />
            <em>deep learning, RNNs, dependency parsing</em>
          </p>
          <div className="section-content">
            {profile.expertise.length ? profile.expertise.map(expertise => (
              <ProfileExpertise key={expertise.keywords.join('-')} expertise={expertise} />
            )) : (
              <p className="empty-message">No areas of expertise listed</p>
            )}
          </div>

          <ul className="actions list-inline">
            <li><a className="suggest">Suggest Position</a></li>
          </ul>
        </section>

      </div>

      <aside className="col-md-12 col-lg-4">

        <section className="publications">
          <h4>Recent Publications</h4>
          <div className="section-content">
            <p className="loading-message"><em>Loading...</em></p>
          </div>
          <ul className="actions list-inline" style={{ display: 'none' }}>
            <li>
              <a
                href={`/search?term=${profile.id}&content=authors&group=all&source=forum&sort=cdate:desc`}
                className="search-link"
              >
                View All
              </a>
            </li>
          </ul>
        </section>

        <section className="coauthors">
          <h4>Co-Authors</h4>
          <div className="section-content">
            <p className="loading-message"><em>Loading...</em></p>
          </div>
        </section>

      </aside>
    </div>
  </div>
)

Profile.getInitialProps = async (ctx) => {
  const profileQuery = pick(ctx.query, ['id', 'email'])
  const profileRes = await api.get('/profiles', profileQuery)
  const profile = profileRes.profiles && profileRes.profiles.length && profileRes.profiles[0]
  if (!profile) {
    return { statusCode: 404, message: 'Profile not found' }
  }

  const profileFormatted = formatProfileData(profile)
  return {
    profile: profileFormatted,
    publicProfile: true,
  }
}

const WrappedProfile = withError(Profile)
WrappedProfile.title = 'Profile'

export default WrappedProfile
