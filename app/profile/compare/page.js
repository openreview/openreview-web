'use client'

/* globals promptError: false */

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import api from '../../../lib/api-client'
import { prettyId } from '../../../lib/utils'
import Compare from './Compare'
import styles from './Compare.module.scss'
import ErrorDisplay from '../../../components/ErrorDisplay'
import CommonLayout from '../../CommonLayout'
import useUser from '../../../hooks/useUser'
import { isSuperUser } from '../../../lib/clientAuth'
import LoadingSpinner from '../../../components/LoadingSpinner'

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

function Page() {
  const { user, isRefreshing } = useUser()
  const [profiles, setProfiles] = useState(null)
  const [error, setError] = useState(null)
  const query = useSearchParams()
  const left = query.get('left')
  const right = query.get('right')

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
      { includeVersion: true }
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
    const { profiles } = await api.get('/profiles', queryParams)
    if (profiles?.length > 0) {
      const publications = await getPublications(profiles[0].id)
      return { ...profiles[0], publications }
    }
    return {}
  }

  const loadProfiles = async () => {
    try {
      await Promise.all([getBasicProfile(left), getBasicProfile(right)]).then(
        ([basicProfileLeft, basicProfileRight]) => {
          setProfiles({
            left: addSignatureToProfile(basicProfileLeft),
            right: addSignatureToProfile(basicProfileRight),
          })
        }
      )
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  useEffect(() => {
    if (isRefreshing) return
    if (!isSuperUser(user)) {
      setError('Forbidden. Access to this page is restricted.')
      return
    }
    loadProfiles()
  }, [isRefreshing])

  if (!profiles && !error) return <LoadingSpinner />
  if (error) return <ErrorDisplay message={error} />

  return (
    <CommonLayout banner={null}>
      <div className={styles.compare}>
        <header>
          <h1>Merge Profiles</h1>
          <hr />
        </header>
        <div className="table-responsive">
          <Compare profiles={profiles} loadProfiles={loadProfiles} />
        </div>
      </div>
    </CommonLayout>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Page />
    </Suspense>
  )
}
