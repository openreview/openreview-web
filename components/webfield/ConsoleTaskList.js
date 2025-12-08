/* globals promptError: false */
import { useEffect, useState } from 'react'
import TaskList from '../TaskList'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { formatTasksData } from '../../lib/utils'
import { filterAssignedInvitations } from '../../lib/webfield-utils'
import LoadingSpinner from '../LoadingSpinner'

const ConsoleTaskList = ({
  venueId,
  roleName,
  referrer,
  filterAssignedInvitation = false,
  submissionName,
  submissionNumbers,
  additionalDomains = [],
}) => {
  const { accessToken } = useUser()
  const [invitations, setInvitations] = useState(null)

  const loadInvitations = async () => {
    try {
      const domainsToQuery = [venueId, ...additionalDomains]

      // Query all domains and merge results
      const allInvitationsNested = await Promise.all(
        domainsToQuery.map(async (domain) => {
          const [noteInvitations, edgeInvitations, tagInvitations] = await Promise.all([
            api.getAll(
              '/invitations',
              {
                domain,
                invitee: true,
                duedate: true,
                replyto: true,
                type: 'note',
                details: 'replytoNote,repliedNotes,repliedEdits',
              },
              { accessToken }
            ),
            api.getAll(
              '/invitations',
              {
                domain,
                invitee: true,
                duedate: true,
                type: 'edge',
                details: 'repliedEdges',
              },
              { accessToken }
            ),
            api.getAll(
              '/invitations',
              {
                domain,
                invitee: true,
                duedate: true,
                type: 'tag',
                details: 'repliedTags',
              },
              { accessToken }
            ),
          ])
          return noteInvitations
            .map((inv) => ({ ...inv, noteInvitation: true }))
            .concat(edgeInvitations.map((inv) => ({ ...inv, tagInvitation: true })))
            .concat(tagInvitations.map((inv) => ({ ...inv, tagInvitation: true })))
        })
      )

      // Flatten and deduplicate by invitation ID
      const seenIds = new Set()
      let allInvitations = allInvitationsNested.flat().filter((inv) => {
        if (seenIds.has(inv.id)) return false
        seenIds.add(inv.id)
        return true
      })

      allInvitations = allInvitations.filter((p) =>
        filterAssignedInvitation
          ? filterAssignedInvitations(p, roleName, submissionName, submissionNumbers)
          : p.invitees.some((q) => q.includes(`/${roleName}`))
      )

      setInvitations(formatTasksData([allInvitations, [], []], true))
    } catch (error) {
      setInvitations([])
      promptError(error.message)
    }
  }

  useEffect(() => {
    setInvitations(null)
    loadInvitations()
  }, [venueId, accessToken])

  if (!invitations) return <LoadingSpinner />

  return (
    <TaskList
      invitations={invitations}
      emptyMessage="No outstanding tasks for this conference"
      referrer={referrer}
    />
  )
}

export default ConsoleTaskList
