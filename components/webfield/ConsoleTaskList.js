/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import TaskList from '../TaskList'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { formatTasksData } from '../../lib/utils'
import { filterAssignedInvitations } from '../../lib/webfield-utils'
import LoadingSpinner from '../LoadingSpinner'
import WebFieldContext from '../WebFieldContext'

const ConsoleTaskList = ({
  venueId,
  roleName,
  referrer,
  filterAssignedInvitation = false,
  submissionName,
  submissionNumbers,
}) => {
  const { accessToken } = useUser()
  const { registrationFormDomainMap = {} } = useContext(WebFieldContext)
  const [invitations, setInvitations] = useState(null)

  const loadInvitations = async () => {
    try {
      const [noteInvitations, edgeInvitations, tagInvitations] = await Promise.all([
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
      ])

      let allInvitations = noteInvitations
        .map((inv) => ({ ...inv, noteInvitation: true }))
        .concat(edgeInvitations.map((inv) => ({ ...inv, tagInvitation: true })))
        .concat(tagInvitations.map((inv) => ({ ...inv, tagInvitation: true })))

      const domainInvitationMap = {} // { domain: [invitation IDs] }
      const invitationsToReplace = new Set()

      // Match invitations to their mapped domains if they exist
      allInvitations.forEach((inv) => {
        const matchedSuffix = Object.keys(registrationFormDomainMap).find((suffix) =>
          inv.id.endsWith(suffix.replace('_Form', ''))
        )
        if (matchedSuffix) {
          const targetDomain = registrationFormDomainMap[matchedSuffix]
          if (targetDomain !== venueId) {
            if (!domainInvitationMap[targetDomain]) {
              domainInvitationMap[targetDomain] = []
            }
            domainInvitationMap[targetDomain].push(inv.id.replace(venueId, targetDomain))
            invitationsToReplace.add(inv.id)
          }
        }
      })

      const replacementInvitations = []
      for (const [domain, invitationIds] of Object.entries(domainInvitationMap)) {
        const [domainNoteInvitations] =
          await Promise.all([
            api.getAll(
              '/invitations',
              {
                ids: invitationIds.join(','),
                domain,
                invitee: true,
                duedate: true,
                replyto: true,
                type: 'note',
                details: 'replytoNote,repliedNotes,repliedEdits',
              },
              { accessToken }
            ),
          ])
        replacementInvitations.push(
          ...domainNoteInvitations.map((inv) => ({ ...inv, noteInvitation: true })),
        )
      }

      // Remove invitations that need to come from a mapped domain and add replacements
      allInvitations = allInvitations.filter((inv) => {
        if (invitationsToReplace.has(inv.id)) {
          return false
        }
        return true
      })
      // Add replacement invitations
      allInvitations.push(...replacementInvitations)

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
