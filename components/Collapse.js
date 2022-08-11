import { nanoid } from 'nanoid'
import { useRef, useState } from 'react'

const Collapse = ({ showLabel, hideLabel, children }) => {
  const [collapsed, setCollapsed] = useState(true)
  const collapseRef = useRef(null)
  const id = nanoid()

  return (
    <>
      <a
        data-toggle="collapse"
        href={`#${id}`}
        aria-expanded="false"
        aria-controls="collapseExample"
        onClick={(e) => {
          e.preventDefault()
          $(collapseRef.current).collapse(collapsed ? 'show' : 'hide')
          setCollapsed((p) => !p)
        }}
      >
        {collapsed ? showLabel : hideLabel}
      </a>
      <div ref={collapseRef} className="collapse" id={id}>
        {children}
      </div>
    </>
  )
}

export default Collapse
