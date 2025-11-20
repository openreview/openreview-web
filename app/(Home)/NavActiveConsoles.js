'use client'

/* globals promptError: false */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { formatGroupResults, prettyId } from '../../lib/utils'

const NavActiveConsoles = () => {
  const [activeConsoles, setActiveConsoles] = useState([])
  const { user, accessToken, isRefreshing } = useUser()

  const getActiveConsoles = async () => {
    try {
      const [activeVenuesResult, openVenuesResult, activeConsoleResult] =
        await Promise.allSettled([
          api.get('groups', { id: 'active_venues' }).then(formatGroupResults),
          api
            .get('/invitations', { invitee: '~', pastdue: false, type: 'note' })
            .then((results) =>
              results.invitations.map((inv) => ({ groupId: inv.id.split('/-/')[0] }))
            ),
          api.get('/groups', { member: user.id, web: true, select: 'id' }, { accessToken }),
        ])

      const activeAndOpenVenues = [
        activeVenuesResult.value ?? [],
        openVenuesResult.value ?? [],
      ].flat()
      const venues = activeConsoleResult.value?.groups?.flatMap((venue) => {
        if (!activeAndOpenVenues.find((p) => venue.id.startsWith(p.groupId))) return []
        return { groupId: venue.id }
      })
      setActiveConsoles(venues)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (isRefreshing || !accessToken) return
    getActiveConsoles()
  }, [accessToken, isRefreshing])

  if (!activeConsoles?.length) return null
  return (
    <li className="dropdown">
      <a
        className="dropdown-toggle"
        data-toggle="dropdown"
        role="button"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <span className="hidden-sm hidden-md">Active Consoles</span>
        <span className="visible-sm-inline visible-md-inline">Consoles</span>{' '}
        <span className="badge">{activeConsoles.length}</span> <span className="caret" />
      </a>
      <ul className="dropdown-menu">
        {activeConsoles.map((venue) => (
          <li key={venue.groupId}>
            <Link href={`/group?id=${venue.groupId}`}>{prettyId(venue.groupId)}</Link>
          </li>
        ))}
      </ul>
    </li>
  )
}

export default NavActiveConsoles
