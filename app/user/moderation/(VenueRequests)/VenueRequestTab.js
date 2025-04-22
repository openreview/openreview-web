/* globals promptError: false */

import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { orderBy, sortBy } from 'lodash'
import PaginatedList from '../../../../components/PaginatedList'
import { inflect, prettyId } from '../../../../lib/utils'
import api from '../../../../lib/api-client'

dayjs.extend(relativeTime)

const VenueRequestRow = ({ item }) => {
  const { forum, abbreviatedName, unrepliedPcComments, deployed, tauthor, tcdate } = item
  return (
    <div className="venue-request-row">
      <a className="request-name" href={`/forum?id=${forum}`} target="_blank" rel="noreferrer">
        {abbreviatedName}
      </a>
      <div className="request-status">
        <div className="deploy-label">
          <span className={`label label-${deployed ? 'success' : 'default'}`}>
            {deployed ? 'Deployed' : 'Not Deployed'}
          </span>
        </div>
        <div className="comment-label">
          <span
            className={`label label-${unrepliedPcComments.length ? 'warning' : 'success'}`}
          >
            {unrepliedPcComments.length > 0 ? (
              <a
                href={`/forum?id=${forum}&noteId=${unrepliedPcComments[0].id}`}
                target="_blank"
                rel="noreferrer"
                title={`
${dayjs(unrepliedPcComments[0].tcdate).fromNow()}
${unrepliedPcComments[0].content?.comment}`}
              >
                {`${inflect(unrepliedPcComments.length, 'comment', 'comments', true)}`}
              </a>
            ) : (
              'no comment'
            )}
          </span>
        </div>
        <div className="tcdate-label">{dayjs(tcdate).fromNow()}</div>
      </div>
      <a href={`/profile?email=${tauthor}`} target="_blank" rel="noreferrer">
        {prettyId(tauthor)}
      </a>
    </div>
  )
}

export default function VenueRequestTab({ accessToken }) {
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
      const { notes } = await api.get(
        '/notes',
        {
          invitation: `${process.env.SUPER_USER}/Support/-/Request_Form`,
          sort: 'tcdate',
          details: 'replies',
          select: `id,forum,tcdate,content['Abbreviated Venue Name'],content.venue_id,tauthor,details.replies[*].id,details.replies[*].replyto,details.replies[*].content.comment,details.replies[*].invitation,details.replies[*].signatures,details.replies[*].cdate,details.replies[*].tcdate`,
        },
        { accessToken, version: 1 }
      )

      const allVenueRequests = notes?.map((p) => ({
        id: p.id,
        forum: p.forum,
        tcdate: p.tcdate,
        abbreviatedName: p.content?.['Abbreviated Venue Name'],
        hasOfficialReply: p.details?.replies?.find((q) =>
          q.signatures.includes(`${process.env.SUPER_USER}/Support`)
        ),
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

      setVenueRequestNotes(
        orderBy(
          allVenueRequests,
          [(p) => !p.deployed, (p) => p.unrepliedPcComments.length, 'tcdate'],
          ['desc', 'desc', 'desc']
        )
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  const loadItems = useCallback(
    (limit, offset) =>
      venueRequestNotes
        ? Promise.resolve({
            items: venueRequestNotes.slice(offset, offset + limit),
            count: venueRequestNotes.length,
          })
        : Promise.resolve({
            items: [],
            count: 0,
          }),
    [venueRequestNotes]
  )

  useEffect(() => {
    loadRequestNotes()
  }, [])

  return (
    <PaginatedList
      className="venue-request-list"
      loadItems={loadItems}
      emptyMessage="No venue requests"
      itemsPerPage={25}
      ListItem={VenueRequestRow}
    />
  )
}
