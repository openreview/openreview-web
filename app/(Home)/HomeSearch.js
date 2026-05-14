'use client'

/* globals promptError: false */

import { DownOutlined, PushpinFilled, PushpinOutlined } from '@ant-design/icons'
import { AutoComplete, Button, Divider, Flex, Input, Space, Tabs, Tag } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import { useEffect, useMemo, useRef, useState } from 'react'
import LoadingIcon from '../../components/LoadingIcon'
import api from '../../lib/api-client'
import { findVenueFieldMatch, highlightMatch, tokenizeTerm } from '../../lib/searchHighlight'
import { getNoteAuthors, isValidEmail, prettyId } from '../../lib/utils'
import usePinnedVenues from './usePinnedVenues'

import styles from './Home.module.scss'

const MIN_SEARCH_LENGTH = 3
const LOADING_VALUE = '__loading__'
const TILDE_ID_PATTERN = /^~.*\d+$/

const formatDeadline = (dueDate) => {
  if (!dueDate) return null
  const diffMs = dueDate - Date.now()
  if (diffMs <= 0) return null
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 24) {
    return `Closes in ${hours}h`
  }
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  if (days < 7) {
    return remHours > 0 ? `Closes in ${days}d ${remHours}h` : `Closes in ${days}d`
  }
  return `Closes in ${days}d`
}

// Dropdown-specific truncation — narrower than the search results page, so
// keep the snippet tighter (80 chars vs lib default 120).
const truncateAroundMatch = (label, tokenizedTerm) => {
  const maxCharLength = 80
  if (!label || label.length <= maxCharLength) return label
  const emphasisRegex = new RegExp(tokenizedTerm.split(' ').join('|'), 'i')
  const m = label.match(emphasisRegex)
  if (!m) return label.slice(0, maxCharLength) + '…'
  const matchLen = m[0].length
  const budget = maxCharLength - matchLen
  const half = Math.floor(budget / 2)
  let start = m.index - half
  let end = m.index + matchLen + half
  if (start < 0) {
    end -= start
    start = 0
  }
  if (end > label.length) {
    start = Math.max(0, start - (end - label.length))
    end = label.length
  }
  const prefix = start > 0 ? '…' : ''
  const suffix = end < label.length ? '…' : ''
  return `${prefix}${label.slice(start, end)}${suffix}`
}

const getProfilePreferredName = (profile) =>
  profile.content?.names?.find((n) => n.preferred) ?? profile.content?.names?.[0]

const getProfileSecondary = (profile) => {
  const email = profile.content?.preferredEmail || profile.content?.emails?.[0]
  if (email) return email
  return profile.content?.history?.[0]?.institution?.name ?? null
}

const renderPinButton = ({ type, id, displayName, snapshot, isPinned, togglePin }) => {
  if (!togglePin) return null
  const pinned = isPinned?.(type, id) ?? false
  return (
    <Button
      type="text"
      size="small"
      icon={pinned ? <PushpinFilled /> : <PushpinOutlined />}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        togglePin(type, id, snapshot)
      }}
      aria-label={pinned ? `Unpin ${displayName}` : `Pin ${displayName}`}
      style={{ color: pinned ? '#8c1b13' : undefined }}
    />
  )
}

const buildVenueOptions = (venues, ctx) => {
  const { tokenizedTerm, trimmedTerm, activeVenues, openVenues, isPinned, togglePin } = ctx
  return venues.map((venue) => {
    const name = prettyId(venue.id)
    const lowerName = name.toLowerCase()
    const nameMatches = tokenizeTerm(tokenizedTerm).some((t) =>
      lowerName.includes(t.toLowerCase())
    )
    const matchedField = nameMatches ? null : findVenueFieldMatch(venue, trimmedTerm)
    const isActive = activeVenues?.some((v) => v?.groupId === venue.id)
    const openVenue = openVenues?.find((v) => v?.groupId === venue.id)
    const isOpen = !!openVenue
    const deadline = isOpen ? formatDeadline(openVenue.dueDate) : null
    return {
      value: venue.id,
      label: (
        <Flex align="center" gap={8}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Flex align="center" gap={8} wrap="wrap">
              <span>{highlightMatch(name, tokenizedTerm)}</span>
              {isActive && <Tag color="#3e6775">Active</Tag>}
              {isOpen && <Tag color="#8c1b13">Open for Submission</Tag>}
              {deadline && (
                <span style={{ fontSize: '0.85em', color: '#8c1b13', fontWeight: 600 }}>
                  {deadline}
                </span>
              )}
            </Flex>
            {matchedField && (
              <div style={{ fontSize: '0.85em', color: '#666' }}>
                {matchedField.field} -{' '}
                {highlightMatch(
                  truncateAroundMatch(matchedField.fieldValue, tokenizedTerm),
                  tokenizedTerm
                )}
              </div>
            )}
          </div>
          {renderPinButton({
            type: 'venue',
            id: venue.id,
            displayName: name,
            isPinned,
            togglePin,
          })}
        </Flex>
      ),
    }
  })
}

