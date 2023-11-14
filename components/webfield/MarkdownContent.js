/* globals DOMPurify, marked, MathJax: false */

import { useEffect, useState, useRef } from 'react'

export default function MarkdownContent({ content }) {
  const [sanitizedHtml, setSanitizedHtml] = useState('')

  useEffect(() => {
    if (!content) {
      setSanitizedHtml(null)
      return
    }
    if (content.trim().startsWith('<')) {
      setSanitizedHtml(DOMPurify.sanitize(content))
      return
    }
    setSanitizedHtml(DOMPurify.sanitize(marked(content)))
  }, [content])

  return (
    <div
      className="disable-tex-rendering"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
