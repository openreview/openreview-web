import Link from 'next/link'
import NavUserLinks from './NavUserLinks'

const Nav = () => (
  <nav className="navbar navbar-inverse navbar-fixed-top" role="navigation">
    <div className="container">

      <div className="navbar-header">
        <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
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
        <form className="navbar-form navbar-left profile-search" role="search">
          <div className="form-group has-feedback">
            <input id="search_input" type="text" className="form-control" placeholder="Search OpenReview..." autoComplete="off" />
            <span className="glyphicon glyphicon-search form-control-feedback" aria-hidden="true" />
          </div>

          <input id="search_group" type="hidden" value="all" />
          <input id="search_content" type="hidden" value="all" />
        </form>

        <NavUserLinks />
      </div>

    </div>
  </nav>
)

export default Nav
