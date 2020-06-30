import { prettyId } from '../../lib/utils'

export default function TagEntity({ tag }) {
  if (!tag) {
    return null
  }

  const { id, invitation } = tag

  return (
    <li className="tag" data-id={id}>
      <h4>{prettyId(invitation)}</h4>
    </li>
  )
}
