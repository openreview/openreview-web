'use client'

import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import Dropdown from '../../components/Dropdown'

export default function FilterForm({ searchQuery, sourceOptions, groupOptions }) {
  const defaultOption = [{ value: 'all', label: 'all of OpenReview' }]
  const fullGroupOptions = defaultOption.concat(groupOptions)

  const selectedGroupOption =
    fullGroupOptions.find((option) => option.value === searchQuery.group) || defaultOption[0]

  const contentOptions = [
    { value: 'all', label: 'All Content' },
    { value: 'authors', label: 'Authors' },
    { value: 'tags', label: 'Tags' },
    { value: 'keywords', label: 'Keywords' },
  ]
  const selectedContentOption =
    contentOptions.find((option) => option.value === searchQuery.content) || contentOptions[0]
  const router = useRouter()

  const updateQuery = (field, value) => {
    const newSearchQuery = { ...searchQuery, [field]: value }
    router.push(`/search?${stringify(newSearchQuery)}`)
  }

  return (
    <form className="filter-form form-inline well" onSubmit={(e) => e.preventDefault()}>
      <div className="form-group">
        <label htmlFor="search-content">Search over</label>
        <Dropdown
          name="content"
          className="search-content dropdown-select"
          options={contentOptions}
          value={selectedContentOption}
          onChange={(selectedOption) => updateQuery('content', selectedOption.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="search-group">in</label>
        <Dropdown
          name="group"
          className="search-group dropdown-select"
          options={fullGroupOptions}
          value={selectedGroupOption}
          onChange={(selectedOption) => updateQuery('group', selectedOption.value)}
          isSearchable
          filterOption={{
            ignoreCase: true,
            ignoreAccents: true,
            trim: true,
            matchFrom: 'start',
            stringify: (option) => option.label,
          }}
        />
      </div>
      <div className="form-group">
        {Object.entries(sourceOptions).map(([val, label]) => (
          <label key={val} className="radio-inline">
            <input
              type="radio"
              name="source"
              value={val}
              checked={searchQuery.source === val}
              onChange={(e) => updateQuery('source', e.target.value)}
            />{' '}
            {label}
          </label>
        ))}
      </div>
    </form>
  )
}
