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
  const [publications, setPublications] = useState([])
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
      const result = await api.get(
        '/notes',
        {
          'content.authorids': profileId,
          sort: 'tmdate:desc',
          offset: (pageNumber - 1) * pageSize,
          limit: pageSize,
          invitations: [
            'DBLP.org/-/Record',
            'OpenReview.net/Archive/-/Imported_Record',
            'OpenReview.net/Archive/-/Direct_Upload',
          ],
        },
        { accessToken, version: 2 }
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
    loadPublications()
  }, [pageNumber, reRender])

  if (!publications.length) return null
  return (
    <div>
      <NoteList notes={publications} displayOptions={displayOptions} />
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
