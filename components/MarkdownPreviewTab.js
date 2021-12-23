/* globals DOMPurify,marked: false */
import { useEffect, useState } from 'react'

const MarkdownPreviewTab = ({
  value, onValueChanged, firstTab = 'Write', secondTab = 'Preview', placeholder = '',
}) => {
  const [sanitizedHtml, setSanitizedHtml] = useState('')

  useEffect(() => {
    if (!value) {
      setSanitizedHtml('Nothing to preview')
      return
    }
    setSanitizedHtml(DOMPurify.sanitize(marked(value)))
  }, [value])

  return (
    <div className="markdown-preview">
      <ul className="nav nav-tabs" role="tablist">
        <li role="presentation" className="active"><a href={`#${firstTab}`} aria-controls={firstTab} role="tab" data-toggle="tab">{firstTab}</a></li>
        <li role="presentation"><a href={`#${secondTab}`} aria-controls={secondTab} role="tab" data-toggle="tab">{secondTab}</a></li>
      </ul>
      <div className="tab-content">
        <div role="tabpanel" className="tab-pane active" id={firstTab}>
          <textarea className="form-control" rows="6" placeholder={placeholder} value={value} required onChange={e => onValueChanged(e.target.value)} />
        </div>
        <div role="tabpanel" className="tab-pane" id={secondTab}>
          {/* eslint-disable-next-line react/no-danger */}
          <div className="preview" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </div>
      </div>
    </div>
  )
}

export default MarkdownPreviewTab
