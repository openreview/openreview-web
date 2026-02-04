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
  registrationFormInvitations = [],
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

      // If registrationFormInvitations is specified, filter out matching invitations
      // from domain query and use the ones from props instead
      if (registrationFormInvitations.length > 0) {
        // Get suffixes from prop invitation IDs (e.g., 'Registration' from '.../-/Registration')
        const propSuffixes = registrationFormInvitations.map((id) => id.split('/-/').pop())

        // Filter out invitations that match the prop suffixes or end with _Form, _Request, _Agreement
        allInvitations = allInvitations.filter((inv) => {
          const invSuffix = inv.id.split('/-/').pop() || ''
          return (
            !propSuffixes.includes(invSuffix)
          )
        })

        // Fetch the registration invitations (users CAN read these)
        const regInvitations = await Promise.all(
          registrationFormInvitations.map((invitationId) =>
            api
              .get(
                '/invitations',
                {
                  id: invitationId,
                  invitee: true,
                  duedate: true,
                  replyto: true,
                  type: 'note',
                  details: 'replytoNote,repliedNotes,repliedEdits',
                },
                { accessToken }
              )
              .then((result) => result.invitations?.[0])
              .catch(() => null)
          )
        )

        // Fetch form notes (append _Form to invitation ID) to check completion
        // Users CAN read notes even though they CANNOT read _Form invitations
        const formNotesResults = await Promise.all(
          registrationFormInvitations.map((invitationId) =>
            api
              .getAll(
                '/notes',
                {
                  invitation: `${invitationId}_Form`,
                  select: 'id',
                },
                { accessToken }
              )
              .catch(() => [])
          )
        )

        // Add registration invitations with replytoNote from form notes
        const regFormInvitations = regInvitations
          .filter(Boolean)
          .map((inv, index) => {
            const formNotes = formNotesResults[index] || []
            const formNote = formNotes[0]
            return {
              ...inv,
              noteInvitation: true,
              // Set replytoNote so the task list knows where to link
              details: {
                ...inv.details,
                replytoNote: formNote ? { id: formNote.id, forum: formNote.id } : inv.details?.replytoNote,
              },
            }
          })

        allInvitations = allInvitations.concat(regFormInvitations)
      }

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
  }, [venueId, accessToken, registrationFormInvitations])

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
