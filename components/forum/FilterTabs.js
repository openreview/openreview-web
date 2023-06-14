import Link from 'next/link'

export default function FilterTabs({ forumId, forumViews, replyInvitations = [] }) {
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

        return (
          <li
            key={view.id}
            role="presentation"
            className={view.id === currentHash ? 'active' : null}
          >
            <Link href={`#${view.id}`} shallow>
              <a>{view.label}</a>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
