'use client'

import { ConfigProvider, Input, Tabs } from 'antd'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { stringify } from 'query-string'
import styles from './Search.module.scss'
import Search from './Search'
import FilterForm from './FilterForm'
import VenuesResults from './VenuesResults'
import ProfilesResults from './ProfilesResults'
import ErrorAlert from '../../components/ErrorAlert'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'
import { formatGroupResults } from '../../lib/utils'

const sourceOptions = { all: 'All', forum: 'Papers Only', reply: 'Replies Only' }

const formatInvitationResults = (apiRes) =>
  apiRes.invitations
    .map((inv) => ({ groupId: inv.id.split('/-/')[0], dueDate: inv.duedate }))
    .filter((p, index, arr) => index === arr.findIndex((q) => q.groupId === p.groupId))
    .sort((a, b) => a.dueDate - b.dueDate)

function SearchBar({ defaultValue }) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue ?? '')
  useEffect(() => {
    setValue(defaultValue ?? '')
  }, [defaultValue])

  const submit = (term) => {
    const trimmed = term.trim()
    if (!trimmed) return
    // New search starts fresh — no notes-only filter params carried over.
    router.push(`/search?${stringify({ term: trimmed })}`)
  }

  return (
    <Input.Search
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onSearch={submit}
      placeholder="Search venues, papers, profiles..."
      enterButton="Search"
      size="large"
      allowClear
      style={{ marginBottom: 16, maxWidth: 768 }}
    />
  )
}

function Page() {
  const searchParams = useSearchParams()
  const { user } = useUser()
  const isLoggedIn = !!user
  const [activeTab, setActiveTab] = useState('venues')
  const [counts, setCounts] = useState({})
  const [activeVenues, setActiveVenues] = useState([])
  const [openVenues, setOpenVenues] = useState([])
  // Track which term we've already auto-switched for — only re-evaluate the
  // active tab on a fresh search, never override an explicit tab click later.
  const autoSwitchedTermRef = useRef(null)

  useEffect(() => {
    api
      .get('groups', { id: 'active_venues' })
      .then(formatGroupResults)
      .then(setActiveVenues)
      .catch(() => setActiveVenues([]))
    api
      .get('/invitations', { invitee: '~', pastdue: false, type: 'note' })
      .then(formatInvitationResults)
      .then(setOpenVenues)
      .catch(() => setOpenVenues([]))
  }, [])

  const query = useMemo(
    () => ({
      term: searchParams.get('term'),
      content: searchParams.get('content'),
      group: searchParams.get('group'),
      source: searchParams.get('source'),
    }),
    [searchParams]
  )

  // Reset counts when the term changes; keep the activeTab so the user's
  // explicit tab choice survives across new searches.
  useEffect(() => {
    setCounts({})
  }, [query.term])

  // Auto-switch logic — runs ONCE per term:
  //   - Wait until all configured tabs have reported their counts.
  //   - If the current active tab has results, stay on it (respects user choice).
  //   - Otherwise switch to the first non-empty tab in display order.
  useEffect(() => {
    if (!query.term) return
    if (autoSwitchedTermRef.current === query.term) return
    const tabKeys = isLoggedIn ? ['venues', 'notes', 'profiles'] : ['venues', 'notes']
    const allLoaded = tabKeys.every((k) => counts[k] !== undefined)
    if (!allLoaded) return
    autoSwitchedTermRef.current = query.term
    if ((counts[activeTab] ?? 0) > 0) return
    const firstNonEmpty = tabKeys.find((k) => (counts[k] ?? 0) > 0)
    if (firstNonEmpty && firstNonEmpty !== activeTab) {
      setActiveTab(firstNonEmpty)
    }
  }, [counts, isLoggedIn, activeTab, query.term])

  const setVenuesCount = useCallback(
    (n) => setCounts((c) => ({ ...c, venues: n })),
    []
  )
  const setNotesCount = useCallback(
    (n) => setCounts((c) => ({ ...c, notes: n })),
    []
  )
  const setProfilesCount = useCallback(
    (n) => setCounts((c) => ({ ...c, profiles: n })),
    []
  )

  const handleTabChange = (key) => {
    // User clicked — lock in their choice so subsequent renders don't switch back.
    autoSwitchedTermRef.current = query.term
    setActiveTab(key)
  }

  if (!query.term) return <ErrorAlert error={{ message: 'Missing search term or query' }} />

  const tabLabel = (label, key) => {
    const count = counts[key]
    return (
      <span>
        {label}
        {count !== undefined && (
          <span
            style={{
              marginLeft: 6,
              color: count > 0 ? 'inherit' : '#bbb',
              fontWeight: count > 0 ? 600 : 400,
            }}
          >
            ({count})
          </span>
        )}
      </span>
    )
  }

  const tabItems = [
    {
      key: 'venues',
      label: tabLabel('Venues', 'venues'),
      forceRender: true,
      children: (
        <VenuesResults
          term={query.term}
          activeVenues={activeVenues}
          openVenues={openVenues}
          onResultCount={setVenuesCount}
        />
      ),
    },
    {
      key: 'notes',
      label: tabLabel('Notes', 'notes'),
      forceRender: true,
      children: (
        <>
          <FilterForm searchQuery={query} sourceOptions={sourceOptions} />
          <Search
            searchQuery={query}
            sourceOptions={sourceOptions}
            onResultCount={setNotesCount}
          />
        </>
      ),
    },
  ]
  if (isLoggedIn) {
    tabItems.push({
      key: 'profiles',
      label: tabLabel('Profiles', 'profiles'),
      forceRender: true,
      children: (
        <ProfilesResults term={query.term} onResultCount={setProfilesCount} />
      ),
    })
  }

  return (
    <div className={styles.search}>
      <SearchBar defaultValue={query.term} />
      <ConfigProvider
        theme={{
          components: {
            Tabs: {
              itemSelectedColor: '#8c1b13',
              itemHoverColor: '#8c1b13',
              inkBarColor: '#8c1b13',
              titleFontSize: 16,
            },
          },
        }}
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
      </ConfigProvider>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Page />
    </Suspense>
  )
}
