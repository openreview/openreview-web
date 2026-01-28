/* globals DOMPurify, marked, MathJax: false */

import { useEffect, useState, useRef } from 'react'

const Markdown = ({ text, disableMathjaxFormula = false }) => {
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
    if (disableMathjaxFormula) return
    if (sanitizedHtml && containerEl.current && MathJax.startup?.promise) {
      MathJax.startup.promise
        .then(() => MathJax.typesetPromise([containerEl.current]))
        .catch(() => {
          console.warn('Could not typeset TeX content')
        })
    }
  }, [sanitizedHtml, containerEl])

  return (
    <div
      className={`${disableMathjaxFormula ? 'disable-tex-rendering' : ''}`}
      ref={containerEl}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}

export default Markdown
