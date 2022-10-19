/* globals $: false */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import pick from 'lodash/pick'
import random from 'lodash/random'
import { nanoid } from 'nanoid'
import NoteList from '../../components/NoteList'
import Icon from '../../components/Icon'
import LimitedStatusAlert from '../../components/profile/LimitedStateAlert'
import withError from '../../components/withError'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { formatProfileData, getCoAuthorsFromPublications } from '../../lib/profiles'
import { prettyList } from '../../lib/utils'
import { auth } from '../../lib/auth'
import { profileModeToggle } from '../../lib/banner-links'

const ProfileSection = ({ name, title, instructions, actionLink, children }) => (
  <section className={name}>
    <h4>{title}</h4>
    <p className="instructions">{instructions}</p>
    <div className="section-content">{children}</div>
    {actionLink && (
      <ul className="actions list-inline">
        <li>
          <a className="suggest">{actionLink}</a>
        </li>
      </ul>
    )}
  </section>
)

const ProfileItem = ({ itemMeta, className = '', editBadgeDiv = false, children }) => {
  if (!itemMeta) {
    return (
      <div className={className}>
        {children}
        {editBadgeDiv && <div className="edited">&nbsp;</div>}
      </div>
    )
  }

  const editBadge = itemMeta.signatures && (
    <Icon
      name="info-sign"
      extraClasses="edit-badge"
      tooltip={`Edited by ${prettyList(itemMeta.signatures)}`}
    />
  )
  return (
    <div className={`${className}${itemMeta.confirmed ? ' edit-confirmed' : ''}`}>
      {children} {editBadgeDiv ? <div className="edited">{editBadge}</div> : editBadge}
    </div>
  )
}

const ProfileName = ({ name }) => (
  <ProfileItem itemMeta={name.meta}>
    <span>{name.first}</span> <span>{name.middle}</span> <span>{name.last}</span>{' '}
    {name.preferred && <small>(Preferred)</small>}
  </ProfileItem>
)

const ProfileEmail = ({ email, publicProfile }) => (
  <ProfileItem itemMeta={email.meta}>
    <span>{email.email}</span>{' '}
    {!publicProfile && email.confirmed && <small>(Confirmed)</small>}{' '}
    {!publicProfile && email.preferred && <small>(Preferred)</small>}
  </ProfileItem>
)

const ProfileLink = ({ link }) => (
  <ProfileItem itemMeta={link.meta}>
    <a href={link.url} target="_blank" rel="noopener noreferrer">
      {link.name}
    </a>
  </ProfileItem>
)

const ProfileHistory = ({ history }) => (
  <ProfileItem className="table-row" itemMeta={history.meta} editBadgeDiv>
    <div className="position">
      <strong>{history.position}</strong>
    </div>
    <div className="institution">
      {history.institution.name}{' '}
      {history.institution.domain && <small>{`(${history.institution.domain})`}</small>}
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
    <div>
      <strong>{relation.relation}</strong>
    </div>
    <div>
      <span>{relation.name}</span>
    </div>
    <div>
      <small>{relation.email}</small>
    </div>
    <div>
      <em>
        {relation.start}
        {relation.start && <span> &ndash; </span>}
        {relation.end ? relation.end : 'Present'}
      </em>
    </div>
    <div className="relation-visible">
      {relation.readers && !relation.readers.includes('everyone') && (
        <Icon
          name="eye-close"
          extraClasses="relation-visible-icon"
          tooltip="Privately revealed to you"
        />
      )}
    </div>
  </ProfileItem>
)

const ProfileExpertise = ({ expertise }) => (
  <ProfileItem className="table-row" itemMeta={expertise.meta} editBadgeDiv>
    <div>
      <span>{expertise.keywords.join(', ')}</span>
    </div>
    <div>
      <em>
        {expertise.start}
        {expertise.start && <span> &ndash; </span>}
        {expertise.end ? expertise.end : 'Present'}
      </em>
    </div>
  </ProfileItem>
)

