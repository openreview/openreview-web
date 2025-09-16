import { useRouter } from 'next/navigation'
import { inflect, prettyId } from '../../lib/utils'

export default function HeadingLink({ groupId, groupInfo, loadTaksForDomain }) {
  const router = useRouter()
  const handleClick = (e) => {
    router.push(`/group?id=${groupId}`)
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div className="heading-link">
      <h2 data-toggle="collapse" onClick={handleClick}>
        <span className="invitation-id">{prettyId(groupId)} </span>
      </h2>
      {groupInfo ? (
        <span className="task-count-message">{`${inflect(
          groupInfo.numPending,
          'pending task',
          'pending tasks',
          true
        )}${
          groupInfo.numCompleted
            ? ` and ${inflect(groupInfo.numCompleted, 'completed task', 'completed tasks', true)}`
            : ''
        }`}</span>
      ) : (
        <span className="task-count-message" onClick={() => loadTaksForDomain(groupId)}>
          show {prettyId(groupId)} tasks
        </span>
      )}
    </div>
  )
}
