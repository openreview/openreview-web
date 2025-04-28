import Link from 'next/link'
import { prettyId } from '../../lib/utils'
import VenueListItemDueDate from './VenueListItemDueDate'

export default function VenueListItem({ groupId, dueDate, hidden, isLeadingVenue = false }) {
  const styles = hidden ? { display: 'none' } : {}

  return (
    <li style={styles}>
      <h2>
        <Link
          href={`/group?id=${groupId}&referrer=${encodeURIComponent('[Homepage](/)')}`}
          className={`${isLeadingVenue ? 'leading-venue' : ''}`}
        >
          {prettyId(groupId)}
        </Link>
      </h2>
      {dueDate && <VenueListItemDueDate dueDate={dueDate} />}
    </li>
  )
}
