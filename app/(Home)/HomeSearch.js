'use client'

/* globals promptError: false */

import { PushpinFilled, PushpinOutlined } from '@ant-design/icons'
import { AutoComplete, Button, Divider, Flex, Input, Segmented, Select, Space, Tag } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import { useEffect, useMemo, useRef, useState } from 'react'
import LoadingIcon from '../../components/LoadingIcon'
import api from '../../lib/api-client'
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

const wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' })

const tokenizeTerm = (term) => {
  if (!term) return []
  return Array.from(wordSegmenter.segment(term))
    .filter((s) => s.isWordLike)
    .map((s) => s.segment)
}

const truncateAroundMatch = (label, tokenizedTerm) => {
  const maxCharLength = 80
  if (label.length <= maxCharLength) return label
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

const highlightMatch = (text, tokenizedTerm) => {
  if (!tokenizedTerm || !text) return text
  const regex = new RegExp(`(${tokenizedTerm.split(' ').join('|')})`, 'gi')
  const segments = text.split(regex)
  return (
    <>
      {segments.map((segment, index) =>
        index % 2 === 1 ? <strong key={index}>{segment}</strong> : segment
      )}
    </>
  )
}

const venueFieldsConfig = [
  { key: 'domain', label: 'Domain', getValue: (venue) => venue.domain },
  { key: 'title', label: 'Title', getValue: (venue) => venue.content?.title?.value },
  { key: 'subtitle', label: 'Subtitle', getValue: (venue) => venue.content?.subtitle?.value },
  { key: 'location', label: 'Location', getValue: (venue) => venue.content?.location?.value },
  { key: 'website', label: 'Website', getValue: (venue) => venue.content?.website?.value },
]

const findVenueFieldMatch = (venue, term) => {
  const lowerTerm = term.toLowerCase()
  const fullMatch = venueFieldsConfig.find((fieldConfig) => {
    const value = fieldConfig.getValue(venue)
    return value && value.toLowerCase().includes(lowerTerm)
  })
  if (fullMatch) {
    return { field: fullMatch.label, fieldValue: fullMatch.getValue(venue) }
  }
  const tokens = tokenizeTerm(term).map((t) => t.toLowerCase())
  if (!tokens.length) return null
  const tokenMatch = venueFieldsConfig.find((fieldConfig) => {
    const value = fieldConfig.getValue(venue)
    if (!value) return false
    const lowerValue = value.toLowerCase()
    return tokens.some((token) => lowerValue.includes(token))
  })
  return tokenMatch
    ? { field: tokenMatch.label, fieldValue: tokenMatch.getValue(venue) }
    : null
}

const getProfilePreferredName = (profile) =>
  profile.content?.names?.find((n) => n.preferred) ?? profile.content?.names?.[0]

const getProfileSecondary = (profile) => {
  const email = profile.content?.preferredEmail || profile.content?.emails?.[0]
  if (email) return email
  return profile.content?.history?.[0]?.institution?.name ?? null
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
    const pinned = isPinned?.(venue.id) ?? false
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
          {togglePin && (
            <Button
              type="text"
              size="small"
              icon={pinned ? <PushpinFilled /> : <PushpinOutlined />}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                togglePin(venue.id)
              }}
              aria-label={pinned ? `Unpin ${name}` : `Pin ${name}`}
              style={{ color: pinned ? '#8c1b13' : undefined }}
            />
          )}
        </Flex>
      ),
    }
  })
}

