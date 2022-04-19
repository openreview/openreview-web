const FlashAlert = () => (
  <div
    id="flash-message-container"
    className="alert alert-danger fixed-overlay"
    role="alert"
    style={{ display: 'none' }}
  >
    <div className="container">
      <div className="row">
        <div className="col-xs-12">
          <div className="alert-content">
            <button type="button" className="close" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default FlashAlert
