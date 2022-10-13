/* globals DOMPurify, marked, MathJax: false */

import { useEffect, useState, useRef } from 'react'

const Markdown = ({ text }) => {
  const [sanitizedHtml, setSanitizedHtml] = useState('')
  const containerEl = useRef(null)

  useEffect(() => {
    if (!text) {
      setSanitizedHtml(null)
      return
    }
    if (text.startsWith('<')) {
      setSanitizedHtml(DOMPurify.sanitize(text))
      return
    }
    setSanitizedHtml(DOMPurify.sanitize(marked(text)))
  }, [text])

  useEffect(() => {
    if (sanitizedHtml && containerEl.current && MathJax.startup?.promise) {
      MathJax.startup.promise
        .then(() => MathJax.typesetPromise([containerEl.current]))
        .catch(() => {
          // eslint-disable-next-line no-console
          console.warn('Could not typeset TeX content')
        })
    }
  }, [sanitizedHtml, containerEl])

  return <div ref={containerEl} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
}

export default Markdown
