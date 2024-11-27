/* globals $,typesetMathJax: false */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import pick from 'lodash/pick'
import { upperFirst } from 'lodash'
import ProfileViewSection from '../../components/profile/ProfileViewSection'
import BasicProfileView from '../../components/profile/BasicProfileView'
import LimitedStatusAlert from '../../components/profile/LimitedStateAlert'
import ProfilePublications from '../../components/profile/ProfilePublications'
import Icon from '../../components/Icon'
import withError from '../../components/withError'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { formatProfileData, getCoAuthorsFromPublications } from '../../lib/profiles'
import { auth, isSuperUser } from '../../lib/auth'
import { profileModeToggle } from '../../lib/banner-links'

const CoAuthorsList = ({ coAuthors, loading }) => {
  const [visibleCoAuthors, setVisibleCoAuthors] = useState([])
  const numCoAuthorsToShow = 25

  const authorLink = ({ name, id, email }) => {
    if (id) return <Link href={`/profile?id=${id}`}>{name}</Link>
    if (email) {
      return email.startsWith('https://dblp.org') ? (
        <a href={email} target="_blank" rel="noopener noreferrer">
          {name}
        </a>
      ) : (
        <Link href={`/profile?email=${email}`}>{name}</Link>
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
    typesetMathJax()
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
            <CoAuthorsList coAuthors={coAuthors} loading={!publications} />
          </ProfileViewSection>
        </aside>
      </div>
    </div>
  )
}

Profile.getInitialProps = async (ctx) => {
  let profileQuery = pick(ctx.query, ['id', 'email'])
  const { token, user } = auth(ctx)
  if (!user && !profileQuery.id && !profileQuery.email) {
    if (ctx.req) {
      ctx.res
        .writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` })
        .end()
    } else {
      Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
    }
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
    const { profiles } = await api.get('/profiles', profileQuery, {
      accessToken: token,
      remoteIpAddress: ctx.req?.headers['x-forwarded-for'],
    })
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
      message: `The profile ${
        profileQuery.id || profileQuery.email
      } does not exist or it's not public`,
    }
  }
  if (!profile.active && !isSuperUser(user)) {
    return {
      statusCode: 400,
      message: `The profile ${
        profileQuery.id || profileQuery.email
      } is not active`,
    }
  }

  return {
    profile: formatProfileData(profile),
    publicProfile: Object.keys(profileQuery).length > 0,
  }
}

Profile.bodyClass = 'profile'

export default withError(Profile)
