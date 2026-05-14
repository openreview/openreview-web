'use client'

import { Flex, Segmented, Select } from 'antd'
import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

import styles from './Search.module.scss'

const defaultGroupOption = { value: 'all', label: 'all of OpenReview' }

const contentOptions = [
  { value: 'all', label: 'All Content' },
  { value: 'authors', label: 'Authors' },
  { value: 'tags', label: 'Tags' },
  { value: 'keywords', label: 'Keywords' },
]

export default function FilterForm({ searchQuery, sourceOptions }) {
  const [groupOptions, setGroupOptions] = useState([defaultGroupOption])
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    api
      .get('/groups', { id: 'host' })
      .then(({ groups }) => {
        if (cancelled) return
        if (groups?.length > 0) {
          const members = groups[0].members.map((groupId) => ({
            value: groupId,
            label: prettyId(groupId),
          }))
          setGroupOptions(
            [defaultGroupOption].concat(
              members.sort((a, b) => a.label.localeCompare(b.label))
            )
          )
        }
      })
      .catch(() => {
        // keep default
      })
    return () => {
      cancelled = true
    }
  }, [])

  const updateQuery = (field, value) => {
    const newSearchQuery = { ...searchQuery, [field]: value }
    router.push(`/search?${stringify(newSearchQuery)}`)
  }

  const sourceSegmentedOptions = Object.entries(sourceOptions).map(([val, label]) => ({
    value: val,
    label,
  }))

  return (
    <Flex align="center" gap={12} wrap="wrap" className={styles.filterRow}>
      <span>Search over</span>
      <Select
        value={searchQuery.content || 'all'}
        onChange={(v) => updateQuery('content', v)}
        options={contentOptions}
        variant="borderless"
        size="small"
        style={{ minWidth: 120 }}
      />
      <span>in</span>
      <Select
        value={searchQuery.group || 'all'}
        onChange={(v) => updateQuery('group', v)}
        options={groupOptions}
        showSearch
        optionFilterProp="label"
        variant="borderless"
        size="small"
        style={{ minWidth: 180 }}
      />
      <span>Source</span>
      <Segmented
        value={searchQuery.source || 'all'}
        onChange={(v) => updateQuery('source', v)}
        options={sourceSegmentedOptions}
      />
    </Flex>
  )
}
