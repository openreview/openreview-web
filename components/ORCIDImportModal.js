/* globals $: false */
import { useContext, useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import {
  getAllOrcidPapers,
  getAllPapersByGroupId,
  getOrcidPublicationsFromJsonUrl,
  getOrcidPublicationsFromXmlUrl,
} from '../lib/profiles'
import DblpPublicationTable from './DblpPublicationTable'
import LoadingSpinner from './LoadingSpinner'
import { inflect } from '../lib/utils'
import UserContext from './UserContext'

const ORCIDImportModal = ({ profileId, profileNames }) => {
  const modalEl = useRef(null)
  const [message, setMessage] = useState('')
  const [isSavingPublications, setIsSavingPublications] = useState(false)
  const [publications, setPublications] = useState([])
  const [publicationsInOpenReview, setPublicationsInOpenReview] = useState([])
  const [selectedPublications, setSelectedPublications] = useState([])
  const [isFetchingPublications, setIsFetchingPublications] = useState(false)
  const [hasError, setHasError] = useState(false)
  const { accessToken } = useContext(UserContext)
  const maxNumberofPublicationsToImport = 500

  const fetchNewPublications = async (orcid) => {
    setIsFetchingPublications(true)
    setHasError(false)
    try {
      // setPublicationsInOpenReview(await getAllPapersByGroupId(profileId))
      const fetchedPublications = await getOrcidPublicationsFromJsonUrl(orcid, profileNames)
      setPublications(fetchedPublications.map((p) => ({ ...p, key: nanoid() })))
      setMessage(`${fetchedPublications.length} publications fetched.`)
      // get existing orcid publications
      setPublicationsInOpenReview(await getAllOrcidPapers(profileId, accessToken))
      // get orcid publications imported by other profiles
    } catch (error) {
      setMessage(error.message)
      setHasError(true)
    }
    setIsFetchingPublications(false)
  }

  const importSelectedPublications = async () => {
    setIsFetchingPublications(true)
    try {
      console.log('Selected publications:', selectedPublications)
      console.log(
        'Selected publications IDs:',
        publications.find((p) => p.key === selectedPublications[0])
      )
    } catch (error) {
      setMessage(error.message)
    }
    setIsSavingPublications(false)
    setSelectedPublications([])
  }

  useEffect(() => {
    $(modalEl.current).on('show.bs.modal', () => {
      const orcidInputVal = $('#orcid_url').val().trim()
      const isValidOrcid = /^https:\/\/orcid.org\/\d{4}-\d{4}-\d{4}-\d{3}[0-9Xx]$/.test(
        orcidInputVal
      )
      if (!isValidOrcid) {
        setMessage('ORCID URL is invalid.')
      }

      const orcid = orcidInputVal.replace('https://orcid.org/', '')
      fetchNewPublications(orcid)
    })
  }, [])

  return (
    <div id="orcid-import-modal" className="modal fade in" tabIndex="-1" ref={modalEl}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            {!isSavingPublications && (
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">{'\u00D7'}</span>
              </button>
            )}
            <h3 className="modal-title">Import ORCID Publications</h3>
          </div>

          <div className="modal-body">
            {message && <p>{message}</p>}
            {isFetchingPublications ? (
              <LoadingSpinner inline />
            ) : (
              <DblpPublicationTable
                dblpPublications={publications}
                orPublications={publicationsInOpenReview}
                orPublicationsImportedByOtherProfile={[]}
                selectedPublications={selectedPublications}
                setSelectedPublications={setSelectedPublications}
                maxNumberofPublicationsToImport={maxNumberofPublicationsToImport}
              />
            )}
          </div>

          <div className="modal-footer">
            <div className="pull-left selected-count">
              {selectedPublications.length !== 0 && (
                <strong>
                  {inflect(selectedPublications.length, 'publication', 'publications', true)}{' '}
                  selected{' '}
                  {selectedPublications.length === maxNumberofPublicationsToImport &&
                    '(max allowed)'}
                </strong>
              )}
            </div>
            <button
              type="button"
              className="btn btn-default"
              data-dismiss="modal"
              disabled={isSavingPublications}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={importSelectedPublications}
              disabled={!selectedPublications.length || isSavingPublications || hasError}
            >
              Add to Your Profile
              {isSavingPublications && (
                <div className="spinner-small">
                  <div className="rect1" />
                  <div className="rect2" />
                  <div className="rect3" />
                  <div className="rect4" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ORCIDImportModal