const buildNoteOptions = (notes, ctx) => {
  const { tokenizedTerm, isPinned, togglePin } = ctx
  return notes.map((note) => {
    const isV2 = note.version === 2
    const title = isV2 ? note.content?.title?.value : note.content?.title
    const authors = getNoteAuthors(note, isV2)
    const displayTitle = title || '(Untitled)'
    return {
      value: note.id,
      noteId: note.id,
      forum: note.forum,
      label: (
        <Flex align="center" gap={8}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div>
              {highlightMatch(truncateAroundMatch(displayTitle, tokenizedTerm), tokenizedTerm)}
            </div>
            {authors?.length ? (
              <div style={{ fontSize: '0.85em', color: '#666' }}>
                {highlightMatch(
                  truncateAroundMatch(authors.join(', '), tokenizedTerm),
                  tokenizedTerm
                )}
              </div>
            ) : null}
          </div>
          {renderPinButton({
            type: 'note',
            id: note.id,
            displayName: displayTitle,
            snapshot: { title: displayTitle, forum: note.forum, authors: authors?.join(', ') },
            isPinned,
            togglePin,
          })}
        </Flex>
      ),
    }
  })
}

const buildProfileOptions = (profiles, ctx) => {
  const { tokenizedTerm } = ctx
  return profiles.map((profile) => {
    const preferredName = getProfilePreferredName(profile)
    const fullname = preferredName?.fullname ?? prettyId(profile.id)
    const preferredId = preferredName?.username ?? profile.id
    const secondary = getProfileSecondary(profile)
    return {
      value: preferredId,
      label: (
        <>
          <div>{highlightMatch(fullname, tokenizedTerm)}</div>
          {secondary && (
            <div style={{ fontSize: '0.85em', color: '#666' }}>
              {highlightMatch(secondary, tokenizedTerm)}
            </div>
          )}
        </>
      ),
    }
  })
}

const CATEGORIES = {
  venues: {
    label: 'Venues',
    fetch: async (term) => {
      const result = await api.get('/venues/search', {
        term,
        limit: 10,
        select: 'id,domain,content.title,content.subtitle,content.location,content.website',
      })
      return { items: result.venues ?? [], searchUnavailable: !!result.searchUnavailable }
    },
    buildOptions: buildVenueOptions,
    onSelect: (value, option, router) => {
      router.push(`/group?id=${value}`)
    },
    emptyMessage: (term) => `No venues match "${term}".`,
  },
  notes: {
    label: 'Notes',
    fetch: async (term) => {
      const result = await api.getCombined(
        '/notes/search',
        {
          term,
          type: 'prefix',
          content: 'all',
          group: 'all',
          source: 'all',
          limit: 10,
        },
        null,
        { resultsKey: 'notes' }
      )
      return { items: result.notes ?? [], searchUnavailable: !!result.searchUnavailable }
    },
    buildOptions: buildNoteOptions,
    onSelect: (value, option, router) => {
      const query =
        option.forum && option.forum !== option.noteId
          ? { id: option.forum, noteId: option.noteId }
          : { id: option.forum ?? option.noteId }
      router.push(`/forum?${stringify(query)}`)
    },
    emptyMessage: (term) => `No papers, comments, or reviews match "${term}".`,
  },
  profiles: {
    label: 'Profiles',
    fetch: async (term) => {
      const params = term.startsWith('~')
        ? { id: term, es: true, limit: 10 }
        : { fullname: term.toLowerCase(), es: true, limit: 10 }
      const result = await api.get('/profiles/search', params)
      return { items: result.profiles ?? [], searchUnavailable: !!result.searchUnavailable }
    },
    buildOptions: buildProfileOptions,
    onSelect: (value, option, router) => {
      router.push(`/profile?${stringify({ id: value })}`)
    },
    emptyMessage: (term) => `No profiles match "${term}".`,
  },
}

const initialMap = () => ({ venues: [], notes: [], profiles: [] })
const initialBoolMap = () => ({ venues: false, notes: false, profiles: false })

