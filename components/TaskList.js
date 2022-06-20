import Link from 'next/link'
import { prettyTasksInvitationId } from '../lib/utils'
import Icon from './Icon'

const TaskList = ({ invitations }) => {
  const referrer = encodeURIComponent('[Tasks](/tasks)')

  const renderInvitation = (invitation) => {
    const {
      tagInvitation,
      noteInvitation,
      web,
      id,
      groupId,
      dueDateStatus,
      dueDateStr,
      noteId,
      completed,
      apiVersion,
    } = invitation
    const prettifiedInvitationId = prettyTasksInvitationId(id)

    if (tagInvitation)
      return (
        <h4>
          {web ? (
            <Link href={`/invitation?id=${id}&referrer=${referrer}`}>
              <a>{prettifiedInvitationId}</a>
            </Link>
          ) : (
            <Link href={`/group?id=${groupId}&referrer=${referrer}`}>
              <a>{prettifiedInvitationId}</a>
            </Link>
          )}
          <span className={`duedate ${dueDateStatus}`}>{`Due: ${dueDateStr}`}</span>
        </h4>
      )
    if (noteInvitation) {
      const replyTo =
        apiVersion === 2 ? invitation.edit?.note?.replyto : invitation.reply?.replyto
      return (
        <h4>
          <Link
            href={`/forum?id=${invitation.details.replytoNote.forum}${
              replyTo ? `&noteId=${noteId}` : ''
            }${completed ? '' : `&invitationId=${id}`}&referrer=${referrer}`}
          >
            <a>{prettifiedInvitationId}</a>
          </Link>
          <span className={`duedate ${dueDateStatus}`}>{`Due: ${dueDateStr}`}</span>
        </h4>
      )
    }
    return null
  }
  const renderShareLink = (invitation) => {
    if (invitation.apiVersion === 2) {
      return (
        invitation.details.replytoNote?.content?.title?.value && (
          <div className="parent-title">
            <Icon name="share-alt" />
            <span className="title">
              <Link
                href={`/forum?id=${invitation.details.replytoNote.forum}&referrer=${referrer}`}
              >
                <a>{`${invitation.details.replytoNote.content.title.value}`}</a>
              </Link>
            </span>
          </div>
        )
      )
    }
    return (
      invitation.details.replytoNote?.content?.title && (
        <div className="parent-title">
          <Icon name="share-alt" />
          <span className="title">
            <Link
              href={`/forum?id=${invitation.details.replytoNote.forum}&referrer=${referrer}`}
            >
              <a>{`${invitation.details.replytoNote.content.title}`}</a>
            </Link>
          </span>
        </div>
      )
    )
  }

  return invitations.length ? (
    <ul className="list-unstyled submissions-list task-list">
      {invitations.map((invitation) => (
        <li key={invitation.id} className={`note${invitation.completed ? ' completed' : ''}`}>
          {renderInvitation(invitation)}
          {renderShareLink(invitation)}
        </li>
      ))}
    </ul>
  ) : (
    <p className="empty-message">No current pending or completed tasks</p>
  )
}

export default TaskList
