import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import { useEffect, useState } from 'react'
import Dropdown from '../../components/Dropdown'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

export default function FilterForm({ searchQuery, sourceOptions }) {
  const defaultOption = [{ value: 'all', label: 'all of OpenReview' }]
  const [groupOptions, setGroupOptions] = useState([])
  const [isClientRendering, setIsClientRendering] = useState(false)

  const selectedGroupOption =
    groupOptions.find((option) => option.value === searchQuery.group) || defaultOption[0]

  const contentOptions = [
    { value: 'all', label: 'All Content' },
    { value: 'authors', label: 'Authors' },
    { value: 'tags', label: 'Tags' },
    { value: 'keywords', label: 'Keywords' },
  ]
  const selectedContentOption =
    contentOptions.find((option) => option.value === searchQuery.content) || contentOptions[0]
  const router = useRouter()

  useEffect(() => {
    setIsClientRendering(true)
    const getGroupOptions = async () => {
      try {
        const { groups } = await api.get('/groups', { id: 'host' })
        if (groups?.length > 0) {
          const members = groups[0].members.map((groupId) => ({
            value: groupId,
            label: prettyId(groupId),
          }))
          setGroupOptions(
            [defaultOption].concat(members.sort((a, b) => a.label.localeCompare(b.label)))
          )
        } else {
          setGroupOptions([defaultOption])
        }
      } catch (error) {
        setGroupOptions([defaultOption])
      }
    }

    getGroupOptions()
  }, [])

  const updateQuery = (field, value) => {
    const newSearchQuery = { ...searchQuery, [field]: value }
    router.push(`/search?${stringify(newSearchQuery)}`)
  }

  if (!isClientRendering) return null
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
          options={groupOptions}
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
