import Link from 'next/link'

export default function Banner({ hidden, children }) {
  const defaultContent = (
    <span className="tagline">
      Support Open Science! Help us maintain OpenReview by{' '}
      <Link href="/donate" className="donate-link">
        making a donation
      </Link>{' '}
      today.{' '}
      <span className="hidden-xs">
        Your contribution keeps our platform free and accessible.
      </span>
    </span>
  )

  return (
    <div
      id="or-banner"
      className="banner"
      role="banner"
      style={hidden ? { display: 'none' } : null}
    >
      <div className="container">
        <div className="row">
          <div className="col-xs-12">{children || defaultContent}</div>
        </div>
      </div>
    </div>
  )
}
