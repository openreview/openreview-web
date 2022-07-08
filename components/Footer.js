import Link from 'next/link'

const Footer = () => (
  <>
    <footer className="sitemap">
      <div className="container">

        {/* 3 Column Layout for Tablet and Desktop */}
        <div className="row hidden-xs">
          <div className="col-sm-4">
            <ul className="list-unstyled">
              <li><Link href="/about"><a>About OpenReview</a></Link></li>
              <li><Link href={`/group?id=${process.env.SUPER_USER}/Support`}><a>Hosting a Venue</a></Link></li>
              <li><Link href="/venues"><a>All Venues</a></Link></li>
            </ul>
          </div>

          <div className="col-sm-4">
            <ul className="list-unstyled">
              <li><Link href="/contact"><a>Contact</a></Link></li>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <li><a href="#" data-toggle="modal" data-target="#feedback-modal">Feedback</a></li>
              <li><Link href="/sponsors"><a>Sponsors</a></Link></li>
              <li><a className="join-the-team" href="https://codeforscience.org/jobs?job=OpenReview-Developer" target="_blank" rel="noopener noreferrer"><strong>Join the Team</strong></a></li>
            </ul>
          </div>

          <div className="col-sm-4">
            <ul className="list-unstyled">
              <li><a href="https://docs.openreview.net/getting-started/frequently-asked-questions">Frequently Asked Questions</a></li>
              <li><Link href="/legal/terms"><a>Terms of Service</a></Link></li>
              <li><Link href="/legal/privacy"><a>Privacy Policy</a></Link></li>
            </ul>
          </div>
        </div>

        {/* 2 Column Layout for Mobile */}
        <div className="row visible-xs-block">
          <div className="col-xs-6">
            <ul className="list-unstyled">
              <li><Link href="/about"><a>About OpenReview</a></Link></li>
              <li><Link href={`/group?id=${process.env.SUPER_USER}/Support`}><a>Hosting a Venue</a></Link></li>
              <li><Link href="/venues"><a>All Venues</a></Link></li>
              <li><Link href="/sponsors"><a>Sponsors</a></Link></li>
              <li><a className="join-the-team" href="https://codeforscience.org/jobs?job=OpenReview-Developer" target="_blank" rel="noopener noreferrer"><strong>Join the Team</strong></a></li>
            </ul>
          </div>

          <div className="col-xs-6">
            <ul className="list-unstyled">
              <li><a href="https://docs.openreview.net/getting-started/frequently-asked-questions">Frequently Asked Questions</a></li>
              <li><Link href="/contact"><a>Contact</a></Link></li>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <li><a href="#" data-toggle="modal" data-target="#feedback-modal">Feedback</a></li>
              <li><Link href="/legal/terms"><a>Terms of Service</a></Link></li>
              <li><Link href="/legal/privacy"><a>Privacy Policy</a></Link></li>
            </ul>
          </div>
        </div>

      </div>
    </footer>

    <footer className="sponsor">
      <div className="container">
        <div className="row">
          <div className="col-sm-10 col-sm-offset-1">
            <p className="text-center">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/about" target="_blank">OpenReview</a>
              {' '}
              is a long-term project to advance science through improved peer review,
              with legal nonprofit status through
              {' '}
              <a href="https://codeforscience.org/" target="_blank" rel="noopener noreferrer">
                Code for Science & Society
              </a>
              . We gratefully acknowledge the support of the
              {' '}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/sponsors" target="_blank">OpenReview Sponsors</a>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  </>
)

export default Footer
