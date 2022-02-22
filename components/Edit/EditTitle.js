import Link from 'next/link'
import { buildNoteTitle } from '../../lib/utils'

const EditTitle = ({ edit, options }) => (
  <h4>
    {buildNoteTitle(edit.invitations[0], edit.signatures)}
    {options.pdfLink && edit.note?.content?.pdf?.value && (
      <Link href={`/notes/edits/attachment?id=${edit.id}&name=pdf`}>
        <a className="pdf-link" title="Download PDF" target="_blank">
          <img src="/images/pdf_icon_blue.svg" alt="pdf icon" />
        </a>
      </Link>
    )}
    {options.htmlLink && edit.note?.content?.html && (
      <a
        href={edit.note.content.html}
        className="html-link"
        title="Open Website"
        rel="noopener noreferrer"
        target="_blank"
      >
        <img src="/images/html_icon_blue.svg" alt="hmtl icon" />
      </a>
    )}
  </h4>
)

export default EditTitle
