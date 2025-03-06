import { Suspense } from 'react'
import { headers } from 'next/headers'
import LoadingSpinner from '../../../components/LoadingSpinner'
import serverAuth, { isSuperUser } from '../../auth'
import api from '../../../lib/api-client'
import { prettyId } from '../../../lib/utils'
import Compare from './Compare'
import styles from './Compare.module.scss'
import ErrorDisplay from '../../../components/ErrorDisplay'
import CommonLayout from '../../CommonLayout'

export const metadata = {
  title: 'Compare Profiles | OpenReview',
}

export const dynamic = 'force-dynamic'

const addMetadata = (profile, fieldName) => {
  const localProfile = { ...profile }
  // for checking signature to decide if confirmed
  const profileUsernames = localProfile.content?.names
    ? localProfile.content?.names.map((name) => name?.username)
    : []

  if (!localProfile.content?.[fieldName]) return null
  if (!localProfile.metaContent?.[fieldName]) return localProfile.content[fieldName]
  if (typeof localProfile.content[fieldName] === 'string') {
    localProfile.content[fieldName] = [localProfile.content[fieldName]]
  }
  if (!localProfile.content[fieldName].length) return null
  if (!Array.isArray(localProfile.metaContent[fieldName])) {
    localProfile.metaContent[fieldName] = [localProfile.metaContent[fieldName]]
  }

  return localProfile.content[fieldName].map((c, index) => {
    let isConfirmedEmail = false

    if (fieldName === 'emails' && localProfile.content.emailsConfirmed?.includes(c) === true)
      isConfirmedEmail = true

    const { signatures } = localProfile.metaContent[fieldName][index]
    return {
      ...c,
      value: c,
      signatures: signatures.map((signature) => prettyId(signature)).join(', '),
      confirmed:
        signatures.includes('~Super_User1') ||
        signatures.includes('OpenReview.net') ||
        signatures.some((signature) => profileUsernames.includes(signature)),
      isConfirmedEmail,
    }
  })
}

const formatLongDate = (date) => {
  if (!date) return ''

  return new Date(date).toISOString().replace(/-/g, '/').replace('T', ' ').replace('Z', '')
}

const addSignatureToProfile = (profile) => {
  if (Object.keys(profile).length === 0) return profile

  return {
    id: profile.id,
    state: profile.state,
    tcdate: formatLongDate(profile.tcdate || profile.cdate),
    tmdate: formatLongDate(profile.tmdate || profile.mdate),
    active: !!profile.active,
    password: (!!profile.password).toString(),
    names: addMetadata(profile, 'names'),
    preferredEmail: addMetadata(profile, 'preferredEmail'),
    emails: addMetadata(profile, 'emails'),
    homepage: addMetadata(profile, 'homepage'),
    dblp: addMetadata(profile, 'dblp'),
    gscholar: addMetadata(profile, 'gscholar'),
    linkedin: addMetadata(profile, 'linkedin'),
    wikipedia: addMetadata(profile, 'wikipedia'),
    semanticScholar: addMetadata(profile, 'semanticScholar'),
    orcid: addMetadata(profile, 'orcid'),
    aclanthology: addMetadata(profile, 'aclanthology'),
    history: addMetadata(profile, 'history'),
    expertise: addMetadata(profile, 'expertise'),
    relations: addMetadata(profile, 'relations'),
    publications: profile.publications,
    yearOfBirth: profile.content.yearOfBirth?.toString(),
  }
}

export default async function page({ searchParams }) {
  const { user, token: accessToken } = await serverAuth()
  if (!isSuperUser(user))
    return <ErrorDisplay message="Forbidden. Access to this page is restricted." />

  const { left, right } = await searchParams
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const getPublications = async (profileId) => {
    if (!profileId) {
      return []
    }
    const { notes } = await api.getCombined(
      '/notes',
      {
        'content.authorids': profileId,
        sort: 'cdate:desc',
      },
      null,
      { accessToken, includeVersion: true, remoteIpAddress }
    )
    if (notes?.length > 0) {
      return notes.map((publication) => ({
        forum: publication.forum,
        title:
          publication.apiVersion === 1
            ? publication.content.title
            : publication.content.title.value,
        authors:
          publication.apiVersion === 1
            ? publication.content.authors
            : publication.content.authors.value,
        authorids: (publication.apiVersion === 1
          ? publication.content.authorids
          : publication.content.authorids.value
        ).filter((id) => id),
      }))
    }
    return []
  }

  const getBasicProfile = async (id) => {
    if (!id) {
      return {}
    }
    const queryParams = id.includes('@') ? { email: id } : { id }
    const { profiles } = await api.get('/profiles', queryParams, {
      accessToken,
      remoteIpAddress,
    })
    if (profiles?.length > 0) {
      const publications = await getPublications(profiles[0].id)
      return { ...profiles[0], publications }
    }
    return {}
  }

  const getEdges = async (withSignatureProfiles) => {
    if (
      !withSignatureProfiles.left?.id ||
      !withSignatureProfiles.right?.id ||
      withSignatureProfiles.left.id === withSignatureProfiles.right.id
    )
      return null
    const leftHeadP = api.get(
      '/edges',
      { head: withSignatureProfiles.left.id },
      { accessToken, remoteIpAddress }
    )
    const leftTailP = api.get(
      '/edges',
      { tail: withSignatureProfiles.left.id },
      { accessToken, remoteIpAddress }
    )
    const rightHeadP = api.get(
      '/edges',
      { head: withSignatureProfiles.right.id },
      { accessToken, remoteIpAddress }
    )
    const rightTailP = api.get(
      '/edges',
      { tail: withSignatureProfiles.right.id },
      { accessToken, remoteIpAddress }
    )
    return Promise.all([leftHeadP, leftTailP, rightHeadP, rightTailP]).then((results) => ({
      leftHead: results[0].count,
      leftTail: results[1].count,
      rightHead: results[2].count,
      rightTail: results[3].count,
    }))
  }

  const profilesP = Promise.all([getBasicProfile(left), getBasicProfile(right)])
    .then(([basicProfileLeft, basicProfileRight]) => ({
      left: addSignatureToProfile(basicProfileLeft),
      right: addSignatureToProfile(basicProfileRight),
    }))
    .then((withSignatureProfiles) =>
      getEdges(withSignatureProfiles)
        .then((edgeCounts) => ({
          withSignatureProfiles,
          edgeCounts,
        }))
        .catch((error) => ({ withSignatureProfiles, error: error.message }))
    )
    .catch((error) => ({ error: error.message }))

  return (
    <CommonLayout banner={null}>
      <div className={styles.compare}>
        <header>
          <h1>Merge Profiles</h1>
          <hr />
        </header>
        <div className="table-responsive">
          <Suspense fallback={<LoadingSpinner />}>
            <Compare profilesP={profilesP} accessToken={accessToken} />
          </Suspense>
        </div>
      </div>
    </CommonLayout>
  )
}
