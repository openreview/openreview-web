import { getEdgeValue } from '../../lib/webfield-utils'

export default function ScoresList({ edges }) {
  if (!edges || !edges.length) {
    return null
  }
  console.log(edges)
  // PAM this is where Aggregate Score: reviewer-assignments is rendered.  Perhaps
  // e.name + getEdgeValue needs to be chopped - wrap at 385 px
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
