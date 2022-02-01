/* globals DOMPurify,marked: false */
import { useEffect, useRef, useState } from 'react'
import Tabs from './Tabs'

const MarkdownPreviewTab = ({
  value,
  onValueChanged,
  firstTab = 'Write',
  secondTab = 'Preview',
  placeholder = '',
  resetTabIndex,
}) => {
  const [sanitizedHtml, setSanitizedHtml] = useState('')
  const tabNames = [firstTab, secondTab]
  const tabContents = [
    // eslint-disable-next-line react/jsx-key
    <textarea
      className="form-control"
      rows="6"
      placeholder={placeholder}
      value={value}
      required
      onChange={(e) => onValueChanged(e.target.value)}
    />,
    // eslint-disable-next-line react/jsx-key
    <div className="preview" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />,
  ]

  useEffect(() => {
    if (!value) {
      setSanitizedHtml('Nothing to preview')
      resetTabIndex.current()
      return
    }
    setSanitizedHtml(DOMPurify.sanitize(marked(value)))
  }, [value])

  return (
    <Tabs
      className="markdown-preview"
      tabNames={tabNames}
      tabContents={tabContents}
      resetTabIndex={resetTabIndex}
    />
  )
}

export default MarkdownPreviewTab
