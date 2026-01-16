import Link from 'next/link'
import useBreakpoint from '../hooks/useBreakPoint'

import styles from '../styles/components/Banner.module.scss'
import { Alert, Col, Row } from 'antd'

const DonateBanner1 = () => {
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

const DonateBanner = () => {
  const isMobile = !useBreakpoint('lg')
  const donateBannerText = isMobile
    ? 'Open Peer Review. Open Publishing. Open Access.'
    : 'Open Peer Review. Open Publishing. Open Access. Open Discussion. Open Recommendations. Open Directory. Open API. Open Source.'
  return (
    <Alert
      style={{ textAlign: 'center' }}
      title={
        <span>
          {donateBannerText}{' '}
          <Link href="/donate">
            <strong>Donate</strong>
          </Link>
        </span>
      }
      type="info"
      banner
      showIcon={false}
    />
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
