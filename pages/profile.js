import pick from 'lodash/pick'
import withError from '../components/withError'
import { formatProfileData } from '../lib/profiles'
import api from '../lib/api-client'

// Page Styles
import '../styles/pages/profile.less'

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
  <div className={name.meta && name.meta.confirmed ? 'edit-confirmed' : ''}>
    <span>{name.first}</span>
    {' '}
    <span>{name.middle}</span>
    {' '}
    <span>{name.last}</span>
    {' '}
    {name.preferred && <small>(Preferred)</small>}
    {' '}
    {name.meta && name.meta.signatures && (
      <span className="edit-badge glyphicon glyphicon-info-sign" aria-hidden="true" />
    )}
  </div>
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
  <div className={email.meta && email.meta.confirmed ? 'edit-confirmed' : ''}>
    <span>{email.email}</span>
    {' '}
    {!publicProfile && email.confirmed && <small>(Confirmed)</small>}
    {!publicProfile && email.preferred && <small>(Preferred)</small>}
    {email.meta && email.meta.signatures && (
      <span className="edit-badge glyphicon glyphicon-info-sign" aria-hidden="true" />
    )}
  </div>
)

const Profile = ({ profile, options, publicProfile }) => (
  <div id="profile-container" className="profile-controller">
    <header className="clearfix">
      {profile.profileImage && (
        <div className="img-container">
          <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/PjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgdmlld0JveD0iMCAwIDE0MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiPjwhLS0KU291cmNlIFVSTDogaG9sZGVyLmpzLzE0MHgxNDAKQ3JlYXRlZCB3aXRoIEhvbGRlci5qcyAyLjYuMC4KTGVhcm4gbW9yZSBhdCBodHRwOi8vaG9sZGVyanMuY29tCihjKSAyMDEyLTIwMTUgSXZhbiBNYWxvcGluc2t5IC0gaHR0cDovL2ltc2t5LmNvCi0tPjxkZWZzPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+PCFbQ0RBVEFbI2hvbGRlcl8xNWQzN2JhMDNhMCB0ZXh0IHsgZmlsbDojQUFBQUFBO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1mYW1pbHk6QXJpYWwsIEhlbHZldGljYSwgT3BlbiBTYW5zLCBzYW5zLXNlcmlmLCBtb25vc3BhY2U7Zm9udC1zaXplOjEwcHQgfSBdXT48L3N0eWxlPjwvZGVmcz48ZyBpZD0iaG9sZGVyXzE1ZDM3YmEwM2EwIj48cmVjdCB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI0VFRUVFRSIvPjxnPjx0ZXh0IHg9IjQ0LjA1NDY4NzUiIHk9Ijc0LjUiPjE0MHgxNDA8L3RleHQ+PC9nPjwvZz48L3N2Zz4=" alt="profile" />
        </div>
      )}

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

      </div>

      <aside className="col-md-12 col-lg-4">
        <section className="publications">
          <h4>Recent Publications</h4>
          <p className="instructions" />

          <div className="section-content">
            <p className="loading-message">Loading...</p>
          </div>

          <ul className="actions list-inline" style={{ display: 'none' }}>
            <li>
              <a href="/search?term={id}&content=authors&group=all&source=forum&sort=cdate:desc" className="search-link">
                View All
              </a>
            </li>
          </ul>
        </section>

        <section className="coauthors">
          <h4>Co-Authors</h4>
          <p className="instructions" />

          <div className="section-content">
            <p className="loading-message">Loading...</p>
          </div>
        </section>
      </aside>
    </div>


    <div id="profile-suggestion-modal" className="modal fade" tabIndex="-1" role="dialog">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
            <h3 className="modal-title">Suggest Profile Data</h3>
          </div>

          <div className="modal-body">
            <div className="alert alert-warning">Profile suggestions are currently disabled.</div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>

  </div>
)

Profile.getInitialProps = async (ctx) => {
  const profileQuery = pick(ctx.query, ['id', 'email'])
  const [profileRes, dropdownOptions] = await Promise.all([
    api.get('/profiles', profileQuery),
    api.get('/profiles/options'),
  ])

  const profile = profileRes.profiles && profileRes.profiles.length && profileRes.profiles[0]
  if (!profile) {
    return { statusCode: 404, message: 'Profile not found' }
  }

  const profileFormatted = formatProfileData(profile)
  return {
    profile: profileFormatted,
    options: dropdownOptions,
    publicProfile: true,
  }
}

const WrappedProfile = withError(Profile)
WrappedProfile.title = 'Profile'

export default WrappedProfile