const RecentPublications = ({ profileId, publications, count, loading, preferredName }) => {
  const displayOptions = {
    pdfLink: false,
    htmlLink: false,
    showContents: false,
    showPrivateIcon: true,
    referrer: `[the profile of ${preferredName}](/profile?id=${profileId})`,
  }
  const numPublicationsToShow = 10

  if (loading) {
    return (
      <p className="loading-message">
        <em>Loading...</em>
      </p>
    )
  }

  return publications.length > 0 ? (
    <>
      <NoteList
        key={nanoid()}
        notes={publications.slice(0, numPublicationsToShow)}
        displayOptions={displayOptions}
      />

      {count > numPublicationsToShow && (
        <Link
          href={`/search?term=${profileId}&content=authors&group=all&source=forum&sort=cdate:desc`}
        >
          {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
          <a>View all {count} publications</a>
        </Link>
      )}
    </>
  ) : (
    <p className="empty-message">No recent publications</p>
  )
}

const CoAuthorsList = ({ coAuthors, loading }) => {
  const [visibleCoAuthors, setVisibleCoAuthors] = useState([])
  const numCoAuthorsToShow = 25

  const authorLink = ({ name, id, email }) => {
    if (id)
      return (
        <Link href={`/profile?id=${id}`}>
          <a>{name}</a>
        </Link>
      )
    if (email) {
      return email.startsWith('https://dblp.org') ? (
        <a href={email} target="_blank" rel="noopener noreferrer">
          {name}
        </a>
      ) : (
        <Link href={`/profile?email=${email}`}>
          <a>{name}</a>
        </Link>
      )
    }
    return <span>{name}</span>
  }

  const handleViewAllClick = (e) => {
    e.preventDefault()
    setVisibleCoAuthors(coAuthors)
  }

  useEffect(() => {
    if (coAuthors) {
      setVisibleCoAuthors(coAuthors.slice(0, numCoAuthorsToShow))
    }
  }, [coAuthors])

  if (loading) {
    return (
      <p className="loading-message">
        <em>Loading...</em>
      </p>
    )
  }

  return visibleCoAuthors.length > 0 ? (
    <>
      <ul className="list-unstyled">
        {visibleCoAuthors.map((author) => (
          <li key={`${author.name}${author.id || author.email}`}>{authorLink(author)}</li>
        ))}
      </ul>

      {coAuthors.length > visibleCoAuthors.length && (
        // eslint-disable-next-line react/jsx-one-expression-per-line, jsx-a11y/anchor-is-valid
        <a href="#" onClick={handleViewAllClick} role="button">
          View all {coAuthors.length} co-authors
        </a>
      )}
    </>
  ) : (
    <p className="empty-message">No co-authors</p>
  )
}

const Profile = ({ profile, publicProfile, appContext }) => {
  const [publications, setPublications] = useState(null)
  const [count, setCount] = useState(0)
  const [coAuthors, setCoAuthors] = useState([])
  const { user, userLoading, accessToken } = useUser()
  const router = useRouter()
  const { setBannerHidden, setEditBanner } = appContext

  const uniqueNames = profile.names.filter((name) => !name.duplicate)
  const sortedNames = [
    ...uniqueNames.filter((p) => p.preferred),
    ...uniqueNames.filter((p) => !p.preferred),
  ]

  const loadPublications = async () => {
    let apiRes
    const queryParam = {
      'content.authorids': profile.id,
      sort: 'cdate:desc',
      limit: 1000,
    }
    try {
      apiRes = await api.getCombined('/notes', queryParam, null, { accessToken })
    } catch (error) {
      apiRes = error
    }
    if (apiRes.notes) {
      setPublications(apiRes.notes)
      setCount(apiRes.count)
    }
    $('[data-toggle="tooltip"]').tooltip('enable')
    $('[data-toggle="tooltip"]').tooltip({ container: 'body' })
  }

  useEffect(() => {
    if (!router.isReady || userLoading) return

    // Always show user's preferred username in the URL
    if (router.query.email || router.query.id !== profile.preferredId) {
      router.replace(`/profile?id=${profile.preferredId}`, undefined, { shallow: true })
      return
    }

    // Show edit banner if user is the owner of the profile
    setBannerHidden(true)
    if (profile.id === user?.profile?.id) {
      setEditBanner(profileModeToggle('view'))
    }

    loadPublications()
  }, [router.isReady, router.query, userLoading, accessToken, profile])

  useEffect(() => {
    if (!publications) return

    setCoAuthors(getCoAuthorsFromPublications(profile, publications))
  }, [publications])

  return (
    <div className="profile-container">
      <Head>
        <title key="title">{`${profile.preferredName} | OpenReview`}</title>
      </Head>

      {profile.state === 'Limited' && profile.id === user?.profile?.id && (
        <LimitedStatusAlert />
      )}

      <header className="clearfix">
        <div className="title-container">
          <h1>{profile.preferredName}</h1>
          <h3>{profile.currentInstitution}</h3>
        </div>
      </header>

      <div className="row equal-height-cols">
        <div className="col-md-12 col-lg-8">
          <ProfileSection
            name="names"
            title="Names"
            instructions="How do you usually write your name as author of a paper?
              Also add any other names you have authored papers under."
            actionLink="Suggest Name"
          >
            <div className="list-compact">
              {sortedNames
                .map((name) => (
                  <ProfileName key={name.username || name.first + name.last} name={name} />
                ))
                .reduce(
                  (accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]),
                  null
                )}
            </div>
          </ProfileSection>

          <ProfileSection
            name="emails"
            title="Emails"
            instructions="Enter email addresses associated with all of your current and historical
              institutional affiliations, as well as all your previous publications,
              and the Toronto Paper Matching System. This information is crucial for
              deduplicating users, and ensuring you see your reviewing assignments."
            actionLink="Suggest Email"
          >
            <div className="list-compact">
              {profile.emails
                .filter((email) => !email.hidden)
                .map((email) => (
                  <ProfileEmail key={nanoid()} email={email} publicProfile={publicProfile} />
                ))
                .reduce(
                  (accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]),
                  null
                )}
            </div>
          </ProfileSection>

          <ProfileSection
            name="links"
            title="Personal Links"
            instructions="Add links to your profiles on other sites. (Optional)"
            actionLink="Suggest URL"
          >
            {profile.links.map((link) => (
              <ProfileLink key={link.name} link={link} />
            ))}
          </ProfileSection>

          <ProfileSection
            name="history"
            title="Education &amp; Career History"
            instructions="Enter your education and career history. The institution domain is
              used for conflict of interest detection and institution ranking.
              For ongoing positions, leave the end field blank."
            actionLink="Suggest Position"
          >
            {profile.history?.length > 0 ? (
              profile.history.map((history) => (
                <ProfileHistory
                  key={
                    history.institution.name +
                    (history.position || random(1, 100)) +
                    (history.start || '') +
                    (history.end || '')
                  }
                  history={history}
                />
              ))
            ) : (
              <p className="empty-message">No history added</p>
            )}
          </ProfileSection>

          <ProfileSection
            name="relations"
            title="Advisors, Relations &amp; Conflicts"
            instructions="Enter all advisors, co-workers, and other people that should be
              included when detecting conflicts of interest."
            actionLink="Suggest Relation"
          >
            {profile.relations?.length > 0 ? (
              profile.relations.map((relation) => (
                <ProfileRelation
                  key={
                    relation.relation +
                    relation.name +
                    relation.email +
                    relation.start +
                    relation.end
                  }
                  relation={relation}
                />
              ))
            ) : (
              <p className="empty-message">No relations added</p>
            )}
          </ProfileSection>

          <ProfileSection
            name="expertise"
            title="Expertise"
            instructions="For each line, enter comma-separated keyphrases representing an
              intersection of your interests. Think of each line as a query for papers in
              which you would have expertise and interest. For example: deep learning, RNNs,
              dependency parsing"
            actionLink="Suggest Expertise"
          >
            {profile.expertise?.length > 0 ? (
              profile.expertise.map((expertise) => (
                <ProfileExpertise key={expertise.keywords.toString()} expertise={expertise} />
              ))
            ) : (
              <p className="empty-message">No areas of expertise listed</p>
            )}
          </ProfileSection>
        </div>

        <aside className="col-md-12 col-lg-4">
          <ProfileSection name="publications" title="Recent Publications">
            <RecentPublications
              profileId={profile.preferredId}
              publications={publications}
              count={count}
              loading={!publications}
              preferredName={profile.preferredName}
            />
          </ProfileSection>

          <ProfileSection name="coauthors" title="Co-Authors">
            <CoAuthorsList coAuthors={coAuthors} loading={!publications} />
          </ProfileSection>
        </aside>
      </div>
    </div>
  )
}

