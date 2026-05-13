'use client'

import { Button, Divider, Flex, Input, Select } from 'antd'
import { useMemo, useState } from 'react'
import VenueListItem from '../VenueListItem'
import { prettyId } from '../../../lib/utils'

const SORT_OPTIONS = [
  { label: 'A–Z', value: 'alpha' },
  { label: 'Year (newest)', value: 'year' },
]

const MAX_VISIBLE = 10

const getRole = (groupId) => groupId.split('/').pop() ?? ''

const getYear = (groupId) => {
  const match = groupId.match(/\b(19|20)\d{2}\b/)
  return match ? Number.parseInt(match[0], 10) : 0
}

const roleLabel = (role) => role.replace(/_/g, ' ')

export default function ActiveConsolesFiltered({ venues }) {
  const [filterText, setFilterText] = useState('')
  const [role, setRole] = useState('all')
  const [sort, setSort] = useState('alpha')
  const [expanded, setExpanded] = useState(false)

  const roleOptions = useMemo(() => {
    const roles = new Set()
    venues.forEach((v) => {
      const r = getRole(v.groupId)
      if (r) roles.add(r)
    })
    return [
      { label: 'All roles', value: 'all' },
      ...Array.from(roles)
        .sort((a, b) => a.localeCompare(b))
        .map((r) => ({ label: roleLabel(r), value: r })),
    ]
  }, [venues])

  const filtered = useMemo(() => {
    let result = venues
    if (role !== 'all') {
      result = result.filter((v) => getRole(v.groupId) === role)
    }
    const q = filterText.trim().toLowerCase()
    if (q) {
      result = result.filter((v) => prettyId(v.groupId).toLowerCase().includes(q))
    }
    if (sort === 'year') {
      result = [...result].sort((a, b) => getYear(b.groupId) - getYear(a.groupId))
    } else {
      result = [...result].sort((a, b) =>
        prettyId(a.groupId).localeCompare(prettyId(b.groupId))
      )
    }
    return result
  }, [venues, role, sort, filterText])

  if (!venues?.length) return null

  const visible = expanded ? filtered : filtered.slice(0, MAX_VISIBLE)
  const hasMore = filtered.length > MAX_VISIBLE

  return (
    <section style={{ maxWidth: 768, margin: '0 auto' }}>
      <h1>Your Active Consoles</h1>
      <Divider style={{ marginTop: 0, minWidth: 0 }} />

      <Flex gap={8} wrap="wrap" style={{ marginBottom: 16 }}>
        <Input
          placeholder="Filter consoles..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          allowClear
          style={{ flex: 1, minWidth: 180, maxWidth: 400, background: '#fff' }}
        />
        <Select
          value={role}
          onChange={setRole}
          options={roleOptions}
          style={{ width: 180 }}
        />
        <Select
          value={sort}
          onChange={setSort}
          options={SORT_OPTIONS}
          style={{ width: 160 }}
        />
      </Flex>

      {filtered.length === 0 ? (
        <p style={{ color: '#666' }}>No consoles match your filter.</p>
      ) : (
        <ul className="conferences" style={{ listStyle: 'none', padding: 0 }}>
          {visible.map((venue) => (
            <VenueListItem
              key={venue.groupId}
              groupId={venue.groupId}
              dueDate={venue.dueDate}
              hidden={false}
            />
          ))}
        </ul>
      )}

      {hasMore && (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show fewer venues' : `Show all ${filtered.length} venues`}
        </Button>
      )}
    </section>
  )
}
