/* globals $,clearMessage: false */

import { useEffect, useRef } from 'react'
import SpinnerButton from './SpinnerButton'

export default function BasicModal({
  id,
  title,
  children,
  primaryButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  primaryButtonDisabled = false,
  onPrimaryButtonClick,
  onClose,
  onOpen,
  isLoading,
  options = {},
}) {
  const modalRef = useRef(null)

  useEffect(() => {
    $(modalRef.current).on('hidden.bs.modal', () => {
      if (typeof onClose === 'function') {
        onClose()
      }
    })
    $(modalRef.current).on('show.bs.modal', (e) => {
      clearMessage()
      if (typeof onOpen === 'function') {
        onOpen(e.relatedTarget)
      }
    })

    return () => {
      $(modalRef.current).off('hidden.bs.modal,show.bs.modal')
    }
  }, [modalRef])

  return (
    <div id={id} className="modal fade" tabIndex="-1" role="dialog" ref={modalRef}>
      <div className={`modal-dialog ${options.extraClasses || ''}`}>
        <div className="modal-content">
          {title && (
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
              <h3 className="modal-title">{title}</h3>
            </div>
          )}

          <div className="modal-body">{children}</div>

          {!options.hideFooter && (
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal">
                {cancelButtonText}
              </button>
              {primaryButtonText &&
                (options.useSpinnerButton ? (
                  <SpinnerButton
                    type="primary"
                    onClick={onPrimaryButtonClick}
                    disabled={primaryButtonDisabled}
                    loading={isLoading}
                  >
                    {primaryButtonText}
                  </SpinnerButton>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onPrimaryButtonClick}
                    disabled={primaryButtonDisabled}
                  >
                    {primaryButtonText}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