Profile.getInitialProps = async (ctx) => {
  // TODO: remove this redirect when all profile edit links have been changed
  if (ctx.query.mode === 'edit') {
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: '/profile/edit' }).end()
    } else {
      Router.replace('/profile/edit')
    }
  }

  let profileQuery = pick(ctx.query, ['id', 'email'])
  const { token, user } = auth(ctx)
  if (!user && !profileQuery.id && !profileQuery.email) {
    return { statusCode: 400, message: 'Profile ID or email is required' }
  }

  // Don't use query params if this is user's own profile
  if (
    user &&
    ((profileQuery.id && user.profile.usernames.includes(profileQuery.id)) ||
      (profileQuery.email && user.profile.emails.includes(profileQuery.email)) ||
      profileQuery.id === '' ||
      profileQuery.email === '')
  ) {
    profileQuery = {}
  }

  let profile
  try {
    const { profiles } = await api.get('/profiles', profileQuery, { accessToken: token })
    if (profiles?.length > 0) {
      profile = profiles[0]
    }
  } catch (error) {
    if (error.name === 'TokenExpiredError')
      return { statusCode: error.status, message: error.message }
    return { statusCode: 404, message: 'Profile not found' }
  }
  if (!profile) {
    return {
      statusCode: 404,
      message: `The user ${
        profileQuery.id || profileQuery.email
      } has not set up an OpenReview profile yet`,
    }
  }

  return {
    profile: formatProfileData(profile, true),
    publicProfile: Object.keys(profileQuery).length > 0,
  }
}

Profile.bodyClass = 'profile'

export default withError(Profile)
