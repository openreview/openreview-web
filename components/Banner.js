import Link from 'next/link'
import useBreakpoint from '../hooks/useBreakPoint'

import styles from '../styles/components/Banner.module.scss'

const DonateBanner = () => {
  const isMobile = !useBreakpoint('lg')
  const defaultContent = isMobile ? (
    <div className={styles.donateBanner}>
      Open Peer Review. Open Publishing. Open Access.{' '}
      <Link href="/donate" className="donate-link">
        Donate
      </Link>
    </div>
  ) : (
    <div className={styles.donateBanner}>
      Open Peer Review. Open Publishing. Open Access.{' '}
      <span className="hidden-xs">Open Discussion. Open Recommendations.</span>{' '}
      <span className="hidden-xs hidden-sm">Open Directory. Open API. Open Source.</span>{' '}
      <Link href="/donate" className="donate-link">
        Donate
      </Link>
    </div>
  )
  return (
    <div id="or-banner" className="banner" role="banner">
      <div className="container">
        <div className="row">
          <div className="col-xs-12">{defaultContent}</div>
        </div>
      </div>
    </div>
  )
}

export default function Banner({ hidden, children }) {
  if (hidden) return null
  if (!children) return <DonateBanner />

  return (
    <div id="or-banner" className="banner" role="banner">
      <div className="container">
        <div className="row">
          <div className="col-xs-12">{children}</div>
        </div>
      </div>
    </div>
  )
}
