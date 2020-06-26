/* eslint-disable no-use-before-define */
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import { useState, useEffect, useCallback } from 'react'
import { debounce } from 'lodash'
import NavUserLinks from './NavUserLinks'
import Icon from './Icon'
import api from '../lib/api-client'
import { getTitleObjects, getTokenObjects } from '../client/search'

import '../styles/components/nav.less'

function Nav() {
  const router = useRouter()

  const handleSearch = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const query = {}
    formData.forEach((value, name) => {
      query[name] = value
    })
    router.push({ pathname: '/search', query })
  }

  return (
    <nav className="navbar navbar-inverse navbar-fixed-top" role="navigation">
      <div className="container">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#navbar"
            aria-expanded="false"
            aria-controls="navbar"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar" />
            <span className="icon-bar" />
            <span className="icon-bar" />
          </button>
          <Link href="/">
            <a className="navbar-brand home push-link">
              <strong>OpenReview</strong>
              .net
            </a>
          </Link>
        </div>

        <div id="navbar" className="navbar-collapse collapse">
          <form
            className="navbar-form navbar-left profile-search"
            role="search"
            onSubmit={handleSearch}
          >
            <AutoCompleteInput />
            <input name="group" type="hidden" value="all" />
            <input name="content" type="hidden" value="all" />
            <input name="source" type="hidden" value="all" />
            <input name="sort" type="hidden" value="cdate:desc" />
          </form>

          <NavUserLinks />
        </div>
      </div>
    </nav>
  )
}

const AutoCompleteInput = () => {
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoCompleteItems, setAutoCompleteItems] = useState([])

  useEffect(() => {
    if (searchTerm.trim().length > 2) {
      // eslint-disable-next-line no-use-before-define
      searchByTerm(searchTerm)
    }
  }, [searchTerm])

  Router.events.on('routeChangeStart', () => { setSearchTerm(''); setImmediateSearchTerm('') })

  const delayedQuery = useCallback(
    debounce(term => setSearchTerm(term), 300),
    [],
  )

  // eslint-disable-next-line no-shadow
  const searchByTerm = async (searchTerm) => {
    // eslint-disable-next-line object-curly-newline
    const result = await api.get('/notes/search', { type: 'prefix', term: searchTerm, content: 'all', group: 'all', source: 'all', limit: 10 })
    const tokenObjects = getTokenObjects(result.notes, searchTerm)
    const titleObjects = getTitleObjects(result.notes, searchTerm)
    setAutoCompleteItems([...tokenObjects, null, ...titleObjects])
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

  return (
    <>
      <div className="form-group has-feedback">
        <input name="term" type="text" className="form-control" placeholder="Search OpenReivew..." onChange={(e) => { setImmediateSearchTerm(e.target.value); delayedQuery(e.target.value) }} value={immediateSearchTerm} />
        <Icon name="search" extraClasses="form-control-feedback" />
      </div>
      {autoCompleteItems.length !== 0 && (
        <ul className="ui-menu ui-widget ui-widget-content ui-autocomplete ui-front">
          {/* eslint-disable-next-line arrow-body-style */}
          {autoCompleteItems.map((item) => {
            return item ? (
              <>
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <li key={item.value} className="menuItem ui-menu-item" onClick={() => itemClickHandler(item)}>
                  {/* eslint-disable-next-line react/no-danger */}
                  <div className="ui-menu-item-wrapper" dangerouslySetInnerHTML={{ __html: item.label }} />
                  {
                    item.subtitle && (
                      // eslint-disable-next-line react/no-danger
                      <div className="authlist ui-menu-item-wrapper" dangerouslySetInnerHTML={{ __html: item.subtitle }} />
                    )
                  }
                </li>
              </>
            ) : <hr className="ui-menu-divider ui-widget-content" />
          })}
        </ul>
      )}
    </>
  )
}

export default Nav
