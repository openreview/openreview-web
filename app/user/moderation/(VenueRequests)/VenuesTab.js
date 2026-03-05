/* globals promptError: false */

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { orderBy, sortBy } from 'lodash'
import api from '../../../../lib/api-client'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import VenuesList from './VenuesList'

dayjs.extend(relativeTime)

export default function VenuesTab() {
  const [venueRequestNotes, setVenueRequestNotes] = useState(null)

  const loadRequestNotes = async () => {
    try {
      const notesResult = await api.getCombined(
        '/notes',
        {
          invitation: `${process.env.SUPER_USER}/Support/-/Request_Form`,
          sort: 'cdate',
          details: 'replies',
          select: `id,forum,cdate,content.state,content['Abbreviated Venue Name'],content.venue_id,tauthor,details.replies[*].id,details.replies[*].replyto,details.replies[*].content.comment,details.replies[*].invitation,details.replies[*].signatures,details.replies[*].cdate,details.replies[*].cdate`,
        },
        {
          invitation: `${process.env.SUPER_USER}/Support/Venue_Request/-/Conference_Review_Workflow`,
          sort: 'cdate',
          details: 'replies',
          select: `id,forum,parentInvitations,signatures,cdate,content.state,content.abbreviated_venue_name,content.venue_id,tauthor,details.replies[*].id,details.replies[*].replyto,details.replies[*].content.comment,details.replies[*].invitations,details.replies[*].signatures,details.replies[*].cdate,details.replies[*].cdate`,
        },
        { includeVersion: true }
      )

      const notes = notesResult?.notes?.filter(
        (p) =>
          !p.parentInvitations &&
          (p.apiVersion === 2 ? p.content?.venue_id?.value : p.content?.venue_id)
      )

      const deployedVenueRequests = notes?.map((p) => ({
        id: p.id,
        forum: p.forum,
        cdate: p.cdate,
        abbreviatedName:
          p.apiVersion === 2
            ? p.content.abbreviated_venue_name?.value
            : p.content?.['Abbreviated Venue Name'],
        latestComment: sortBy(
          p.details?.replies?.filter((q) =>
            p.apiVersion === 2
              ? q.invitations.find((r) => r.endsWith('Comment'))
              : q.invitation.endsWith('Comment')
          ),
          (s) => -s.cdate
        )?.[0],
        apiVersion: p.apiVersion,
        state: p.apiVersion === 2 ? p.content.state?.value : p.content?.state,
      }))

      setVenueRequestNotes(
        orderBy(
          deployedVenueRequests,
          [(p) => (p.latestComment ? 0 : 1), (p) => p.latestComment?.cdate ?? p.cdate],
          ['desc', 'desc']
        )
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadRequestNotes()
  }, [])

  if (!venueRequestNotes) return <LoadingSpinner inline />
  return <VenuesList venueRequestNotes={venueRequestNotes} />
}
