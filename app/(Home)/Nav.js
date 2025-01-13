import Link from 'next/link'
import NavUserLinks from './NavUserLinks'
import NavSearch from './NavSearch'

function Nav() {
  return (
    <nav className="navbar navbar-inverse" role="navigation">
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
          <Link href="/" className="navbar-brand home push-link">
            <strong>OpenReview</strong>.net
          </Link>
        </div>

        <div id="navbar" className="navbar-collapse collapse">
          <NavSearch />
          <NavUserLinks />
        </div>
      </div>
    </nav>
  )
}

export default Nav
