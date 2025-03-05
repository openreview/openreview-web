/* globals promptError: false */

import { useEffect, useState } from 'react'
import NoteList from '../NoteList'
import PaginationLinks from '../PaginationLinks'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'

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

  const displayOptions = {
    pdfLink: true,
    htmlLink: true,
    showContents: false,
    openNoteInNewWindow: true,
    unlinkButton: true,
    unlinkedPublications: publicationIdsToUnlink,
    linkUnlinkPublication: handleLinkUnlinkPublication,
    emptyMessage: 'No imported publications found',
  }

  const loadPublications = async () => {
    try {
      const result = await api.getCombined(
        '/notes',
        {
          'content.authorids': profileId,
          invitations: ['dblp.org/-/record'],
        },
        {
          'content.authorids': profileId,
          invitations: [
            'DBLP.org/-/Record',
            'OpenReview.net/Archive/-/Imported_Record',
            'OpenReview.net/Archive/-/Direct_Upload',
          ],
        },
        { accessToken, includeVersion: true, sort: 'tmdate:desc' }
      )
      setPublications(result.notes)
      setTotalCount(result.count)
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
