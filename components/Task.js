import Link from 'next/link'
import { inflect, prettyId, prettyInvitationId } from '../lib/utils'
import Accordion from './Accordion'
import Icon from './Icon'

const prettyTasksInvitationId = (invitationId) => {
  const entities = [
    'Reviewers',
    'Authors',
    'Area_Chairs',
    'Program_Chairs',
    'Emergency_Reviewers',
    'Senior_Area_Chairs',
    'Action_Editors',
  ]
  let paperStr = ''
  let entityStr = ''

  const invMatches = invitationId.match(/\/(Paper\d+)\//)
  if (invMatches) {
    paperStr = invMatches[1]
    const anonReviewerMatches = invitationId.match(/\/(AnonReviewer\d+|Reviewer_\w+)\//)
    if (anonReviewerMatches) {
      paperStr = `${paperStr} ${anonReviewerMatches[1].replace('_', ' ')}`
    }
  }

  const groupSpecifier = invitationId.split('/-/')[0].split('/').pop()
  if (entities.includes(groupSpecifier)) {
    entityStr = groupSpecifier.replace(/_/g, ' ').slice(0, -1)
  }

  return `${paperStr} ${entityStr} ${prettyInvitationId(invitationId)}`
}

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

const HeadingLink = ({ groupId, groupInfo }) => (
  <div className="heading-link">
    <Link href={`/group?id=${groupId}`} passHref>
      <h2 onClick={(e) => e.stopPropagation()}>
        <span className="invitation-id">{prettyId(groupId)} </span>
      </h2>
    </Link>
    <span className="task-count-message">{`Show ${inflect(
      groupInfo.numPending,
      'pending task',
      'pending tasks',
      true
    )}${
      groupInfo.numCompleted
        ? ` and ${inflect(groupInfo.numCompleted, 'completed task', 'completed tasks', true)}`
        : ''
    }`}</span>
  </div>
)

const GroupedTaskList = ({ groupedTasks }) => (
  <Accordion
    sections={Object.keys(groupedTasks).map((groupId) => ({
      heading: <HeadingLink groupId={groupId} groupInfo={groupedTasks[groupId]} />,
      body: <TaskList invitations={groupedTasks[groupId].invitations} />,
    }))}
    options={{
      id: 'tasks',
      collapsed: true,
      html: false,
      bodyContainer: '',
    }}
  />
)

export default GroupedTaskList
