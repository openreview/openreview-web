import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import debounce from 'lodash/debounce'
import LoadingSpinner from './LoadingSpinner'
import ErrorAlert from './ErrorAlert'
import Icon from './Icon'
import BasePaginatedList from './BasePaginatedList'

function DefaultListItem({ item }) {
  return (
    <Link href={item.href}>
      <a>{item.title}</a>
    </Link>
  )
}

export default function PaginatedList({
  loadItems,
  searchItems,
  ListItem,
  emptyMessage,
  itemsPerPage = 15,
  className,
}) {
  const [listItems, setListItems] = useState(null)
  const [totalCount, setTotalCount] = useState(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)

  const itemComponent = typeof ListItem === 'function' ? ListItem : DefaultListItem
  const enableSearch = typeof searchItems === 'function'

  const handleSearchTermChange = async (updatedSearchTerm) => {
    if (updatedSearchTerm) {
      try {
        const offset = (page - 1) * itemsPerPage
        const { items, count } = await searchItems(updatedSearchTerm, itemsPerPage, offset)
        setListItems(items)
        setTotalCount(count)
      } catch (apiError) {
        setError(apiError)
      }
    } else {
      setPage(1)
    }
  }

  const delaySearch = useCallback(
    debounce((term) => handleSearchTermChange(term), 300),
    [searchItems]
  )

  useEffect(() => {
    // Reset page when loading function changes
    setPage(1)
    setListItems(null)
  }, [loadItems])

  useEffect(() => {
    const fetchItems = async () => {
      const offset = (page - 1) * itemsPerPage

      try {
        const { items, count } = await loadItems(itemsPerPage, offset)
        setListItems(items)
        setTotalCount(count)
      } catch (apiError) {
        setError(apiError)
      }
    }

    if (typeof loadItems === 'function') {
      fetchItems()
    }
  }, [loadItems, page, itemsPerPage])

  if (error) return <ErrorAlert error={error} />

  return (
    <div>
      {enableSearch && (
        <form className="form-inline notes-search-form" role="search">
          <div className="form-group search-content has-feedback">
            <input
              type="text"
              className="form-control"
              placeholder="Search submissions by title and metadata"
              autoComplete="off"
              onChange={(e) => {
                const term = e.target.value.trim()
                if (term.length === 0) {
                  handleSearchTermChange('')
                } else if (term.length >= 3) {
                  delaySearch(e.target.value)
                }
              }}
              onKeyDown={(e) => {
                const term = e.target.value.trim()
                if (e.key === 'Enter' && term.length >= 2) {
                  handleSearchTermChange(e.target.value)
                }
              }}
            />
            <Icon name="search" extraClasses="form-control-feedback" />
          </div>
        </form>
      )}

      {listItems ? (
        <BasePaginatedList
          listItems={listItems}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          currentPage={page}
          setCurrentPage={setPage}
          ListItem={itemComponent}
          emptyMessage={emptyMessage}
          className={className}
        />
      ) : (
        <LoadingSpinner inline />
      )}
    </div>
  )
}
