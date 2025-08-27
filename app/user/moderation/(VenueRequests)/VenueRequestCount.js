import { useEffect, useState } from 'react'
import { sortBy } from 'lodash'
import dayjs from 'dayjs'
import api from '../../../../lib/api-client'
import { inflect } from '../../../../lib/utils'

function getVenueTabCountMessage(unrepliedCommentCount, notDeployedCount) {
  if (unrepliedCommentCount === 0 && notDeployedCount === 0) return null
  if (unrepliedCommentCount === 0 && notDeployedCount !== 0)
    return inflect(notDeployedCount, 'venue request', 'venue requests', true)
  if (unrepliedCommentCount !== 0 && notDeployedCount === 0) return unrepliedCommentCount
  return `${inflect(
    unrepliedCommentCount,
    'venue with comments',
    'venues with comments',
    true
  )}, ${inflect(notDeployedCount, 'venue request', 'venue requests', true)}`
}

export default function VenueRequestCount({ accessToken }) {
  const [pendingVenueRequestCount, setPendingVenueRequestCount] = useState(null)

  const hasBeenReplied = (comment, allReplies) => {
    // checks the reply itself or its replies have been replied by support
    const replies = allReplies.filter((p) => p.replyto === comment.id)
    if (!replies.length) return false
    if (
      replies.length === 1 &&
      replies[0].signatures.includes(`${process.env.SUPER_USER}/Support`)
    ) {
      return true
    }

    return replies.some((p) => hasBeenReplied(p, allReplies))
  }

  const getPendingVenueRequestCount = async () => {
    try {
      const allVenueRequests = await api
        .getCombined(
          '/notes',
          {
            invitation: `${process.env.SUPER_USER}/Support/-/Request_Form`,
            details: 'replies',
            select: `content.venue_id,details.replies[*].id,details.replies[*].replyto,details.replies[*].invitation,details.replies[*].signatures,details.replies[*].cdate`,
          },
          {
            invitation: `${process.env.SUPER_USER}/Support/Venue_Request.*`,
            sort: 'tcdate',
            details: 'replies',
            select: `id,forum,parentInvitations,tcdate,content.abbreviated_venue_name,content.venue_id,tauthor,details.replies[*].id,details.replies[*].replyto,details.replies[*].content.comment,details.replies[*].invitations,details.replies[*].signatures,details.replies[*].cdate,details.replies[*].tcdate`,
          },
          { accessToken, includeVersion: true }
        )
        .then((response) =>
          response?.notes?.flatMap((p) => {
            if (p.parentInvitations) return []
            return {
              unrepliedPcComments: sortBy(
                p.details?.replies?.filter(
                  (q) =>
                    (p.apiVersion === 2
                      ? q.invitations.find((r) => r.endsWith('Comment'))
                      : q.invitation.endsWith('Comment')) &&
                    !q.signatures.includes(`${process.env.SUPER_USER}/Support`) &&
                    !hasBeenReplied(q, p.details?.replies ?? []) &&
                    dayjs().diff(dayjs(q.cdate), 'd') < 7
                ),
                (s) => -s.cdate
              ),
              deployed: p.apiVersion === 2 ? p.content?.venue_id?.value : p.content?.venue_id,
            }
          })
        )

      const undeployedVenueCount = allVenueRequests.filter((p) => !p.deployed).length
      const venueWithUnrepliedCommentCount = allVenueRequests.filter(
        (p) => p.unrepliedPcComments.length > 0
      ).length
      setPendingVenueRequestCount(
        getVenueTabCountMessage(venueWithUnrepliedCommentCount, undeployedVenueCount)
      )
    } catch (error) {
      /* empty */
    }
  }

  useEffect(() => {
    getPendingVenueRequestCount()
  }, [])

  if (!pendingVenueRequestCount) return null
  return <span className="badge">{pendingVenueRequestCount}</span>
}
