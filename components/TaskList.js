import Link from 'next/link'
import { prettyTasksInvitationId } from '../lib/utils'
import Icon from './Icon'

export default function TaskList({ invitations, emptyMessage, referrer }) {
  return invitations?.length > 0 ? (
    <ul className="list-unstyled submissions-list task-list">
      {invitations.map((invitation) => (
        <li key={invitation.id} className={`note${invitation.completed ? ' completed' : ''}`}>
          <Invitation
            invitation={invitation}
            referrer={referrer ?? encodeURIComponent('[Tasks](/tasks)')}
          />
        </li>
      ))}
    </ul>
  ) : (
    <p className="empty-message">{emptyMessage ?? 'No current pending or completed tasks'}</p>
  )
}

function Invitation({ invitation, referrer }) {
  const { tagInvitation, noteInvitation, dueDateStatus, dueDateStr, apiVersion } = invitation
  const replyToTitle = invitation.details.replytoNote?.content?.title?.value

  if (!noteInvitation && !tagInvitation) return null

  return (
    <>
      <h4>
        <InvitationLink invitation={invitation} referrer={referrer} />
        <span className={`duedate ${dueDateStatus}`}>{`Due: ${dueDateStr}`}</span>
        {invitation.hasMissingFields && <span> Update is required</span>}
      </h4>
      {replyToTitle && (
        <div className="parent-title">
          <Icon name="share-alt" />
          <span className="title">
            <Link
              href={`/forum?id=${invitation.details.replytoNote.forum}&referrer=${referrer}`}
            >
              {replyToTitle}
            </Link>
          </span>
        </div>
      )}
    </>
  )
}

function InvitationLink({ invitation, referrer }) {
  const { web, id, groupId, noteId, completed, domain } = invitation
  const prettifiedInvitationId = prettyTasksInvitationId(id, domain)
  const replyTo = invitation.edit?.note?.replyto
  const hasId = typeof invitation.edit?.note?.id === 'string'

  const getNoteInvitationLink = () => {
    const noteParam = replyTo ? `&noteId=${noteId}` : ''
    const invitationParam = completed ? '' : `&invitationId=${id}`

    if (web) {
      return `/invitation?id=${id}&referrer=${referrer}`
    }
    if (noteParam || hasId) {
      return `/forum?id=${invitation.details.replytoNote.forum}${noteParam}${invitationParam}&referrer=${referrer}`
    }
    return null
  }

  if (invitation.noteInvitation) {
    const link = getNoteInvitationLink()

    return link ? <Link href={link}>{prettifiedInvitationId}</Link> : null
  }
  if (invitation.tagInvitation) {
    return web ? (
      <Link href={`/invitation?id=${id}&referrer=${referrer}`}>{prettifiedInvitationId}</Link>
    ) : (
      <Link href={`/group?id=${groupId}&referrer=${referrer}`}>{prettifiedInvitationId}</Link>
    )
  }
  return null
}
