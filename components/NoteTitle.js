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
          <img src="/images/pdf_icon_blue.svg" alt="pdf icon" />
        </a>
      </Link>
    )}

    {options.htmlLink && content.html && (
      <a href={content.html} className="html-link" title="Open Website" rel="noopener noreferrer" target="_blank">
        <img src="/images/html_icon_blue.svg" alt="hmtl icon" />
      </a>
    )}

    {/* TODO: convert legacy notes that still use `ee` to use `html` */}
    {options.htmlLink && content.ee && (
      <a href={content.ee} className="html-link" title="Open Website" rel="noopener noreferrer" target="_blank">
        <img src="/images/html_icon_blue.svg" alt="hmtl icon" />
      </a>
    )}
  </h4>
)

export const NoteTitleV2 = ({
  id, forum, invitation, content = {}, signatures, options,
}) => {
  const baseAttachmentPath = options.isReference ? '/notes/edits/attachment' : '/attachment'
  return (
    <h4>
      {
        options.isReference
          ? <a>{content.title?.value || buildNoteTitle(invitation, signatures)}</a>
          : (
            <Link href={`/forum?id=${forum}${id === forum ? '' : `&noteId=${id}`}`}>
              <a>{content.title?.value || buildNoteTitle(invitation, signatures)}</a>
            </Link>
          )
      }

      {options.pdfLink && content.pdf?.value && (
        <Link href={`${baseAttachmentPath}?id=${id}&name=pdf`}>
          <a className="pdf-link" title="Download PDF" target="_blank">
            <img src="/images/pdf_icon_blue.svg" alt="pdf icon" />
          </a>
        </Link>
      )}

      {options.htmlLink && content.html?.value && (
        <a href={content.html.value} className="html-link" title="Open Website" rel="noopener noreferrer" target="_blank">
          <img src="/images/html_icon_blue.svg" alt="hmtl icon" />
        </a>
      )}
    </h4>
  )
}

export default NoteTitle
