/* globals DOMPurify: false */
/* globals marked: false */

import { useState, useEffect } from "react"

export default function BasicHeader({ title, instructions, options = {} }) {
  const [instructionHtml, setInstructionHtml] = useState(null)

  useEffect(() => {
    if (!instructions) return

    setInstructionHtml(DOMPurify.sanitize(marked(instructions)))
  }, [instructions])

  return (
    <header className={options.fullWidth ? 'container' : null}>
      <h1>{title}</h1>

      <div className="description">
        <p dangerouslySetInnerHTML={{ __html: instructionHtml }} />
      </div>

      {options.underline && (
        <hr className="spacer" />
      )}
    </header>
  )
}
