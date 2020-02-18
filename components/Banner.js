const Banner = (props) => (
  <div
    id="or-banner"
    className="banner"
    style={props.hidden ? { display: 'none' } : {}}
  >
    <div className="container">
      <div className="row">
        <div className="col-xs-12">
          {props.content ? props.content : (
            <span className="tagline">
              Open Peer Review. Open Publishing. Open Access.{' '}
              <span className="hidden-xs">Open Discussion. Open Recommendations.</span>{' '}
              <span className="hidden-xs hidden-sm">Open Directory. Open API. Open Source.</span>
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
)

export default Banner
