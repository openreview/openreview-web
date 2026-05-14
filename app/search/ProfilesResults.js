'use client'

import { Flex } from 'antd'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'
import { isValidEmail, prettyId } from '../../lib/utils'

import { highlightMatch } from '../../lib/searchHighlight'
import styles from './Search.module.scss'

const LIMIT = 25
const TILDE_ID_PATTERN = /^~.*\d+$/

const getProfilePreferredName = (profile) =>
  profile.content?.names?.find((n) => n.preferred) ?? profile.content?.names?.[0]

const getProfileSecondary = (profile) => {
  const email = profile.content?.preferredEmail || profile.content?.emails?.[0]
  if (email) return email
  return profile.content?.history?.[0]?.institution?.name ?? null
}

export default function ProfilesResults({ term, onResultCount }) {
  const [profiles, setProfiles] = useState(null)
  const [error, setError] = useState(null)
  const [skipMessage, setSkipMessage] = useState(null)
  const { user } = useUser()
  const isLoggedIn = !!user

  useEffect(() => {
    if (!term) return undefined

    setProfiles(null)
    setError(null)
    setSkipMessage(null)

    if (!isLoggedIn) {
      setSkipMessage('Sign in to search profiles by name or institution.')
      setProfiles([])
      onResultCount?.(0)
      return undefined
    }
    if (isValidEmail(term)) {
      setSkipMessage('Search profile by name or OpenReview profile ID.')
      setProfiles([])
      onResultCount?.(0)
      return undefined
    }
    if (term.startsWith('~') && !TILDE_ID_PATTERN.test(term)) {
      setSkipMessage('Enter a complete OpenReview profile ID (e.g. ~Jane_Doe1) or a name.')
      setProfiles([])
      onResultCount?.(0)
      return undefined
    }

    let cancelled = false
    const params = term.startsWith('~')
      ? { id: term, es: true, limit: LIMIT }
      : { fullname: term.toLowerCase(), es: true, limit: LIMIT }
    api
      .get('/profiles/search', params)
      .then((result) => {
        if (cancelled) return
        const items = result.profiles ?? []
        setProfiles(items)
        onResultCount?.(items.length)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        onResultCount?.(0)
      })

    return () => {
      cancelled = true
    }
  }, [term, isLoggedIn, onResultCount])

  if (skipMessage) return <p style={{ color: '#666' }}>{skipMessage}</p>
  if (error) return <p style={{ color: '#8c1b13' }}>{error.message ?? 'Search error'}</p>
  if (profiles === null) return <LoadingSpinner />
  if (profiles.length === 0) {
    return <p className="empty-message">No profiles match &quot;{term}&quot;.</p>
  }
  return (
    <ul className={styles.resultList}>
      {profiles.map((profile) => {
        const preferredName = getProfilePreferredName(profile)
        const fullname = preferredName?.fullname ?? prettyId(profile.id)
        const preferredId = preferredName?.username ?? profile.id
        const secondary = getProfileSecondary(profile)
        return (
          <li key={profile.id} className={styles.resultRow}>
            <Flex align="baseline" gap={8} wrap="wrap">
              <Link href={`/profile?id=${preferredId}`} className={styles.resultTitle}>
                {highlightMatch(fullname, term)}
              </Link>
            </Flex>
            {secondary && (
              <div className={styles.resultMeta} style={{ marginTop: 2 }}>
                {highlightMatch(secondary, term)}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
