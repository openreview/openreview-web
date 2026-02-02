/* globals $,promptError: false */
import { useEffect, useRef, useState } from 'react'
import {
  getAllOrcidPapers,
  getOrcidPublicationsFromJsonUrl,
  postOrUpdateOrcidPaper,
} from '../lib/profiles'
import DblpPublicationTable from './DblpPublicationTable'
import LoadingSpinner from './LoadingSpinner'
import { getNameString, inflect } from '../lib/utils'
import useUser from '../hooks/useUser'

const ORCIDImportModal = ({ profileId, profileNames }) => {
  const modalEl = useRef(null)
  const [message, setMessage] = useState('')
  const [isSavingPublications, setIsSavingPublications] = useState(false)
  const [publications, setPublications] = useState([])
  const [publicationsInOpenReview, setPublicationsInOpenReview] = useState([])
  const [selectedPublications, setSelectedPublications] = useState([])
  const [isFetchingPublications, setIsFetchingPublications] = useState(false)
  const [hasError, setHasError] = useState(false)
  const { accessToken } = useUser()
  const maxNumberofPublicationsToImport = 500

  const countExistingImportedPapers = (allPublications, existingPublications) => {
    const existingPapers = allPublications.filter((p) =>
      existingPublications.find((q) => q.externalId === p.externalId)
    )

    return {
      numExisting: existingPapers.length,
      noPubsToImport: allPublications.length === existingPapers.length,
    }
  }

  const fetchNewPublications = async (orcid) => {
    setIsFetchingPublications(true)
    setHasError(false)
    try {
      const fetchedPublications = await getOrcidPublicationsFromJsonUrl(
        orcid,
        profileNames.map((p) => getNameString(p))
      )
      setPublications(fetchedPublications)
      setMessage(`${fetchedPublications.length} publications fetched.`)
      // get existing orcid publications
      const existingPublications = await getAllOrcidPapers(profileId, accessToken)
      setPublicationsInOpenReview(existingPublications)
      const { numExisting, noPubsToImport } = countExistingImportedPapers(
        fetchedPublications,
        existingPublications
      )
      if (noPubsToImport) {
        setMessage(`All ${fetchedPublications.length} of the publications already
            exist in OpenReview.`)
      } else {
        const newPubCount = fetchedPublications.length - numExisting
        setMessage(` We found ${fetchedPublications.length} publications,
          ${numExisting} of which already exist in OpenReview,
          ${newPubCount} of which ${newPubCount === 1 ? 'is' : 'are'} new.
          Please select the new publications of which you are actually an author. Then click "Add to Your Profile" to import them.`)
      }
    } catch (error) {
      setMessage(error.message)
      setHasError(true)
    }
    setIsFetchingPublications(false)
  }

  const importSelectedPublications = async () => {
    setIsSavingPublications(true)
    try {
      const postPaperResults = await Promise.allSettled(
        selectedPublications.map((pubKey) =>
          postOrUpdateOrcidPaper(
            profileId,
            profileNames,
            accessToken,
            publications.find((p) => p.key === pubKey)
          )
        )
      )
      const successfulCount = postPaperResults.filter(
        (result) => result.status === 'fulfilled'
      ).length
      const failedResults = postPaperResults.filter((result) => result.status === 'rejected')
      if (successfulCount === 0) {
        const firstError = failedResults[0]
        throw firstError.reason
      }
      const existingPublications = await getAllOrcidPapers(profileId, accessToken)
      setPublicationsInOpenReview(existingPublications)
      const { noPubsToImport: allExistInOpenReview } = countExistingImportedPapers(
        publications,
        existingPublications
      )
      if (allExistInOpenReview) {
        setMessage(`${selectedPublications.length} publications were successfully imported.
            All ${publications.length} of the publications now exist in OpenReview.`)
      } else if (failedResults.length === 0) {
        setMessage(`${selectedPublications.length} publications were successfully imported.
            Please select any additional publications you would like to add to your profile.`)
      } else {
        setMessage(`${successfulCount} publications were successfully imported.
            However, ${failedResults.length} publications failed to import. Please try again later.`)
      }

      if (allExistInOpenReview) {
        setTimeout(() => {
          $(modalEl.current).modal('hide')
        }, 2000)
      }
    } catch (error) {
      promptError(error.message)
      $(modalEl.current).modal('hide')
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
