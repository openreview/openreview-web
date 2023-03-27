import { getEdgeValue } from '../../lib/webfield-utils'

export default function ScoresList({ edges }) {
  if (!edges || !edges.length) {
    return null
  }

  return (
    <div className="scores-list">
      <ul className="list-unstyled">
        {edges.map((e) => (
          <li key={e.id}>
            <span>{`${e.name}:`}</span> <span>{getEdgeValue(e)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
