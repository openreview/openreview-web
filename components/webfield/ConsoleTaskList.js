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
}) => {
  const { accessToken } = useUser()
  const [invitations, setInvitations] = useState(null)

  const loadInvitations = async () => {
    try {
      let allInvitations = await Promise.all([
        api.getAll(
          '/invitations',
          {
            domain: venueId,
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
            domain: venueId,
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
            domain: venueId,
            invitee: true,
            duedate: true,
            type: 'tag',
            details: 'repliedTags',
          },
          { accessToken }
        ),
      ]).then(([noteInvitations, edgeInvitations, tagInvitations]) =>
        noteInvitations
          .map((inv) => ({ ...inv, noteInvitation: true }))
          .concat(edgeInvitations.map((inv) => ({ ...inv, tagInvitation: true })))
          .concat(tagInvitations.map((inv) => ({ ...inv, tagInvitation: true })))
      )

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
