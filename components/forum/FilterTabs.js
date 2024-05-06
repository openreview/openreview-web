import Link from 'next/link'

export default function FilterTabs({
  forumId,
  forumViews,
  newMessageCounts,
  replyInvitations = [],
}) {
  if (!forumViews || !window) return null

  const currentHash = window.location.hash.slice(1)

  return (
    <ul className="nav nav-tabs filter-tabs">
      {forumViews.map((view) => {
        // Tab should only be visible if the user has permission to post to the primary invitation,
        // (which by convention is the first item in the expandedInvitations array) or there is no
        // primary invitation.
        const primaryInvitation = view.expandedInvitations?.[0]
        if (
          primaryInvitation &&
          !replyInvitations.find((inv) => inv.id === primaryInvitation)
        ) {
          return null
        }

        const newMessageCount = newMessageCounts[primaryInvitation] ?? 0

        return (
          <li
            key={view.id}
            data-id={view.id}
            role="presentation"
            className={view.id === currentHash ? 'active' : null}
          >
            <Link href={`?id=${forumId}#${view.id}`} shallow>
              {view.label}
              {newMessageCount > 0 && (
                <span className="badge">{newMessageCount}</span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
