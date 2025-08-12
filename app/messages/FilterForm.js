'use client'

/* globals $: false */
import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { stringify } from 'query-string'
import { debounce, omit } from 'lodash'
import MultiSelectorDropdown from '../../components/MultiSelectorDropdown'
import Icon from '../../components/Icon'

export default function FilterForm({ searchQuery, statusOptions }) {
  const queryStatus = searchQuery?.status ?? []
  const queryStatutes = Array.isArray(queryStatus) ? queryStatus : [queryStatus]
  const selectedStatuses = queryStatutes.filter((s) =>
    statusOptions.map((o) => o.value).includes(s)
  )
  const router = useRouter()

  useEffect(() => {
    $('[data-toggle="tooltip"]').tooltip({ container: 'body' })
  }, [])

  const onFiltersChange = useCallback(
    debounce((field, value) => {
      const newSearchQuery = value
        ? { ...searchQuery, [field]: value }
        : { ...omit(searchQuery, field) }

      router.push(`/messages?${stringify(newSearchQuery)}`)
    }, 500)
  )

  return (
    <form className="filter-controls form-inline well" onSubmit={(e) => e.preventDefault()}>
      <div className="form-group">
        <label htmlFor="status-search-dropdown">Status:</label>
        <MultiSelectorDropdown
          id="status-search-dropdown"
          options={statusOptions}
          selectedValues={selectedStatuses}
          setSelectedValues={(values) => onFiltersChange('status', values)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="subject-search-input">Subject:</label>
        <Icon
          name="info-sign"
          tooltip="To perform a prefix search, add .* at the end of the subject. For example: [ABC.*"
          extraClasses="mr-1"
        />
        <input
          type="text"
          id="subject-search-input"
          className="form-control"
          placeholder="Message subject"
          defaultValue={searchQuery?.subject ?? ''}
          onChange={(e) => onFiltersChange('subject', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="to-search-input">To:</label>
        <input
          type="text"
          id="to-search-input"
          className="form-control"
          placeholder="To address"
          defaultValue={searchQuery?.to ?? ''}
          onChange={(e) => onFiltersChange('to', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="parent-group-search-input">Parent:</label>
        <input
          type="text"
          id="parent-group-search-input"
          className="form-control"
          placeholder="Parent group"
          defaultValue={searchQuery?.parentGroup ?? ''}
          onChange={(e) => onFiltersChange('parentGroup', e.target.value)}
        />
      </div>
    </form>
  )
}
