import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import NavUserLinks from './NavUserLinks'
import AutoCompleteInput from './AutoCompleteInput'

import '../styles/components/nav.less'

function Nav() {
  const router = useRouter()
  const [term, setTerm] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const query = {
      term,
      group: 'all',
      content: 'all',
      source: 'all',
      sort: 'cdate:desc',
    }
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
            <AutoCompleteInput setNavTerm={setTerm} />
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

export default Nav
