'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { inflect, prettyId } from '../../lib/utils'

export default function HeadingLink({ groupId, groupInfo }) {
  if (typeof window === 'undefined') throw new Error('client')
  const router = useRouter()
  return (
    <div className="heading-link" onClick={(e) => e.stopPropagation()}>
      <Link href={`/group?id=${groupId}`}>
        <h2>
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
}
