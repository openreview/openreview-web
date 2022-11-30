import Link from 'next/link'
import without from 'lodash/without'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { NoteTitleV2 } from './NoteTitle'
import NoteAuthors from './NoteAuthors'
import NoteContent from './NoteContent'
import Collapse from './Collapse'
import Icon from './Icon'
import { prettyId, prettyInvitationId, buildNoteTitle } from '../lib/utils'

dayjs.extend(relativeTime)

export default function NoteActivity({ note, showActionButtons, showGroup }) {
  const { content, details } = note

  const readersFiltered = note.readers?.includes('everyone') ? ['Everyone'] : without(
    note.readers?.map((id) => prettyId(id)),
    'Super User',
    '',
    null,
    undefined
  )

  return (
    <div>
      <div className="activity-heading clearfix">
        <div className="explanation">
          <span className={details.userIsSignatory ? '' : 'sig'}>
            {details.formattedSignature}
          </span>
          {' '}
          {details.isUpdated ? 'edited a' : 'posted a new'}
          {' '}
          {prettyInvitationId(note.invitation)}
          {' '}
          {showGroup && (
            <>
              to{' '}
              <Link href={`/group?id=${details.group}`}>
                <a>{prettyId(details.group)}</a>
              </Link>
            </>
          )}
        </div>
        <div className="date">
          {readersFiltered.includes('Everyone') ? (
            <Icon name="globe" extraClasses="readers-icon" tooltip="Readers: Everyone" />
          ) : (
            <Icon name="user" extraClasses="readers-icon" tooltip={`Readers: ${readersFiltered.join(', ')}`} />
          )}
          {readersFiltered.length > 1 && (
            <> &times; {readersFiltered.length}</>
          )}
          {' '}&bull;{' '}
          {dayjs().to(dayjs(note.tmdate))}
        </div>
      </div>

      <div className="clearfix">
        <div className="activity-title">
          <h4>
            <Link href={`/forum?id=${note.forum}${details.isForum ? '' : `&noteId=${note.id}`}`}>
              <a>
                {details.isDeleted ? '[Deleted] ' : ''}
                {content.title ? content.title : buildNoteTitle(note.invitation, note.signatures)}
              </a>
            </Link>
          </h4>

          {details.isForum ? (
            <div className="note-authors">
              <NoteAuthors
                authors={content.authors}
                authorIds={content.authorids}
                signatures={note.signatures}
                original={details.original}
              />
            </div>
          ) : (
            <div className="parent-title">
              <Icon name="share-alt" />
              <span className="title">
                {details.forumContent.title ? details.forumContent.title : 'No Title'}
              </span>
            </div>
          )}
        </div>

        {showActionButtons && details.writable && (
          <div className="activity-actions"></div>
        )}
      </div>

      {details.isForum ? (
        <Collapse showLabel="Show details" hideLabel="Hide details" indent>
          <NoteContent
            id={note.id}
            content={content}
            invitation={details.originalInvitation || details.invitation}
          />
        </Collapse>
      ) : (
        <NoteContent
          id={note.id}
          content={content}
          invitation={details.originalInvitation || details.invitation}
        />
      )}
    </div>
  )
}

export function NoteActivityV2({ note, showGroup }) {
  const { content, details } = note

  const readersFiltered = note.readers?.includes('everyone') ? ['Everyone'] : without(
    note.readers?.map((id) => prettyId(id)),
    'Super User',
    '',
    null,
    undefined
  )

  return (
    <div>
      <div className="activity-heading">
        <div className="explanation">
          <span className={note.details.userIsSignatory ? '' : 'sig'}>
            {note.details.formattedSignature}
          </span>
          {' '}
          {note.details.isUpdated ? 'edited a' : 'posted a new'}
          {' '}
          {prettyInvitationId(note.invitations[0])}
          {' '}
          {showGroup && (
            <>
              to{' '}
              <Link href={`/group?id=${note.details.group}`}>
                <a>{prettyId(note.details.group)}</a>
              </Link>
            </>
          )}
        </div>
        <div className="date">
          {readersFiltered.includes('Everyone') ? (
            <Icon name="globe" extraClasses="readers-icon" tooltip="Readers: Everyone" />
          ) : (
            <Icon name="globe" extraClasses="user" tooltip={`Readers: ${readersFiltered.join(', ')}`} />
          )}
          {readersFiltered.length > 1 && (
            <> &times; {readersFiltered.length}</>
          )}
          {' '}&bull;{' '}
          {dayjs().to(dayjs(note.tmdate))}
        </div>
      </div>

      <NoteTitleV2
        id={note.id}
        forum={note.forum}
        invitation={note.invitation}
        content={note.content}
        signatures={note.signatures}
      />
    </div>
  )
}