const buildNoteOptions = (notes, ctx) => {
  const { tokenizedTerm } = ctx
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
        <>
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
        </>
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

const MODES = {
  venues: {
    placeholder: 'Type to search for venues...',
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
    onEnter: () => {},
    footer: () => <Link href="/all-venues">Browse all venues →</Link>,
  },
  notes: {
    placeholder: 'Type to search for papers, comments, and reviews...',
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
    onEnter: (term, router) => {
      if (term.length < MIN_SEARCH_LENGTH) return
      router.push(
        `/search?${stringify({ term, content: 'all', group: 'all', source: 'all' })}`
      )
    },
    footer: ({ trimmedTerm }) =>
      trimmedTerm.length >= MIN_SEARCH_LENGTH ? (
        <Link
          href={`/search?${stringify({
            term: trimmedTerm,
            content: 'all',
            group: 'all',
            source: 'all',
          })}`}
        >
          View all results →
        </Link>
      ) : null,
  },
  profiles: {
    placeholder: 'Type a name or OpenReview profile ID (~Name1)...',
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
    onEnter: () => {},
    footer: () => null,
  },
}

const ALL_MODE_OPTIONS = [
  { label: 'Venues', value: 'venues' },
  { label: 'Notes', value: 'notes' },
  { label: 'Profiles', value: 'profiles' },
]

export default function HomeSearch({ activeVenues, openVenues, isLoggedIn, userId }) {
  const modeOptions = useMemo(
    () => (isLoggedIn ? ALL_MODE_OPTIONS : ALL_MODE_OPTIONS.filter((o) => o.value !== 'profiles')),
    [isLoggedIn]
  )
  const [mode, setMode] = useState('venues')
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [rawItems, setRawItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchUnavailable, setSearchUnavailable] = useState(false)
  const [modeError, setModeError] = useState(null)
  const [forceOpen, setForceOpen] = useState(false)
  const latestTermRef = useRef('')
  const inputRef = useRef(null)
  const router = useRouter()
  const { isPinned, togglePin } = usePinnedVenues(userId)

  const tokenizedTerm = useMemo(
    () => tokenizeTerm(immediateSearchTerm).join(' '),
    [immediateSearchTerm]
  )
  const trimmedTerm = useMemo(() => immediateSearchTerm.trim(), [immediateSearchTerm])

  // forceOpen is released either by antd reporting a close (user clicked
  // away) or by an explicit selection. This keeps the dropdown open until the
  // user dismisses it, then hands control back to antd's natural behavior.

  const previousModeRef = useRef(mode)
  useEffect(() => {
    const requestKey = `${mode}::${trimmedTerm}`
    latestTermRef.current = requestKey

    const modeChanged = previousModeRef.current !== mode
    previousModeRef.current = mode
    if (modeChanged) {
      setRawItems([])
      setSearchUnavailable(false)
      setModeError(null)
      inputRef.current?.focus()
      // Re-open the dropdown so the user sees results under the new mode even
      // if the dropdown had collapsed (e.g. they clicked away after seeing
      // "No venues match" before switching to Profiles). forceOpen briefly
      // overrides antd's internal state; once cleared, antd manages naturally.
      if (trimmedTerm) {
        setForceOpen(true)
      }
    }

    if (mode === 'profiles' && trimmedTerm && isValidEmail(trimmedTerm)) {
      setModeError('Search profile by name or OpenReview profile ID.')
      setRawItems([])
      setSearchUnavailable(false)
      setLoading(false)
      return undefined
    }
    // Suppress search for partial tilde IDs — the API rejects ids that don't
    // match ^~.*\d+$ and would spam error toasts on every keystroke. The
    // search auto-fires once the user finishes typing a valid tilde ID; Enter
    // routes to /profile directly.
    if (
      mode === 'profiles' &&
      trimmedTerm.startsWith('~') &&
      !TILDE_ID_PATTERN.test(trimmedTerm)
    ) {
      setRawItems([])
      setSearchUnavailable(false)
      setModeError(null)
      setLoading(false)
      return undefined
    }
    setModeError(null)

    if (tokenizedTerm.length < MIN_SEARCH_LENGTH) {
      setRawItems([])
      setSearchUnavailable(false)
      setLoading(false)
      return undefined
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const { items, searchUnavailable: unavailable } = await MODES[mode].fetch(trimmedTerm)
        if (latestTermRef.current !== requestKey) return
        if (unavailable) {
          setSearchUnavailable(true)
          setRawItems([])
          return
        }
        setSearchUnavailable(false)
        setRawItems(items)
      } catch (error) {
        if (latestTermRef.current !== requestKey) return
        promptError(error.message)
      } finally {
        if (latestTermRef.current === requestKey) setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [mode, tokenizedTerm, trimmedTerm, activeVenues, openVenues])

  const displayedOptions = useMemo(() => {
    if (loading && rawItems.length === 0) {
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
    return MODES[mode].buildOptions(rawItems, {
      tokenizedTerm,
      trimmedTerm,
      activeVenues,
      openVenues,
      isPinned,
      togglePin,
    })
  }, [loading, rawItems, mode, tokenizedTerm, trimmedTerm, activeVenues, openVenues, isPinned, togglePin])

  const handleSelect = (value, option) => {
    if (value === LOADING_VALUE) return
    setImmediateSearchTerm('')
    setRawItems([])
    MODES[mode].onSelect(value, option, router)
  }

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return
    const term = trimmedTerm
    if (!term) return
    e.preventDefault()
    setImmediateSearchTerm('')
    setRawItems([])
    MODES[mode].onEnter(term, router)
  }

  let notFoundContent
  if (loading) {
    notFoundContent = (
      <span style={{ color: '#8c1b13' }}>
        <LoadingIcon />
      </span>
    )
  } else if (searchUnavailable) {
    notFoundContent = (
      <span style={{ color: '#8c1b13' }}>
        OpenReview is experiencing degraded performance in search functionality. Please try
        again later.
      </span>
    )
  } else if (modeError) {
    notFoundContent = <span style={{ color: '#8c1b13' }}>{modeError}</span>
  } else if (tokenizedTerm.length < MIN_SEARCH_LENGTH) {
    notFoundContent = `Type at least ${MIN_SEARCH_LENGTH} characters to search.`
  } else if (mode === 'profiles') {
    notFoundContent = `No profiles match "${trimmedTerm}".`
  } else if (mode === 'notes') {
    notFoundContent = `No papers, comments, or reviews match "${trimmedTerm}".`
  } else {
    notFoundContent = `No venues match "${trimmedTerm}".`
  }

  const popupRender = (menu) => {
    const footer = MODES[mode].footer({ trimmedTerm })
    return (
      <>
        {menu}
        {footer && (
          <>
            <Divider style={{ margin: '4px 0' }} />
            <div style={{ padding: '6px 12px' }}>{footer}</div>
          </>
        )}
      </>
    )
  }

  const autoComplete = (
    <AutoComplete
      value={immediateSearchTerm}
      options={displayedOptions}
      onChange={setImmediateSearchTerm}
      onSelect={handleSelect}
      popupRender={popupRender}
      notFoundContent={notFoundContent}
      allowClear
      virtual={false}
      style={{ flex: 1, width: '100%' }}
      popupMatchSelectWidth
      listHeight={250}
      open={forceOpen ? true : undefined}
      onDropdownVisibleChange={(open) => {
        if (!open && forceOpen) setForceOpen(false)
      }}
    >
      <Input
        ref={inputRef}
        placeholder={MODES[mode].placeholder}
        maxLength={200}
        onKeyDown={handleKeyDown}
        style={{ background: '#fff' }}
      />
    </AutoComplete>
  )

  const compactWidget = (
    <Space.Compact size="large" style={{ flex: 1, minWidth: 240 }}>
      <Select
        value={mode}
        onChange={setMode}
        options={modeOptions}
        className={styles.modeSelect}
      />
      {autoComplete}
    </Space.Compact>
  )

  const browseArea = (
    <div
      className={styles.browseAlign}
      style={{ marginTop: 16, width: '100%', maxWidth: 768, height: 32 }}
    >
      {mode === 'venues' && (
        <Link href="/all-venues">
          <Button type="link" style={{ padding: 0 }}>
            Browse all venues →
          </Button>
        </Link>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <section id="home-search">
        <Flex vertical gap={12} style={{ width: '100%' }}>
          <h1 style={{ margin: 0 }}>Search</h1>
          <Segmented
            size="large"
            value={mode}
            onChange={setMode}
            options={modeOptions}
            block
          />
          {autoComplete}
        </Flex>
        {browseArea}
      </section>
    )
  }

  return (
    <section id="home-search">
      <Flex align="flex-start" gap={16} style={{ width: '100%', maxWidth: 768 }}>
        <h1 style={{ margin: 0, flex: 'none', lineHeight: '40px' }}>Search</h1>
        <Flex vertical style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex' }}>{compactWidget}</div>
          {browseArea}
        </Flex>
      </Flex>
    </section>
  )
}
