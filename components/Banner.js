import { WarningFilled } from '@ant-design/icons'
import { Alert, Button, theme } from 'antd'
import Link from 'next/link'
import useBreakpoint from '../hooks/useBreakPoint'

import styles from '../styles/components/Banner.module.scss'

const DonateBanner = () => {
  const isMobile = !useBreakpoint('lg')
  const donateLink = (
    <Link href="/donate" className={styles.donateLink}>
      Donate
    </Link>
  )

  return (
    <Alert
      id="or-banner"
      banner
      type="info"
      showIcon={false}
      styles={{ section: { textAlign: 'center' } }}
      title={
        isMobile ? (
          <>Open Peer Review. Open Publishing. Open Access. {donateLink}</>
        ) : (
          <>
            Open Peer Review. Open Publishing. Open Access.{' '}
            <span className="hidden-xs">Open Discussion. Open Recommendations.</span>{' '}
            <span className="hidden-xs hidden-sm">Open Directory. Open API. Open Source.</span>{' '}
            {donateLink}
          </>
        )
      }
    />
  )
}

const isSandboxApi = (apiUrl) => {
  try {
    return new URL(apiUrl).hostname.endsWith('.dev.openreview.net')
  } catch {
    return false
  }
}

const SandboxBanner = () => {
  const { token } = theme.useToken()

  return (
    <Alert
      id="or-banner"
      banner
      type="warning"
      icon={<WarningFilled />}
      styles={{
        root: {
          background: token.colorWarning,
          justifyContent: 'center',
          flexWrap: 'wrap',
          rowGap: token.paddingXS,
          columnGap: token.marginSM,
        },
        icon: { color: token.colorText, fontSize: token.fontSizeLG, marginInlineEnd: 0 },
        actions: { marginInlineStart: 0 },
        section: {
          flex: '1 1 0',
          minWidth: 200,
          maxWidth: 'max-content',
          textAlign: 'center',
        },
        title: { color: token.colorText },
      }}
      title={
        <>
          <strong>
            You are on the OpenReview test sandbox
            <span className="hidden-xs">, not the real site.</span>
          </strong>{' '}
          <span className="hidden-xs">Data here may be reset at any time.</span>
        </>
      }
      action={
        <Button type="primary" size="small" href="https://openreview.net">
          Go to openreview.net
        </Button>
      }
    />
  )
}

export default function Banner({ hidden, children, type }) {
  if (hidden) return null

  if (!children) {
    return isSandboxApi(process.env.API_V2_URL) ? <SandboxBanner /> : <DonateBanner />
  }

  return (
    <div
      id="or-banner"
      className={`banner${type === 'error' ? ' banner-error' : ''}`}
      role="banner"
    >
      <div className="container">
        <div className="row">
          <div className="col-xs-12">{children}</div>
        </div>
      </div>
    </div>
  )
}
