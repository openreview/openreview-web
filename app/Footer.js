import Link from 'next/link'

export default function Footer() {
  return (
    <>
      <footer className="sitemap">
        <div className="container">
          {/* 3 Column Layout for Tablet and Desktop */}
          <div className="row hidden-xs">
            <div className="col-sm-4">
              <ul className="list-unstyled">
                <li>
                  <Link href="/about">About OpenReview</Link>
                </li>
                <li>
                  <Link href={`/group?id=${process.env.SUPER_USER}/Support`}>
                    Hosting a Venue
                  </Link>
                </li>
                <li>
                  <Link href="/venues">All Venues</Link>
                </li>
              </ul>
            </div>

            <div className="col-sm-4">
              <ul className="list-unstyled">
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
                <li>
                  <Link href="/sponsors">Sponsors</Link>
                </li>
                <li>
                  <Link href="https://donate.stripe.com/eVqdR8fP48bK1R61fi0oM00">
                    <strong>Donate</strong>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-sm-4">
              <ul className="list-unstyled">
                <li>
                  <a href="https://docs.openreview.net/getting-started/frequently-asked-questions">
                    FAQ
                  </a>
                </li>
                <li>
                  <Link href="/legal/terms">Terms of Use</Link> /{' '}
                  <Link href="/legal/privacy">Privacy Policy</Link>
                </li>
                <li>
                  <Link
                    href={`/group?id=${process.env.SUPER_USER}/News&referrer=[Homepage](/)`}
                  >
                    News
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* 2 Column Layout for Mobile */}
          <div className="row visible-xs-block">
            <div className="col-xs-6">
              <ul className="list-unstyled">
                <li>
                  <Link href="/about">About OpenReview</Link>
                </li>
                <li>
                  <Link href={`/group?id=${process.env.SUPER_USER}/Support`}>
                    Hosting a Venue
                  </Link>
                </li>
                <li>
                  <Link href="/venues">All Venues</Link>
                </li>
                <li>
                  <Link href="/sponsors">Sponsors</Link>
                </li>
                <li>
                  <Link
                    href={`/group?id=${process.env.SUPER_USER}/News&referrer=[Homepage](/)`}
                  >
                    News
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-xs-6">
              <ul className="list-unstyled">
                <li>
                  <a href="https://docs.openreview.net/getting-started/frequently-asked-questions">
                    FAQ
                  </a>
                </li>
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
                <li>
                  <Link href="https://donate.stripe.com/eVqdR8fP48bK1R61fi0oM00">
                    <strong>Donate</strong>
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms">Terms of Use</Link>
                </li>
                <li>
                  <Link href="/legal/privacy">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <div className="sponsor">
        <div className="container">
          <div className="row">
            <div className="col-sm-10 col-sm-offset-1">
              <p className="text-center">
                <a href="/about" target="_blank">
                  OpenReview
                </a>{' '}
                is a long-term project to advance science through improved peer review with
                legal nonprofit status. We gratefully acknowledge the support of the{' '}
                <a href="/sponsors" target="_blank">
                  OpenReview Sponsors
                </a>
                . &copy; {new Date().getFullYear()} OpenReview
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
