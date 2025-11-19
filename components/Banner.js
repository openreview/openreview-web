export default function Banner({ hidden, children }) {
  const defaultContent = (
    <span className="tagline">
      Open Peer Review. Open Publishing. Open Access.{' '}
      <span className="hidden-xs">Open Discussion. Open Recommendations.</span>{' '}
      <span className="hidden-xs hidden-sm">Open Directory. Open API. Open Source.</span>
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
