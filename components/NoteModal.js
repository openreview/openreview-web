/* globals $: false */

import { useEffect, useState, useRef } from 'react'
import BasicModal from './BasicModal'

const NoteModal = (visible) => {
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
    <BasicModal id="note-modal" title="BibTeX Record" cancelButtonText="Done" primaryButtonText={null}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <pre ref={bibTexContentRef} className="bibtex-content" onClick={handleBixtexContentClick}>
        {bibtexContent}
      </pre>
      <em className="instructions">Click anywhere on the box above to highlight complete record</em>
    </BasicModal>
  )
}

export default NoteModal
