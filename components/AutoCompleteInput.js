/* globals promptError: false */

// eslint-disable-next-line object-curly-newline
import React, { useState, useEffect, useCallback, useRef } from 'react'
import Router from 'next/router'
import { debounce } from 'lodash'
import Icon from './Icon'
import api from '../lib/api-client'
import { getTitleObjects, getTokenObjects } from '../client/search'

const AutoCompleteInput = () => {
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoCompleteItems, setAutoCompleteItems] = useState([])
  const [cancelRequest, setCancelRequest] = useState(false)
  const [hoverIndex, setHoverIndex] = useState(null)
  const autoCompleteItemsRef = useRef([]) // for scrolling hover item into view

  useEffect(() => {
    if (searchTerm.trim().length > 2) {
      // eslint-disable-next-line no-use-before-define
      searchByTerm(searchTerm)
      setHoverIndex(null)
      autoCompleteItemsRef.current = []
    }
  }, [searchTerm])

  useEffect(() => { // hide items when search term is cleared
    if (!immediateSearchTerm) setAutoCompleteItems([])
    setCancelRequest(false)
  }, [immediateSearchTerm])

  useEffect(() => {
    const handleRouteChange = (url) => {
      setCancelRequest(true)
      setAutoCompleteItems([])
      if (!url.startsWith('/search')) {
        setSearchTerm('')
        setImmediateSearchTerm('')
      }
    }
    Router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      Router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [])

  const delaySearch = useCallback(
    debounce(term => setSearchTerm(term), 300),
    [],
  )

  // eslint-disable-next-line no-shadow
  const searchByTerm = async (searchTerm) => {
    try {
      // eslint-disable-next-line object-curly-newline
      const result = await api.get('/notes/search', { type: 'prefix', term: searchTerm, content: 'all', group: 'all', source: 'all', limit: 10 })
      if (cancelRequest) return
      const tokenObjects = getTokenObjects(result.notes, searchTerm)
      const titleObjects = getTitleObjects(result.notes, searchTerm)
      if (tokenObjects.length && titleObjects.length) {
        setAutoCompleteItems([...tokenObjects, null, ...titleObjects]) // null maps to <hr/>
      } else {
        setAutoCompleteItems([...tokenObjects, ...titleObjects])
      }
    } catch (error) {
      promptError(error.message)
    }
  }

  const itemClickHandler = (item) => {
    setAutoCompleteItems([])
    if (item.section === 'titles') {
      Router.push({ pathname: '/forum', query: { id: item.forum, noteId: item.id } })
    } else if (item.value.startsWith('~')) {
      Router.push({ pathname: '/profile', query: { id: item.value } })
    } else {
      // eslint-disable-next-line object-curly-newline
      Router.push({ pathname: '/search', query: { term: item.value, content: 'all', group: 'all', source: 'all' } })
    }
  }

  const keyupHandler = (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return
    let newHoverIndexValue = null
    if (e.key === 'ArrowDown') {
      if (hoverIndex === null || hoverIndex === autoCompleteItems.length - 1) { // initial
        newHoverIndexValue = 0
      } else if (autoCompleteItems[hoverIndex + 1] === null) { // corssing section
        newHoverIndexValue = hoverIndex + 2
      } else { // normal
        newHoverIndexValue = hoverIndex + 1
      }
    }
    if (e.key === 'ArrowUp') {
      if (hoverIndex === null || hoverIndex === 0) { // initial
        newHoverIndexValue = autoCompleteItems.length - 1
      } else if (autoCompleteItems[hoverIndex - 1] === null) { // corssing section
        newHoverIndexValue = hoverIndex - 2
      } else { // normal
        newHoverIndexValue = hoverIndex - 1
      }
    }
    if (autoCompleteItems[newHoverIndexValue]) {
      setImmediateSearchTerm(autoCompleteItems[newHoverIndexValue]?.value ?? '')
      // eslint-disable-next-line no-unused-expressions
      autoCompleteItemsRef?.current?.[newHoverIndexValue]?.scrollIntoView()
    }

    setHoverIndex(newHoverIndexValue)
  }

  return (
    <>
      <div className="form-group has-feedback">
        <input
          name="term"
          type="text"
          className="form-control"
          autoComplete="off"
          placeholder="Search OpenReivew..."
          onChange={(e) => { setImmediateSearchTerm(e.target.value); delaySearch(e.target.value) }}
          value={immediateSearchTerm}
          onKeyDown={e => keyupHandler(e)}
        />
        <Icon name="search" extraClasses="form-control-feedback" />
      </div>
      {autoCompleteItems.length !== 0 && (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        <ul className="ui-menu ui-widget ui-widget-content ui-autocomplete ui-front">
          {/* eslint-disable-next-line arrow-body-style */}
          {autoCompleteItems.map((item, index) => {
            return item ? (
              <React.Fragment key={item.value}>
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <li className="menuItem ui-menu-item" onClick={() => itemClickHandler(item)} ref={(element) => { autoCompleteItemsRef.current[index] = element }} onKeyDown={e => keyupHandler(e)}>
                  {/* eslint-disable-next-line react/no-danger */}
                  <div className={`ui-menu-item-wrapper ${hoverIndex === index ? 'ui-state-active' : ''}`} dangerouslySetInnerHTML={{ __html: item.label }} />
                  {item.subtitle && (
                    // eslint-disable-next-line react/no-danger
                    <div className={`authlist ui-menu-item-wrapper ${hoverIndex === index ? 'ui-state-active' : ''}`} dangerouslySetInnerHTML={{ __html: item.subtitle }} />
                  )}
                </li>
              </React.Fragment>
            ) : <hr key="divider" className="ui-menu-divider ui-widget-content" />
          })}
        </ul>
      )}
    </>
  )
}

export default AutoCompleteInput
