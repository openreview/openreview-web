// modified from noteContentCollapsible handlebar helper
/* globals $: false */
import { useRef, useState } from 'react'
import NoteContent, { NoteContentV2 } from '../NoteContent'

const NoteContentCollapsible = ({ id, content, invitation, presentation, noteReaders, isV2Note }) => {
  const [collapsed, setCollapsed] = useState(true)
  const collapseRef = useRef(null)
  const fieldsToOmit = [
    // html should be displayed
    'title',
    'authors',
    'author_emails',
    'authorids',
    'pdf',
    'verdict',
    'paperhash',
    'ee',
    'year',
    'venue',
    'venueid',
  ]

  if (Object.keys(content).every((p) => fieldsToOmit.includes(p))) return null // will expand to empty

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
            presentation={presentation}
            noteReaders={noteReaders}
            include={['html']}
          />
        ) : (
          <NoteContent id={id} content={content} invitation={invitation} include={['html']} />
        )}
      </div>
    </>
  )
}

export default NoteContentCollapsible
