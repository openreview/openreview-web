/* globals promptError: false */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import NoteList from '../NoteList'
import PaginationLinks from '../PaginationLinks'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { getImportSourceIcon } from '../../lib/profiles'
import { buildNoteTitle, buildNoteUrl } from '../../lib/utils'
import UnlinkPublicationButton from '../UnlinkPublicationButton'

const ImportedPublicationsSection = ({
  profileId,
  updatePublicationIdsToUnlink,
  reRender,
}) => {
  const { accessToken } = useUser()
  const [publications, setPublications] = useState(null)
  const [publicationsToDisplay, setPublicationsToDisplay] = useState([])
  const [publicationIdsToUnlink, setPublicationIdsToUnlink] = useState([])
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  const handleLinkUnlinkPublication = (id, isunlink = false) => {
    if (isunlink) {
      setPublicationIdsToUnlink((p) => [...p, id])
    } else {
      setPublicationIdsToUnlink((p) => p.filter((q) => q !== id))
    }
  }

  const customTitle = (note) => {
    const { id, forum, content, invitations, signatures } = note
    return (
      <h4>
        {getImportSourceIcon(invitations[0])}
        <a href={buildNoteUrl(id, forum, content)} target="_blank" rel="nofollow noreferrer">
          {content.title?.value || buildNoteTitle(invitations[0], signatures)}
        </a>

        {content.pdf?.value && (
          <Link
            href={`/attachment?id=${id}&name=pdf`}
            className="pdf-link"
            title="Download PDF"
            target="_blank"
          >
            <img src="/images/pdf_icon_blue.svg" alt="pdf icon" />
          </Link>
        )}
        {content.html?.value && (
          <a
            href={content.html.value}
            className="html-link"
            title="Open Website"
            rel="noopener noreferrer"
            target="_blank"
          >
            <img src="/images/html_icon_blue.svg" alt="hmtl icon" />
          </a>
        )}
        <UnlinkPublicationButton
          noteId={id}
          linkUnlinkPublication={handleLinkUnlinkPublication}
          isUnlinked={publicationIdsToUnlink?.includes(note.id)}
        />
      </h4>
    )
  }

  const displayOptions = {
    pdfLink: true,
    htmlLink: true,
    showContents: false,
    openNoteInNewWindow: true,
    unlinkButton: true,
    unlinkedPublications: publicationIdsToUnlink,
    linkUnlinkPublication: handleLinkUnlinkPublication,
    emptyMessage: 'No imported publications found',
    customTitle,
  }

  const loadPublications = async () => {
    try {
      const v2Notes = await api
        .getAll(
          '/notes',
          {
            'content.authorids': profileId,
            invitations: [
              'DBLP.org/-/Record',
              'OpenReview.net/Archive/-/Imported_Record',
              'OpenReview.net/Archive/-/Direct_Upload',
              `${process.env.SUPER_USER}/Public_Article/ORCID.org/-/Record`,
            ],
          },
          { accessToken, sort: 'tmdate:desc' }
        )
        .then((notes) => notes.map((note) => ({ ...note, apiVersion: 2 })))
      const v1Notes = await api
        .getAll(
          '/notes',
          {
            'content.authorids': profileId,
            invitations: ['dblp.org/-/record'],
          },
          { accessToken, sort: 'tmdate:desc', version: 1 }
        )
        .then((notes) => notes.map((note) => ({ ...note, apiVersion: 1 })))

      const allNotes = v2Notes.concat(v1Notes)
      setPublications(allNotes)
      setTotalCount(allNotes.length)
    } catch (error) {
      promptError(`${error.message} when loading your publications`)
    }
  }

  useEffect(() => {
    updatePublicationIdsToUnlink(publicationIdsToUnlink)
  }, [publicationIdsToUnlink])

  useEffect(() => {
    setPublicationIdsToUnlink([])
    loadPublications()
  }, [reRender])

  useEffect(() => {
    if (!publications) return
    setPublicationsToDisplay(
      publications.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
    )
  }, [pageNumber, publications])

  return (
    <div>
      <NoteList notes={publicationsToDisplay} displayOptions={displayOptions} />
      <PaginationLinks
        currentPage={pageNumber}
        itemsPerPage={pageSize}
        totalCount={totalCount}
        setCurrentPage={setPageNumber}
        options={{ noScroll: true }}
      />
    </div>
  )
}

export default ImportedPublicationsSection
