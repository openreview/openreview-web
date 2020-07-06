const SimpleModal = ({
  // eslint-disable-next-line max-len
  children, displayFlag, firstButtonText, firstButtonClick, secondButtonText, secondButtonClick, disableSecondButton, title,
  // eslint-disable-next-line arrow-body-style
}) => {
  return (
    <>
      <div className="modal" tabIndex={-1} role="dialog" style={{ display: `${displayFlag ? 'block' : 'none'}` }}>
        <div className="modal-dialog">
          <div className="modal-content">
            {title && (
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={firstButtonClick}>
                  <span aria-hidden="true">×</span>
                </button>
                <h3 className="modal-title">{title}</h3>
              </div>
            )}
            <div className="modal-body">
              <form>
                {children}
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal" onClick={firstButtonClick}>{firstButtonText}</button>
              <button type="button" className="btn btn-primary" onClick={secondButtonClick} disabled={disableSecondButton}>{secondButtonText}</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade in" style={{ display: `${displayFlag ? 'block' : 'none'}` }} />
    </>
  )
}

export default SimpleModal
