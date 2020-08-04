const Banner = ({ content, hidden }) => (
  <div
    id="or-banner"
    className="banner"
    style={hidden ? { display: 'none' } : null}
  >
    <div className="container">
      <div className="row">
        <div className="col-xs-12">
          {content || (
            <span className="tagline">
              Open Peer Review. Open Publishing. Open Access.
              {' '}
              <span className="hidden-xs">Open Discussion. Open Recommendations.</span>
              {' '}
              <span className="hidden-xs hidden-sm">Open Directory. Open API. Open Source.</span>
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
)

export default Banner
