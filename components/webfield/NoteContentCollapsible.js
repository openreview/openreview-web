// modified from noteContentCollapsible handlebar helper
/* globals $: false */
import { useRef, useState } from 'react'
import NoteContent, { NoteContentV2 } from '../NoteContent'

const NoteContentCollapsible = (props) => {
  let presentation, noteReaders, isEdit, isReference, invitation // eslint-disable-line one-var
  const { id, content, omit, isV2Note } = props
  if (props.isV2Note) {
    ;({ presentation, noteReaders, isEdit } = props)
  } else {
    ;({ invitation, isReference } = props)
  }
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
        {isV2Note ? (
          <NoteContentV2
            id={id}
            content={content}
            include={['html']}
            omit={omit}
            presentation={presentation}
            noteReaders={noteReaders}
            isEdit={isEdit}
          />
        ) : (
          <NoteContent
            id={id}
            content={content}
            invitation={invitation}
            include={['html']}
            omit={omit}
            isReference={isReference}
          />
        )}
      </div>
    </>
  )
}

export default NoteContentCollapsible
