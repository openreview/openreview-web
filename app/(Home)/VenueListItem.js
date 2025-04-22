import Link from 'next/link'
import { formatTimestamp, prettyId } from '../../lib/utils'
import Icon from '../../components/Icon'

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
      {dueDate && (
        <p>
          <Icon name="time" />
          Due {formatTimestamp(dueDate)}
        </p>
      )}
    </li>
  )
}
