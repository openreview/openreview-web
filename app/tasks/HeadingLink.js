import { useRouter } from 'next/navigation'
import { inflect, prettyId } from '../../lib/utils'

export default function HeadingLink({ groupId, groupInfo }) {
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
}
