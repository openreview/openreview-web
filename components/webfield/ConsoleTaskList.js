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
      // Step 1: Query venueId for all invitations
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

      // Step 2: Find invitations that need to come from a different domain
      const domainInvitationMap = {} // { domain: [invitation IDs] }
      const invitationsToReplace = new Set()

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
            domainInvitationMap[targetDomain].push(inv.id)
            invitationsToReplace.add(inv.id)
          }
        }
      })

      // Step 3: Query each mapped domain for its specific invitations
      const replacementInvitations = []
      for (const [domain, invitationIds] of Object.entries(domainInvitationMap)) {
        const [domainNoteInvitations, domainEdgeInvitations, domainTagInvitations] =
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
            api.getAll(
              '/invitations',
              {
                ids: invitationIds.join(','),
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
                ids: invitationIds.join(','),
                domain,
                invitee: true,
                duedate: true,
                type: 'tag',
                details: 'repliedTags',
              },
              { accessToken }
            ),
          ])

        replacementInvitations.push(
          ...domainNoteInvitations.map((inv) => ({ ...inv, noteInvitation: true })),
          ...domainEdgeInvitations.map((inv) => ({ ...inv, tagInvitation: true })),
          ...domainTagInvitations.map((inv) => ({ ...inv, tagInvitation: true }))
        )
      }

      // Step 4: Replace invitations with ones from correct domain or remove if not found
      allInvitations = allInvitations.filter((inv) => {
        if (invitationsToReplace.has(inv.id)) {
          // This invitation needs to come from a mapped domain
          return false // Remove it, will be added back if found in replacement
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
