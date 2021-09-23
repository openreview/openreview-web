/* globals promptError: false */

import { useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import NoteList from '../NoteList'
import PaginationLinks from '../PaginationLinks'

const ImportedPublicationsSection = ({ profileId, updatePublicationIdsToUnlink, reRender }) => {
  const { accessToken } = useUser()
  const [publications, setPublications] = useState([])
  const [publicationIdsToUnlink, setPublicationIdsToUnlink] = useState([])
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  const handleLinkUnlinkPublication = (id, isunlink = false) => {
    if (isunlink) {
      setPublicationIdsToUnlink(p => [...p, id])
    } else {
      setPublicationIdsToUnlink(p => p.filter(q => q !== id))
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
  }

  const loadPublications = async () => {
    const result = await api.get('/notes', {
      'content.authorids': profileId,
      details: 'invitation,original',
      sort: 'tmdate:desc',
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
      invitations: ['dblp.org/-/record', 'OpenReview.net/Archive/-/Imported_Record', 'OpenReview.net/Archive/-/Direct_Upload']
    }, { accessToken, cache: false })
    setPublications(result.notes)
    setTotalCount(result.count)
  }

  useEffect(() => {
    updatePublicationIdsToUnlink(publicationIdsToUnlink)
  }, [publicationIdsToUnlink])

  useEffect(() => {
    try {
      loadPublications()
    } catch (error) {
      promptError(error.message)
    }
  }, [pageNumber, reRender])

  if (!publications.length) return null
  return (
    <section>
      <h4>Imported Publications</h4>
      <p className="instructions">
        Below is a list of publications imported from DBLP and other sources that include you as an author.
        {' '}
        To remove any publications of which you are not actually an author of, click the minus sign next to the title.
      </p>
      <NoteList notes={publications} displayOptions={displayOptions} />
      <PaginationLinks
        currentPage={pageNumber}
        itemsPerPage={pageSize}
        totalCount={totalCount}
        setCurrentPage={setPageNumber}
        options={{ noScroll: true }}
      />
    </section>
  )
}

export default ImportedPublicationsSection
