/* globals $: false */

import { useEffect, useState, useRef } from 'react'
import BasicModal from './BasicModal'

const BibtexModal = () => {
  const [bibtexContent, setBibtexContent] = useState(null)
  const bibTexContentRef = useRef(null)

  const handleBixtexContentClick = () => {
    window.getSelection().selectAllChildren(bibTexContentRef.current)
  }

  useEffect(() => {
    $('#bibtex-modal').on('shown.bs.modal', (e) => {
      setBibtexContent(decodeURIComponent(e.relatedTarget.dataset.bibtex))
    })
    return () => {
      $('#bibtex-modal').off('shown.bs.modal')
    }
  }, [])

  return (
    <BasicModal
      id="bibtex-modal"
      title="BibTeX Record"
      cancelButtonText="Done"
      primaryButtonText={null}
    >
      <pre
        ref={bibTexContentRef}
        className="bibtex-content"
        onClick={handleBixtexContentClick}
      >
        {bibtexContent}
      </pre>
      <em className="instructions">
        Click anywhere on the box above to highlight complete record
      </em>
    </BasicModal>
  )
}

export default BibtexModal
