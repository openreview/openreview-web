export default function ScoresList({ edges }) {
  if (!edges || !edges.length) {
    return null
  }

  return (
    <div className="scores-list">
      <ul className="list-unstyled">
        {edges.map((e, i) => {
          const val = (e.name === 'Conflict' || e.name === 'Bid' || e.weight == null)
            ? e.label
            : e.weight

          return (
            // eslint-disable-next-line react/no-array-index-key
            <li key={`${e.id}-${i}`}>
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
