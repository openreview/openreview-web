/* globals typesetMathJax: false */
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import debounce from 'lodash/debounce'
import LoadingSpinner from './LoadingSpinner'
import ErrorAlert from './ErrorAlert'
import Icon from './Icon'
import BasePaginatedList from './BasePaginatedList'

function DefaultListItem({ item }) {
  return (
    <Link href={item.href} prefetch={false}>
      {item.title}
    </Link>
  )
}

export default function PaginatedList({
  loadItems,
  searchItems,
  ListItem,
  emptyMessage,
  searchPlaceholder,
  itemsPerPage = 15,
  shouldReload,
  className,
}) {
  const [listItems, setListItems] = useState(null)
  const [totalCount, setTotalCount] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)

  const itemComponent = typeof ListItem === 'function' ? ListItem : DefaultListItem
  const enableSearch =
    typeof searchItems === 'function' &&
    (listItems === null || listItems?.length > 0 || searchTerm)

  const delaySearch = useCallback(
    debounce((term) => {
      setSearchTerm(term)
      setPage(1)
    }, 300),
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
        const { items, count } = await (enableSearch && searchTerm
          ? searchItems(searchTerm, itemsPerPage, offset)
          : loadItems(itemsPerPage, offset))
        setListItems(items)
        setTotalCount(count)
      } catch (apiError) {
        setError(apiError)
      }
    }

    if (typeof loadItems === 'function') {
      fetchItems()
    }
  }, [page, searchTerm, loadItems, searchItems, itemsPerPage, shouldReload])

  useEffect(() => {
    if (!listItems?.length) return
    typesetMathJax()
  }, [listItems])

  return (
    <div>
      {error && <ErrorAlert error={error} />}

      {enableSearch && (
        <form
          className="form-inline notes-search-form"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            const term = e.target[0].value.trim()
            if (term.length > 1) {
              setSearchTerm(term)
              setPage(1)
            }
          }}
        >
          <div className="form-group search-content has-feedback">
            <input
              type="text"
              className="form-control"
              placeholder={searchPlaceholder || 'Search submissions by title and metadata'}
              autoComplete="off"
              onChange={(e) => {
                const term = e.target.value.trim()
                if (term.length === 0) {
                  setSearchTerm('')
                  setPage(1)
                  setListItems(null)
                } else if (term.length > 2) {
                  delaySearch(term)
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