export default function HomeSearch({
  activeVenues,
  openVenues,
  isLoggedIn,
  userId,
  totalVenues = 0,
}) {
  const categoryKeys = useMemo(
    () => (isLoggedIn ? ['venues', 'notes', 'profiles'] : ['venues', 'notes']),
    [isLoggedIn]
  )

  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('venues')
  const [rawItemsMap, setRawItemsMap] = useState(initialMap)
  const [loadingMap, setLoadingMap] = useState(initialBoolMap)
  const [unavailableMap, setUnavailableMap] = useState(initialBoolMap)
  const [profileError, setProfileError] = useState(null)
  const latestTermRef = useRef('')
  const inputRef = useRef(null)
  const router = useRouter()
  const { isPinned, togglePin } = usePinnedVenues(userId)

  const tokenizedTerm = useMemo(
    () => tokenizeTerm(immediateSearchTerm).join(' '),
    [immediateSearchTerm]
  )
  const trimmedTerm = useMemo(() => immediateSearchTerm.trim(), [immediateSearchTerm])

  // Single effect — fires all categories in parallel when the term changes.
  useEffect(() => {
    latestTermRef.current = trimmedTerm

    if (tokenizedTerm.length < MIN_SEARCH_LENGTH) {
      setRawItemsMap(initialMap())
      setLoadingMap(initialBoolMap())
      setUnavailableMap(initialBoolMap())
      setProfileError(null)
      return undefined
    }

    // Profile-specific guards — determine if we should skip the profiles call.
    let profileSkip = null
    if (!isLoggedIn) {
      profileSkip = 'guest'
    } else if (isValidEmail(trimmedTerm)) {
      profileSkip = 'email'
    } else if (trimmedTerm.startsWith('~') && !TILDE_ID_PATTERN.test(trimmedTerm)) {
      profileSkip = 'partial-tilde'
    }
    setProfileError(profileSkip === 'email' ? 'Search profile by name or OpenReview profile ID.' : null)

    setLoadingMap({
      venues: true,
      notes: true,
      profiles: !profileSkip,
    })

    const timer = setTimeout(async () => {
      const requestTerm = trimmedTerm
      const fetches = categoryKeys
        .filter((key) => key !== 'profiles' || !profileSkip)
        .map((key) =>
          CATEGORIES[key]
            .fetch(requestTerm)
            .then((r) => ({ key, ...r, error: null }))
            .catch((err) => ({ key, items: [], searchUnavailable: false, error: err }))
        )

      const responses = await Promise.all(fetches)
      if (latestTermRef.current !== requestTerm) return

      const nextItems = initialMap()
      const nextUnavailable = initialBoolMap()
      responses.forEach(({ key, items, searchUnavailable, error }) => {
        if (error) {
          // oxlint-disable-next-line no-console
          console.error(`Search error in ${key}:`, error)
          nextUnavailable[key] = true
        } else if (searchUnavailable) {
          nextUnavailable[key] = true
        } else {
          nextItems[key] = items
        }
      })
      setRawItemsMap(nextItems)
      setUnavailableMap(nextUnavailable)
      setLoadingMap(initialBoolMap())
    }, 300)

    return () => clearTimeout(timer)
  }, [tokenizedTerm, trimmedTerm, isLoggedIn, categoryKeys])

  const optionsMap = useMemo(() => {
    const ctx = {
      tokenizedTerm,
      trimmedTerm,
      activeVenues,
      openVenues,
      isPinned: userId ? isPinned : undefined,
      togglePin: userId ? togglePin : undefined,
    }
    return {
      venues: CATEGORIES.venues.buildOptions(rawItemsMap.venues, ctx),
      notes: CATEGORIES.notes.buildOptions(rawItemsMap.notes, ctx),
      profiles: isLoggedIn ? CATEGORIES.profiles.buildOptions(rawItemsMap.profiles, ctx) : [],
    }
  }, [rawItemsMap, tokenizedTerm, trimmedTerm, activeVenues, openVenues, isPinned, togglePin, userId, isLoggedIn])

  const displayedOptions = useMemo(() => {
    if (loadingMap[activeTab] && optionsMap[activeTab].length === 0) {
      return [
        {
          value: LOADING_VALUE,
          disabled: true,
          label: (
            <span style={{ color: '#8c1b13' }}>
              <LoadingIcon />
            </span>
          ),
        },
      ]
    }
    return optionsMap[activeTab]
  }, [loadingMap, optionsMap, activeTab])

  const handleSelect = (value, option) => {
    if (value === LOADING_VALUE) return
    // Same as submitToSearch: avoid clearing state since we're navigating away.
    CATEGORIES[activeTab].onSelect(value, option, router)
  }

  const submitToSearch = () => {
    const term = trimmedTerm
    if (!term || term.length < MIN_SEARCH_LENGTH) return
    // Don't clear the input — the component unmounts on navigation, so any
    // visible clear during the transition is a UX flash.
    router.push(`/search?${stringify({ term })}`)
  }

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    submitToSearch()
  }

  // Build tab labels with result counts / loading state per category.
  const tabItems = categoryKeys.map((key) => {
    const count = rawItemsMap[key].length
    return {
      key,
      label: (
        <span>
          {CATEGORIES[key].label}
          {loadingMap[key] ? (
            <span style={{ opacity: 0.5, marginLeft: 6 }}>…</span>
          ) : tokenizedTerm.length >= MIN_SEARCH_LENGTH ? (
            <span
              style={{
                marginLeft: 6,
                color: count > 0 ? '#3e6775' : '#999',
                fontWeight: count > 0 ? 600 : 400,
              }}
            >
              ({count})
            </span>
          ) : null}
        </span>
      ),
      children: null,
    }
  })

  let notFoundContent
  if (loadingMap[activeTab]) {
    notFoundContent = (
      <span style={{ color: '#8c1b13' }}>
        <LoadingIcon />
      </span>
    )
  } else if (unavailableMap[activeTab]) {
    notFoundContent = (
      <span style={{ color: '#8c1b13' }}>
        OpenReview is experiencing degraded performance in search functionality. Please try
        again later.
      </span>
    )
  } else if (activeTab === 'profiles' && profileError) {
    notFoundContent = <span style={{ color: '#8c1b13' }}>{profileError}</span>
  } else if (tokenizedTerm.length < MIN_SEARCH_LENGTH) {
    notFoundContent = `Type at least ${MIN_SEARCH_LENGTH} characters to search.`
  } else {
    notFoundContent = CATEGORIES[activeTab].emptyMessage(trimmedTerm)
  }

  const popupRender = (menu) => {
    const showViewAll = tokenizedTerm.length >= MIN_SEARCH_LENGTH
    return (
      <>
        {tokenizedTerm.length >= MIN_SEARCH_LENGTH && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="small"
            tabBarStyle={{ margin: '0 12px', minHeight: 32 }}
          />
        )}
        {menu}
        {showViewAll && (
          <>
            <Divider style={{ margin: '4px 0' }} />
            <div style={{ padding: '6px 12px' }}>
              <Link href={`/search?${stringify({ term: trimmedTerm })}`}>
                View all results →
              </Link>
            </div>
          </>
        )}
      </>
    )
  }

  const searchWidget = (
    <Space.Compact size="large" style={{ width: '100%' }}>
      <AutoComplete
        value={immediateSearchTerm}
        options={displayedOptions}
        onChange={setImmediateSearchTerm}
        onSelect={handleSelect}
        popupRender={popupRender}
        notFoundContent={notFoundContent}
        allowClear
        virtual={false}
        style={{ flex: 1 }}
        popupMatchSelectWidth
        listHeight={250}
      >
        <Input
          ref={inputRef}
          placeholder="Search venues, papers, profiles..."
          maxLength={200}
          onKeyDown={handleKeyDown}
          style={{ background: '#fff' }}
        />
      </AutoComplete>
      <Button type="primary" onClick={submitToSearch}>
        Search
      </Button>
    </Space.Compact>
  )

  const browseLabel = totalVenues > 0
    ? `Browse all ${totalVenues.toLocaleString()} venues →`
    : 'Browse all venues →'
  const browseArea = (
    <div
      className={styles.browseAlign}
      style={{ marginTop: 16, width: '100%', maxWidth: 768, height: 32 }}
    >
      <Link href="/all-venues">
        <Button type="link" style={{ padding: 0 }}>
          {browseLabel}
        </Button>
      </Link>
    </div>
  )

  if (isLoggedIn) {
    // Logged-in: normal section idiom (h1 + Divider + content), left-aligned,
    // matches Active Consoles / Pinned Items / News / Deadlines.
    return (
      <section id="home-search" style={{ maxWidth: 768 }}>
        <h1>Search</h1>
        <Divider style={{ marginTop: 0, minWidth: 0 }} />
        {searchWidget}
        {browseArea}
      </section>
    )
  }

  // Guest: hero treatment — logo + centered search + scroll hint.
  return (
    <section id="home-search">
      {/* Visually-hidden heading for semantics/SEO; the logo above carries the
          brand visually. */}
      <h1
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        Search OpenReview
      </h1>
      <img
        src="/images/openreview_logo_256.png"
        alt="OpenReview"
        width={112}
        height={112}
        className={styles.heroLogo}
      />
      {searchWidget}
      {browseArea}
      <button
        type="button"
        className={styles.scrollHint}
        aria-label="Scroll for more"
        onClick={() => {
          const section = document.querySelector('#home-search')
          const next = section?.parentElement?.nextElementSibling
          const target = next ?? section?.nextElementSibling
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
      >
        <DownOutlined />
      </button>
    </section>
  )
}
