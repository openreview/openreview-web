/* globals promptError: false */

import { useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import NoteList from '../NoteList'

const ImportedPublicationsSection = ({ profileId, updatePublicationIdsToUnlink }) => {
  const { accessToken } = useUser()
  const [publications, setPublications] = useState([])
  const [publicationIdsToUnlink, setPublicationIdsToUnlink] = useState([])

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

  useEffect(() => {
    const loadPublications = async () => {
      const result = await api.get('/notes', {
        'content.authorids': profileId,
        details: 'invitation,original',
        sort: 'tmdate:desc',
        offset: 0,
        limit: 20,
        invitations: ['dblp.org/-/record', 'OpenReview.net/Archive/-/Imported_Record', 'OpenReview.net/Archive/-/Direct_Upload']
      }, { accessToken, cache: false })
      setPublications(result.notes)
    }
    try {
      loadPublications()
    } catch (error) {
      promptError(error.message)
    }
  }, [])

  useEffect(() => {
    updatePublicationIdsToUnlink(publicationIdsToUnlink)
  }, [publicationIdsToUnlink])

  return (
    <section>
      <h4>Imported Publications</h4>
      <p className="instructions">
        Below is a list of publications imported from DBLP and other sources that include you as an author.
        {' '}
        To remove any publications of which you are not actually an author of, click the minus sign next to the title.
      </p>
      <NoteList notes={publications} displayOptions={displayOptions} />
    </section>
  )
}

export default ImportedPublicationsSection
