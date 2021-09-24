import Link from 'next/link'

export default function FilterTabs({ forumId, forumViews }) {
  if (!forumViews || !window) return null

  const currentHash = window.location.hash.slice(1)

  return (
    <ul className="nav nav-tabs filter-tabs">
      {forumViews.map(view => (
        <li key={view.id} role="presentation" className={view.id === currentHash ? 'active' : null}>
          <Link href={`?id=${forumId}#${view.id}`} shallow>
            <a>{view.label}</a>
          </Link>
        </li>
      ))}
    </ul>
  )
}
