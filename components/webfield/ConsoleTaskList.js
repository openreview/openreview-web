/* globals promptError: false */
import { useEffect, useState } from 'react'
import TaskList from '../TaskList'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { formatTasksData } from '../../lib/utils'
import { filterAssignedInvitations, filterHasReplyTo } from '../../lib/webfield-utils'
import LoadingSpinner from '../LoadingSpinner'

const ConsoleTaskList = ({
  venueId,
  roleName,
  referrer,
  filterAssignedInvitaiton = false,
  submissionName,
  submissionNumbers,
  apiVersion = 2,
}) => {
  const { accessToken } = useUser()
  const [invitations, setInvitations] = useState([])

  const loadInvitations = async () => {
    try {
      let allInvitations = await Promise.all([
        api.getAll(
          '/invitations',
          {
            ...(apiVersion !== 2 && { regex: `${venueId}/.*` }),
            ...(apiVersion === 2 && { domain: venueId }),
            invitee: true,
            duedate: true,
            replyto: true,
            type: 'note',
            details: 'replytoNote,repliedNotes',
          },
          { accessToken, version: apiVersion }
        ),
        api.getAll(
          '/invitations',
          {
            ...(apiVersion !== 2 && { regex: `${venueId}/.*` }),
            ...(apiVersion === 2 && { domain: venueId }),
            invitee: true,
            duedate: true,
            type: 'edge',
            details: 'repliedEdges',
          },
          { accessToken, version: apiVersion }
        ),
        api.getAll(
          '/invitations',
          {
            ...(apiVersion !== 2 && { regex: `${venueId}/.*` }),
            ...(apiVersion === 2 && { domain: venueId }),
            invitee: true,
            duedate: true,
            type: 'tag',
            details: 'repliedTags',
          },
          { accessToken, version: apiVersion }
        ),
      ]).then(([noteInvitations, edgeInvitations, tagInvitations]) =>
        noteInvitations
          .map((inv) => ({ ...inv, noteInvitation: true, apiVersion }))
          .concat(edgeInvitations.map((inv) => ({ ...inv, tagInvitation: true, apiVersion })))
          .concat(tagInvitations.map((inv) => ({ ...inv, tagInvitation: true, apiVersion })))
      )

      allInvitations = allInvitations
        .filter((p) => filterHasReplyTo(p, apiVersion))
        .filter((p) =>
          filterAssignedInvitaiton
            ? filterAssignedInvitations(p, roleName, submissionName, submissionNumbers)
            : p.invitees.some((q) => q.includes(roleName))
        )

      setInvitations(formatTasksData([allInvitations, [], []], true))
    } catch (error) {
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
