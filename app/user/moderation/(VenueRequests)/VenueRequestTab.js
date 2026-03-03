/* globals promptError: false */

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { orderBy, sortBy } from 'lodash'
import api from '../../../../lib/api-client'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import VenueRequestList from './VenueRequestList'

dayjs.extend(relativeTime)

export default function VenueRequestTab() {
  const [venueRequestNotes, setVenueRequestNotes] = useState(null)

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

  const loadRequestNotes = async () => {
    try {
      const notesResult = await api.getCombined(
        '/notes',
        {
          invitation: `${process.env.SUPER_USER}/Support/-/Request_Form`,
          sort: 'tcdate',
          details: 'replies',
          select: `id,forum,tcdate,content['Abbreviated Venue Name'],content.venue_id,tauthor,details.replies[*].id,details.replies[*].replyto,details.replies[*].content.comment,details.replies[*].invitation,details.replies[*].signatures,details.replies[*].cdate,details.replies[*].tcdate`,
        },
        {
          invitation: `${process.env.SUPER_USER}/Support/Venue_Request.*`,
          sort: 'tcdate',
          details: 'replies',
          select: `id,forum,parentInvitations,signatures,tcdate,content.abbreviated_venue_name,content.venue_id,tauthor,details.replies[*].id,details.replies[*].replyto,details.replies[*].content.comment,details.replies[*].invitations,details.replies[*].signatures,details.replies[*].cdate,details.replies[*].tcdate`,
        },
        { includeVersion: true }
      )

      const notes = notesResult?.notes?.filter(
        (p) =>
          !p.parentInvitations &&
          (p.apiVersion === 2 ? !p.content?.venue_id?.value : !p.content?.venue_id)
      )

      const allVenueRequests = notes?.map((p) => ({
        id: p.id,
        forum: p.forum,
        tcdate: p.tcdate,
        abbreviatedName:
          p.apiVersion === 2
            ? p.content.abbreviated_venue_name.value
            : p.content?.['Abbreviated Venue Name'],
        hasOfficialReply: p.details?.replies?.find((q) =>
          q.signatures.includes(`${process.env.SUPER_USER}/Support`)
        ),
        latestComment: sortBy(
          p.details?.replies?.filter((q) =>
            p.apiVersion === 2
              ? q.invitations.find((r) => r.endsWith('Comment'))
              : q.invitation.endsWith('Comment')
          ),
          (s) => -s.cdate
        )?.[0],
        tauthor: p.tauthor,
        signature: p.signatures?.[0],
        apiVersion: p.apiVersion,
      }))

      setVenueRequestNotes(orderBy(allVenueRequests, ['cdate'], ['desc']))
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadRequestNotes()
  }, [])

  if (!venueRequestNotes) return <LoadingSpinner inline />

  return <VenueRequestList newRequestNotes={venueRequestNotes} />
}
