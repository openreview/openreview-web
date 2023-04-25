/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import useUser from '../../../hooks/useUser'
import WebFieldContext from '../../WebFieldContext'
import TaskList from '../../TaskList'
import api from '../../../lib/api-client'
import { formatTasksData } from '../../../lib/utils'
import { filterHasReplyTo } from '../../../lib/webfield-utils'

const SeniorAreaChairTasks = () => {
  const { accessToken } = useUser()
  const [invitations, setInvitations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { venueId, seniorAreaChairName } = useContext(WebFieldContext)

  const loadInvitations = async () => {
    try {
      let allInvitations = await Promise.all([
        api.getAll(
          '/invitations',
          {
            prefix: `${venueId}/.*`,
            invitee: true,
            duedate: true,
            replyto: true,
            type: 'note',
            details: 'replytoNote,repliedNotes',
          },
          { accessToken, version: 2 }
        ),
        api.getAll(
          '/invitations',
          {
            prefix: `${venueId}/.*`,
            invitee: true,
            duedate: true,
            type: 'edge',
            details: 'repliedEdges',
          },
          { accessToken, version: 2 }
        ),
        api.getAll(
          '/invitations',
          {
            prefix: `${venueId}/.*`,
            invitee: true,
            duedate: true,
            type: 'tag',
            details: 'repliedTags',
          },
          { accessToken, version: 2 }
        ),
      ]).then(([noteInvitations, edgeInvitations, tagInvitations]) =>
        noteInvitations
          .map((inv) => ({ ...inv, noteInvitation: true, apiVersion: 2 }))
          .concat(
            edgeInvitations.map((inv) => ({ ...inv, tagInvitation: true, apiVersion: 2 }))
          )
          .concat(
            tagInvitations.map((inv) => ({ ...inv, tagInvitation: true, apiVersion: 2 }))
          )
      )

      allInvitations = allInvitations
        .filter((p) => filterHasReplyTo(p, 2))
        .filter((p) => p.invitees.some((invitee) => invitee.includes(seniorAreaChairName)))

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
        `[Senior Area Chair Console](/group?id=${venueId}/${seniorAreaChairName}#seniorareachair-tasks)`
      )}
    />
  )
}

export default SeniorAreaChairTasks
