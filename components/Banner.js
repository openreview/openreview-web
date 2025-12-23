import Link from 'next/link'
import useBreakpoint from '../hooks/useBreakPoint'

import styles from '../styles/components/Banner.module.scss'

const DonateBanner = () => {
  const isMobile = !useBreakpoint('lg')
  const defaultContent = isMobile ? (
    <div className={styles.donateBanner}>
      Help OpenReview,{' '}
      <Link href="/donate" className="donate-link">
        Donate
      </Link>{' '}
      today.
    </div>
  ) : (
    <div className={styles.donateBanner}>
      Help maintaining OpenReview by{' '}
      <a href="/donate" className="donate-link" target="_blank" rel="noopener noreferrer">
        donating
      </a>{' '}
      today. <span>Your contribution keeps OpenReview accessible.</span>
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
