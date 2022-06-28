// modified from noteContentCollapsible handlebar helper
/* globals $: false */
import { useRef, useState } from 'react'
import NoteContent, { NoteContentV2 } from '../NoteContent'

export const NoteContentCollapsible = ({ id, content, invitation }) => {
  const [collapsed, setCollapsed] = useState(true)
  const collapseRef = useRef(null)

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
        {`${collapsed ? 'Show' : 'Hide'} details`}
      </a>
      <div ref={collapseRef} className="collapse" id={id}>
        <NoteContent id={id} content={content} invitation={invitation} include={['html']} />
      </div>
    </>
  )
}

export const NoteContentCollapsibleV2 = ({ id, content, invitation }) => {
  const [collapsed, setCollapsed] = useState(true)
  const collapseRef = useRef(null)

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
        {`${collapsed ? 'Show' : 'Hide'} details`}
      </a>
      <div ref={collapseRef} className="collapse" id={id}>
        <NoteContentV2 id={id} content={content} invitation={invitation} include={['html']} />
      </div>
    </>
  )
}
