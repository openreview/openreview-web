import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { formatTasksData, getPaymentStatus } from '../../lib/utils'
import { filterAssignedInvitations } from '../../lib/webfield-utils'
import LoadingSpinner from '../LoadingSpinner'
import TaskList from '../TaskList'

const ConsoleTaskList = ({
  venueId,
  roleName,
  referrer,
  filterAssignedInvitation = false,
  submissionName,
  submissionNumbers,
}) => {
  const [invitations, setInvitations] = useState(null)

  const loadInvitations = async () => {
    try {
      let allInvitations = await Promise.all([
        api.getAll('/invitations', {
          domain: venueId,
          invitee: true,
          duedate: true,
          replyto: true,
          type: 'note',
          details: 'replytoNote,repliedNotes,repliedEdits',
        }),
        api.getAll('/invitations', {
          domain: venueId,
          invitee: true,
          duedate: true,
          type: 'edge',
          details: 'repliedEdges',
        }),
        api.getAll('/invitations', {
          domain: venueId,
          invitee: true,
          duedate: true,
          type: 'tag',
          details: 'repliedTags',
        }),
        api.getAll('/invitations', {
          domain: venueId,
          invitee: true,
          duedate: true,
          type: 'payment',
          details: 'repliedPayments',
        }),
      ]).then(async ([noteInvitations, edgeInvitations, tagInvitations, paymentInvitations]) =>
        noteInvitations
          .map((inv) => ({ ...inv, noteInvitation: true }))
          .concat(edgeInvitations.map((inv) => ({ ...inv, tagInvitation: true })))
          .concat(tagInvitations.map((inv) => ({ ...inv, tagInvitation: true })))
          .concat(
            (
              await Promise.all(
                paymentInvitations.map(async (inv) => ({
                  ...inv,
                  paymentInvitation: true,
                  paymentStatus: (
                    await getPaymentStatus(inv, inv.details.repliedPayments, () => true)
                  )?.status,
                }))
              )
            ).filter((inv) => inv.paymentStatus)
          )
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
  }, [venueId])

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
