'use client'

/* globals promptError: false */

import { useState, useEffect, useCallback, useRef } from 'react'
import debounce from 'lodash/debounce'
import { usePathname, useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import Icon from './Icon'
import api from '../lib/api-client'
import { getTitleObjects, getTokenObjects } from '../lib/utils'
import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

const AutoCompleteInput = () => {
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoCompleteItems, setAutoCompleteItems] = useState([])
  const [cancelRequest, setCancelRequest] = useState(false)
  const [hoverIndex, setHoverIndex] = useState(null)
  const autoCompleteItemsRef = useRef([]) // for scrolling hover item into view
  const router = useRouter()
  const pathName = usePathname()

  useEffect(() => {
    if (searchTerm.trim().length > 2) {
      searchByTerm(searchTerm)
      setHoverIndex(null)
      autoCompleteItemsRef.current = []
    }
  }, [searchTerm])

  useEffect(() => {
    // Hide items when search term is cleared
    if (!immediateSearchTerm) setAutoCompleteItems([])
    setCancelRequest(false)
  }, [immediateSearchTerm])

  useEffect(() => {
    if (pathName !== '/search') {
      setSearchTerm('')
      setImmediateSearchTerm('')
    }
  }, [pathName])

  const delaySearch = useCallback(
    debounce((term) => setSearchTerm(term), 300),
    []
  )

  const searchByTerm = async (term) => {
    try {
      const { notes } = await api.getCombined(
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

      if (cancelRequest) return

      const tokenObjects = getTokenObjects(notes, term)
      const titleObjects = getTitleObjects(notes, term)
      if (tokenObjects.length && titleObjects.length) {
        setAutoCompleteItems([...tokenObjects, null, ...titleObjects]) // null maps to <hr/>
      } else {
        setAutoCompleteItems([...tokenObjects, ...titleObjects])
      }
    } catch (error) {
      promptError(`There was an error while searching for "${term}".`)
    }
  }

  const itemClickHandler = (item) => {
    setAutoCompleteItems([])
    if (item.section === 'titles') {
      const query =
        item.forum === item.id ? { id: item.forum } : { id: item.forum, noteId: item.id }
      router.push(`/forum?${stringify(query)}`)
    } else if (item.value.startsWith('~')) {
      router.push(`/profile?${stringify({ id: item.value })}`)
    } else {
      setImmediateSearchTerm('')
      router.push(
        `/search?${stringify({ term: item.value, content: 'all', group: 'all', source: 'all' })}`
      )
    }
  }

  const keyDownHandler = (e) => {
    if (e.key === 'Enter') {
      setCancelRequest(true)
      setAutoCompleteItems([])
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Escape'].includes(e.key)) return

    if (e.key === 'Escape') {
      setCancelRequest(true)
      setAutoCompleteItems([])
      return
    }

    let newHoverIndexValue = null
    if (e.key === 'ArrowDown') {
      if (hoverIndex === null || hoverIndex === autoCompleteItems.length - 1) {
        // initial
        newHoverIndexValue = 0
      } else if (autoCompleteItems[hoverIndex + 1] === null) {
        // corssing section
        newHoverIndexValue = hoverIndex + 2
      } else {
        // normal
        newHoverIndexValue = hoverIndex + 1
      }
    } else if (e.key === 'ArrowUp') {
      if (hoverIndex === null || hoverIndex === 0) {
        // initial
        newHoverIndexValue = autoCompleteItems.length - 1
      } else if (autoCompleteItems[hoverIndex - 1] === null) {
        // corssing section
        newHoverIndexValue = hoverIndex - 2
      } else {
        // normal
        newHoverIndexValue = hoverIndex - 1
      }
    }

    if (autoCompleteItems[newHoverIndexValue]) {
      setImmediateSearchTerm(autoCompleteItems[newHoverIndexValue].value ?? '')
      autoCompleteItemsRef.current[newHoverIndexValue].scrollIntoView(false)
    }
    setHoverIndex(newHoverIndexValue)
  }

  return (
    <>
      <Input
        name="term"
        value={immediateSearchTerm}
        placeholder="Search OpenReview..."
        onChange={(e) => {
          setImmediateSearchTerm(e.target.value)
          delaySearch(e.target.value)
        }}
        onKeyDown={(e) => keyDownHandler(e)}
        suffix={<SearchOutlined />}
        style={{ borderColor: 'transparent' }}
      />

      {autoCompleteItems.length !== 0 && (
        <ul className="ui-menu ui-widget ui-widget-content ui-autocomplete">
          {autoCompleteItems.map((item, index) => {
            const activeClass = hoverIndex === index ? 'ui-state-active' : ''
            return item ? (
              <li
                key={`${item.value}${index}`}
                className="menuItem ui-menu-item"
                role="presentation"
                onClick={() => itemClickHandler(item)}
                ref={(element) => {
                  autoCompleteItemsRef.current[index] = element
                }}
              >
                <div
                  className={`ui-menu-item-wrapper ${activeClass}`}
                  dangerouslySetInnerHTML={{ __html: item.label }}
                />
                {item.subtitle && (
                  <div
                    className={`authlist ui-menu-item-wrapper ${activeClass}`}
                    dangerouslySetInnerHTML={{ __html: item.subtitle }}
                  />
                )}
              </li>
            ) : (
              <hr key="divider" className="ui-menu-divider ui-widget-content" />
            )
          })}
        </ul>
      )}
    </>
  )
}

export default AutoCompleteInput
