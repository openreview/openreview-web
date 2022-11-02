import { useContext, useEffect, useState } from 'react'
import useUser from '../../../hooks/useUser'
import WebFieldContext from '../../WebFieldContext'
import TaskList from '../../TaskList'
import api from '../../../lib/api-client'
import { formatTasksData } from '../../../lib/utils'

const SeniorAreaChairTasks = () => {
  const { accessToken } = useUser()
  const [invitations, setInvitations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { venueId, apiVersion, seniorAreaChairName } = useContext(WebFieldContext)

  const addInvitaitonTypeAndVersion = (invitation) => {
    let invitaitonType = 'tagInvitation'
    if (apiVersion === 2 && invitation.edit?.note) invitaitonType = 'noteInvitation'
    if (apiVersion === 1 && !invitation.reply.content?.tag && !invitation.reply.content?.head)
      invitaitonType = 'noteInvitation'
    return { ...invitation, [invitaitonType]: true, apiVersion }
  }

  // for note invitations only
  const filterHasReplyTo = (invitation) => {
    if (!invitation.noteInvitation) return true
    if (apiVersion === 2) {
      const result = invitation.edit?.note?.replyto?.const || invitation.edit?.note?.id?.const
      return result
    }
    const result = invitation.reply.replyto || invitation.reply.referent
    return result
  }
  const loadInvitations = async () => {
    try {
      let allInvitations = await api.getAll(
        '/invitations',
        {
          ...(apiVersion !== 2 && { regex: `${venueId}/.*` }),
          ...(apiVersion === 2 && { prefix: `${venueId}/.*` }),
          invitee: true,
          duedate: true,
          type: 'all',
        },
        { accessToken, version: apiVersion }
      )

      allInvitations = allInvitations
        .map((p) => addInvitaitonTypeAndVersion(p))
        .filter((p) => filterHasReplyTo(p))
        .filter((p) => p.invitees.some((invitee) => invitee.includes(seniorAreaChairName)))

      if (allInvitations.length) {
        // add details
        const validInvitationDetails = await api.getAll('/invitations', {
          ids: allInvitations.map((p) => p.id),
          details: 'all',
          select: 'id,details',
        })

        allInvitations.forEach((p) => {
          // eslint-disable-next-line no-param-reassign
          p.details = validInvitationDetails.find((q) => q.id === p.id)?.details
        })
      }

      setInvitations(formatTasksData([allInvitations, [], []], true))
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }
  useEffect(() => {
    loadInvitations()
  }, [])

  return (
    <TaskList
      invitations={invitations}
      emptyMessage={isLoading ? 'Loading...' : 'No outstanding tasks for this conference'}
      referrer={encodeURIComponent(
        `[Senior Area Chair Console](/group?id=${venueId}/${seniorAreaChairName}'#seniorareachair-tasks)`
      )}
    />
  )
}

export default SeniorAreaChairTasks
