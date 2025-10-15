'use client'

/* globals $: false */

import { useEffect } from 'react'
import { nanoid } from 'nanoid'
import Link from 'next/link'
import NoteList, { GroupedNoteList } from '../NoteList'

const ProfilePublications = ({
  profileId,
  publications,
  count,
  loading,
  preferredName,
  numPublicationsToShow = 10,
  openNoteInNewWindow = false,
}) => {
  const displayOptions = {
    pdfLink: false,
    htmlLink: false,
    showContents: false,
    showPrivateIcon: true,
    clientRenderingOnly: true,
    openNoteInNewWindow,
    referrer:
      preferredName &&
      profileId &&
      `[the profile of ${preferredName}](/profile?id=${profileId})`,
  }

  useEffect(() => {
    if (publications) {
      setTimeout(() => {
        $('[data-toggle="tooltip"]').tooltip('enable')
        $('[data-toggle="tooltip"]').tooltip({ container: 'body' })
      }, 100)
    }
  }, [publications])

  if (loading) {
    return (
      <p className="loading-message">
        <em>Loading...</em>
      </p>
    )
  }

  return publications?.length > 0 ? (
    <>
      <GroupedNoteList
        key={nanoid()}
        notes={publications.slice(0, numPublicationsToShow)}
        displayOptions={displayOptions}
      />

      {count > numPublicationsToShow && (
        <Link
          href={`/search?term=${profileId}&content=authors&group=all&source=forum&sort=cdate:desc`}
        >
          View all {count} publications
        </Link>
      )}
    </>
  ) : (
    <p className="empty-message">No publications</p>
  )
}

export default ProfilePublications
