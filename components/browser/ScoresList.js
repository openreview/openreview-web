export default function ScoresList({ edges }) {
  if (!edges || !edges.length) {
    return null
  }

  return (
    <div className="scores-list">
      <ul className="list-unstyled">
        {edges.map((e) => {
          const val = (e.name === 'Conflict' || e.name === 'Bid' || e.weight == null)
            ? e.label
            : e.weight

          return (
            <li key={e.id}>
              <span>{`${e.name}:`}</span>
              {' '}
              <span>{val}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
