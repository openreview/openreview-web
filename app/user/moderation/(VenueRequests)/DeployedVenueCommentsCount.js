import { useEffect, useState } from 'react'
import { Badge } from 'antd'
import dayjs from 'dayjs'
import api from '../../../../lib/api-client'

export default function DeployedVenueCommentsCount({ children }) {
  const [pendingCommentsCount, setPendingCommentsCount] = useState(null)

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

  const getVenueCommentsCount = async () => {
    try {
      const venueWithUnrepliedComment = await api
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
          { includeVersion: true }
        )
        .then((response) =>
          response?.notes?.filter((p) => {
            if (p.parentInvitations) return false
            if (p.apiVersion === 2 ? !p.content?.venue_id?.value : !p.content?.venue_id)
              // not deployed
              return false

            const unrepliedPcComments = p.details?.replies?.filter(
              (q) =>
                (p.apiVersion === 2
                  ? q.invitations.find((r) => r.endsWith('Comment'))
                  : q.invitation.endsWith('Comment')) &&
                !q.signatures.includes(`${process.env.SUPER_USER}/Support`) &&
                !hasBeenReplied(q, p.details?.replies ?? [])
              // &&
              // dayjs().diff(dayjs(q.cdate), 'd') < 7
            )

            if (!unrepliedPcComments?.length) return false
            return true
          })
        )

      setPendingCommentsCount(venueWithUnrepliedComment.length)
    } catch (error) {
      console.error('Error fetching venue comments count:', error)
      /* empty */
    }
  }

  useEffect(() => {
    getVenueCommentsCount()
  }, [])

  return (
    <Badge count={pendingCommentsCount} size="small" offset={[0, -5]}>
      {children}
    </Badge>
  )
}
