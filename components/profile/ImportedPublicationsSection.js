/* globals promptError: false */

import { useEffect, useState } from 'react'
import NoteList from '../NoteList'
import PaginationLinks from '../PaginationLinks'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import ProfileSection from './ProfileSection'

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

  if (!publicationsToDisplay.length) {
    return (
      <ProfileSection
        title="Imported Publications"
        instructions="Did not find publications listing you as an author in DBLP and other sources."
      />
    )
  }

  return (
    <ProfileSection
      title="Imported Publications"
      instructions="Below is a list of publications imported from DBLP and other sources that
        include you as an author. To remove any publications you are not actually an author of
        from your profile, click the minus sign next to the title."
    >
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
    </ProfileSection>
  )
}

export default ImportedPublicationsSection
