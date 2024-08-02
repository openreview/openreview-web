/* globals promptError: false */

import { useEffect, useState } from 'react'
import NoteList from '../NoteList'
import PaginationLinks from '../PaginationLinks'

const ImportedPublicationsSection = ({
  updatePublicationIdsToUnlink,
  publications,
  totalCount,
}) => {
  const [publicationsToDisplay, setPublicationsToDisplay] = useState([])
  const [publicationIdsToUnlink, setPublicationIdsToUnlink] = useState([])
  const [pageNumber, setPageNumber] = useState(1)
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

  useEffect(() => {
    updatePublicationIdsToUnlink(publicationIdsToUnlink)
  }, [publicationIdsToUnlink])

  useEffect(() => {
    if (!publications) return
    setPublicationsToDisplay(
      publications.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
    )
  }, [pageNumber])

  if (!publicationsToDisplay.length) return null
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
