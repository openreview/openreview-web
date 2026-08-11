'use client'

import Link from 'next/link'

import legacyNavStyles from '../styles/components/legacy-bootstrap-nav.module.scss'
import styles from '../styles/components/nav.module.scss'

export default function GlobalError({ error }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <div id="__next">
          <nav className={`${styles.navBar} ${legacyNavStyles.navBar}`} role="navigation">
            <div
              className={`${styles.navDesktop} ${legacyNavStyles.navContainer}`}
              style={{ display: 'flex' }}
            >
              <Link href="/" className={legacyNavStyles.navBrand}>
                <strong>OpenReview</strong>.net
              </Link>
            </div>
          </nav>
          <div id="or-banner" className="banner">
            <div className="container">
              <div className="row">
                <div className="col-xs-12">
                  <span className="tagline">
                    Open Peer Review. Open Publishing. Open Access.{' '}
                    <span className="hidden-xs">Open Discussion. Open Recommendations.</span>{' '}
                    <span className="hidden-xs hidden-sm">
                      Open Directory. Open API. Open Source.
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className={'container'}>
            <div className="row">
              <main id="content">
                <div className="row error-display">
                  <header className="col-xs-12 col-md-10 col-md-offset-1 text-center">
                    <h1>Error</h1>
                    <hr />
                  </header>
                  <div className="col-xs-12 col-md-10 col-md-offset-1 text-center">
                    <h4>The server responded with the following message:</h4>
                    <pre className="error-message">{error.message}</pre>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
