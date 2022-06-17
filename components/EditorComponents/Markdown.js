/* globals DOMPurify,marked: false */
import { useEffect, useState } from 'react'

const Markdown = ({ text }) => {
  const [sanitizedHtml, setSanitizedHtml] = useState('')
  useEffect(() => {
    if (!text) {
      setSanitizedHtml(null)
      return
    }
    setSanitizedHtml(DOMPurify.sanitize(marked(text)))
  }, [text])

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
}

export default Markdown
