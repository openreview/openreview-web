import { Suspense } from 'react'
import { orderBy, sortBy } from 'lodash'
import dayjs from 'dayjs'
import { headers } from 'next/headers'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import VenueRequestList from './VenueRequestList'
import api from '../../../../lib/api-client'

export default async function VenueRequestTab({ accessToken }) {
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

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
  const requestNotesP = api
    .get(
      '/notes',
      {
        invitation: `${process.env.SUPER_USER}/Support/-/Request_Form`,
        sort: 'tcdate',
        details: 'replies',
        select: `id,forum,tcdate,content['Abbreviated Venue Name'],content.venue_id,tauthor,details.replies[*].id,details.replies[*].replyto,details.replies[*].content.comment,details.replies[*].invitation,details.replies[*].signatures,details.replies[*].cdate,details.replies[*].tcdate`,
      },
      { accessToken, version: 1, remoteIpAddress }
    )
    .then((response) => {
      const allVenueRequests = response?.notes?.map((p) => ({
        id: p.id,
        forum: p.forum,
        tcdate: p.tcdate,
        abbreviatedName: p.content?.['Abbreviated Venue Name'],
        unrepliedPcComments: sortBy(
          p.details?.replies?.filter(
            (q) =>
              q.invitation.endsWith('Comment') &&
              !q.signatures.includes(`${process.env.SUPER_USER}/Support`) &&
              !hasBeenReplied(q, p.details?.replies ?? []) &&
              dayjs().diff(dayjs(q.cdate), 'd') < 7
          ),
          (s) => -s.cdate
        ),
        deployed: p.content?.venue_id,
        tauthor: p.tauthor,
      }))
      return orderBy(
        allVenueRequests,
        [(p) => !p.deployed, (p) => p.unrepliedPcComments.length, 'tcdate'],
        ['desc', 'desc', 'desc']
      )
    })
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VenueRequestList requestNotesP={requestNotesP} />
    </Suspense>
  )
}
