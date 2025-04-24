import Link from 'next/link'
import without from 'lodash/without'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { NoteAuthorsV2 } from './NoteAuthors'
import { NoteContentV2 } from './NoteContent'
import Collapse from './Collapse'
import Icon from './Icon'
import { prettyId, prettyInvitationId, buildNoteTitle } from '../lib/utils'

dayjs.extend(relativeTime)

export default function NoteActivity({ note, showGroup, showActionButtons }) {
  const { details } = note
  const { id, forum, content = {} } = note.note

  let actionDescription
  if (details.isDeleted) {
    actionDescription = 'deleted a'
  } else if (details.isRestored) {
    actionDescription = 'restored a'
  } else if (details.isUpdated) {
    actionDescription = 'edited a'
  } else {
    actionDescription = 'added a new'
  }

  const readersFiltered = note.readers?.includes('everyone')
    ? ['Everyone']
    : without(
        note.readers?.map((groupId) => prettyId(groupId)),
        'Super User',
        '',
        null,
        undefined
      )

  return (
    <div>
      <div className="activity-heading">
        <div className="explanation">
          <span className={details.userIsSignatory ? '' : 'sig'}>
            {details.formattedSignature}
          </span>
          {` ${actionDescription} a ${prettyInvitationId(note.invitation)} edit`}
          {showGroup && (
            <>
              {' to '}
              <Link href={`/group?id=${details.group}`}>{prettyId(details.group)}</Link>
            </>
          )}
        </div>
        <div className="date">
          {readersFiltered.includes('Everyone') ? (
            <Icon name="globe" extraClasses="readers-icon" tooltip="Readers: Everyone" />
          ) : (
            <Icon
              name="user"
              extraClasses="readers-icon"
              tooltip={`Readers: ${readersFiltered.join(', ')}`}
            />
          )}
          {readersFiltered.length > 1 && <> &times; {readersFiltered.length}</>}
          &nbsp; &bull; &nbsp;
          {dayjs().to(dayjs(note.tmdate))}
        </div>
      </div>

      <div className="clearfix">
        <div className="activity-title">
          <h4>
            <Link
              href={`/forum?${forum ? `id=${forum}&` : ''}${
                details.isForum ? '' : `noteId=${id}`
              }`}
            >
              {details.isDeleted ? '[Deleted] ' : ''}
              {content.title?.value && !content.title.value?.delete
                ? content.title.value
                : buildNoteTitle(note.invitation, note.signatures)}
            </Link>
          </h4>

          {content.authors && content.authorids && (
            <div className="note-authors">
              <NoteAuthorsV2
                authors={content.authors}
                authorIds={content.authorids}
                signatures={note.signatures}
                original={details.original}
              />
            </div>
          )}
        </div>

        {showActionButtons && details.writable && <div className="activity-actions"></div>}
      </div>

      {!details.isDeleted &&
        (details.isForum ? (
          <Collapse showLabel="Show details" hideLabel="Hide details" indent>
            <NoteContentV2 id={id} content={content} invitation={details.invitation} />
          </Collapse>
        ) : (
          <NoteContentV2 id={id} content={content} invitation={details.invitation} />
        ))}
    </div>
  )
}
