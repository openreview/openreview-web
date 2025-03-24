'use client'

import { use, useCallback } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import PaginatedList from '../../../../components/PaginatedList'
import { inflect, prettyId } from '../../../../lib/utils'

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

export default function VenueRequestList({ requestNotesP }) {
  const venueRequestNotes = use(requestNotesP)

  const loadItems = useCallback(
    (limit, offset) =>
      Promise.resolve({
        items: venueRequestNotes.slice(offset, offset + limit),
        count: venueRequestNotes.length,
      }),
    [venueRequestNotes]
  )

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
