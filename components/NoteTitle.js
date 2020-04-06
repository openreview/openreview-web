import Link from 'next/link'
import { buildNoteTitle } from '../lib/utils'

const NoteTitle = ({
  id, forum, invitation, content, signatures, options,
}) => (
  <h4>
    <Link href={`/forum?id=${forum}${id === forum ? '' : `&noteId=${id}`}`}>
      <a>{content.title || buildNoteTitle(invitation, signatures)}</a>
    </Link>

    {options.pdfLink && content.pdf && (
      <Link href={`/attachment?id=${id}&name=pdf`}>
        <a className="pdf-link" title="Download PDF" target="_blank">
          <img src="/static/images/pdf_icon_blue.svg" alt="pdf icon" />
        </a>
      </Link>
    )}

    {options.htmlLink && content.html && (
      <a href={content.html} className="html-link" title="Open Website" rel="noopener noreferrer" target="_blank">
        <img src="/static/images/html_icon_blue.svg" alt="hmtl icon" />
      </a>
    )}
  </h4>
)

export default NoteTitle
