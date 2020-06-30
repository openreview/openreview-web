import { prettyId } from '../../lib/utils'

export default function GroupEntity({ group }) {
  if (!group) {
    return null
  }

  const { id, members } = group

  return (
    <li className="group" data-id={id}>
      <h4>{prettyId(id)}</h4>
    </li>
  )
}
