import { readersList } from '../../lib/forum-utils'
import { prettyInvitationId } from '../../lib/utils'
import Icon from '../Icon'

export default function ChatReadOnlyNotice({ invitationId, readers }) {
  return (
    <div>
      <p className="empty-message">You do not have permission to post in this chat.</p>
      {readers?.length > 0 && (
        <p className="mb-0 text-muted">
          <Icon name="eye-open" extraClasses="pr-1" />{' '}
          <em>
            {prettyInvitationId(invitationId)} replies are only visible to{' '}
            {readersList(readers)}
          </em>
        </p>
      )}
    </div>
  )
}
