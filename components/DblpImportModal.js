/* globals $,clearMessage: false */

import { useState, useRef, useEffect } from 'react'
import { nanoid } from 'nanoid'
import LoadingSpinner from './LoadingSpinner'
import DblpPublicationTable from './DblpPublicationTable'
import {
  getDblpPublicationsFromXmlUrl,
  getAllPapersByGroupId,
  postOrUpdatePaper,
  getAllPapersImportedByOtherProfiles,
} from '../lib/profiles'
import { deburrString, getNameString, inflect } from '../lib/utils'

const ErrorMessage = ({ message, dblpNames, profileNames }) => {
  if (!dblpNames?.length) return <p>{message}</p>
  return (
    <>
      <p>
        Your OpenReview profile must contain the <strong>EXACT</strong> name used in your DBLP
        papers.
      </p>
      {dblpNames.length >= 0 && (
        <>
          <p>Should any of the following names be added to your profile?</p>
          <ul>
            {dblpNames.map((name) => (
              <li key={name}>
                <strong>{name}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
      {profileNames.length >= 0 && (
        <>
          <p>Your current names are listed below:</p>
          <ul>
            {profileNames.map((name) => (
              <li key={name.key}>{getNameString(name)}</li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

export default function DblpImportModal({ profileId, profileNames, updateDBLPUrl }) {
  const [dblpUrl, setDblpUrl] = useState('')
  const [dblpPersistentUrl, setDblpPersistentUrl] = useState('')
  const [message, setMessage] = useState('')
  // show persistent url input and button if dblp url in profile is not working
  const [showPersistentUrlInput, setShowPersistentUrlInput] = useState(false)
  const [publications, setPublications] = useState([])
  const [selectedPublications, setSelectedPublications] = useState([])
  const [isSavingPublications, setIsSavingPublications] = useState(false)
  const [isFetchingPublications, setIsFetchingPublications] = useState(false)
  const [hasError, setHasError] = useState(false)
  // user's existing publications in openreview (for filtering and constructing publication link)
  const publicationsInOpenReview = useRef([])
  const publicationsImportedByOtherProfiles = useRef([])
  const modalEl = useRef(null)
  const dblpNames = useRef(null)

  const maxNumberofPublicationsToImport = 500

  const getExistingFromDblpPubs = (allDblpPubs) => {
    const existingPubsInAllDblpPubs = allDblpPubs.filter(
      // eslint-disable-next-line max-len
      (dblpPub) =>
        publicationsInOpenReview.current.find(
          (orPub) => orPub.title === dblpPub.formattedTitle && orPub.venue === dblpPub.venue
        )
    )
    const associatedWithOtherProfilesPubsInAllDblpPubs = allDblpPubs.filter(
      // eslint-disable-next-line max-len
      (dblpPub) =>
        publicationsImportedByOtherProfiles.current.find(
          (orPub) => orPub.title === dblpPub.formattedTitle && orPub.venue === dblpPub.venue
        )
    )
    return {
      numExisting: existingPubsInAllDblpPubs.length,
      numAssociatedWithOtherProfile: associatedWithOtherProfilesPubsInAllDblpPubs.length,
      noPubsToImport:
        allDblpPubs.length ===
        existingPubsInAllDblpPubs.length + associatedWithOtherProfilesPubsInAllDblpPubs.length,
    }
  }

  const fetchNewPublications = async (url, isPersistentUrl = false) => {
    setMessage('Fetching publications from DBLP...')
    setIsFetchingPublications(true)
    setPublications([])
    setHasError(false)
    dblpNames.current = null
    if (isPersistentUrl) setDblpUrl(dblpPersistentUrl)

    try {
      const { notes: allDblpPublications, possibleNames } =
        await getDblpPublicationsFromXmlUrl(
          `${url.trim()}.xml`,
          profileId,
          profileNames.map((p) => getNameString(p))
        )

      if (
        !possibleNames.some((name) =>
          profileNames.some((pName) =>
            deburrString(name, false).includes(deburrString(getNameString(pName), false))
          )
        )
      ) {
        dblpNames.current = possibleNames
        setMessage('notMatchError')
        setShowPersistentUrlInput(false)
        setIsFetchingPublications(false)
        return
      }
      setPublications(allDblpPublications.map((p) => ({ ...p, key: nanoid() })))
      setMessage(`${allDblpPublications.length} publications fetched.`)

      // contains id (for link) and title (for filtering) of existing publications in openreivew
      publicationsInOpenReview.current = await getAllPapersByGroupId(profileId)
      publicationsImportedByOtherProfiles.current = await getAllPapersImportedByOtherProfiles(
        allDblpPublications.map((p) => ({
          authorIndex: p.authorIndex,
          authorCount: p.authorCount,
          title: p.formattedTitle,
          venue: p.venue,
          year: p.year,
        })),
        profileNames
      )
      const { numExisting, numAssociatedWithOtherProfile, noPubsToImport } =
        getExistingFromDblpPubs(allDblpPublications)
      if (noPubsToImport) {
        setMessage(`All ${allDblpPublications.length} of the publications fetched from DBLP already
            exist in OpenReview.`)
      } else {
        const newPubCount =
          allDblpPublications.length - numExisting - numAssociatedWithOtherProfile
        setMessage(` We found ${
          allDblpPublications.length
        } publications on this DBLP home page,
          ${numExisting} of which already exist in OpenReview,
          ${
            numAssociatedWithOtherProfile
              ? `${numAssociatedWithOtherProfile} of which ${
                  numAssociatedWithOtherProfile === 1 ? 'is' : 'are'
                } associated with other profiles,`
              : ''
          }
          ${newPubCount} of which ${newPubCount === 1 ? 'is' : 'are'} new.
          Please select the new publications of which you are actually an author. Then click "Add to Your Profile" to import them.
          Then don't forget to "Save Profile Changes" at the bottom of the page.`)
      }
      setShowPersistentUrlInput(false)
    } catch (error) {
      if (error instanceof URIError || error instanceof TypeError) {
        // failed at getDblpPublicationsFromXmlUrl
        setMessage('')
        setShowPersistentUrlInput(true)
      } else {
        setMessage(error.message)
        setShowPersistentUrlInput(false)
      }
      setHasError(true)
    }
    setIsFetchingPublications(false)
  }

  const importSelectedPublications = async () => {
    setIsSavingPublications(true)

    try {
      const postPaperResults = await Promise.allSettled(
        selectedPublications.map((key) =>
          postOrUpdatePaper(
            publications.find((p) => p.key === key),
            profileId,
            profileNames
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

      publicationsInOpenReview.current = await getAllPapersByGroupId(profileId)
      const { noPubsToImport: allExistInOpenReview } = getExistingFromDblpPubs(publications)
      if (allExistInOpenReview) {
        setMessage(`${selectedPublications.length} publications were successfully imported.
            All ${publications.length} of the publications from DBLP now exist in OpenReview.`)
      } else if (failedResults.length === 0) {
        setMessage(`${selectedPublications.length} publications were successfully imported.
            Please select any additional publications you would like to add to your profile.`)
      } else {
        setMessage(`${successfulCount} publications were successfully imported.
            However, ${failedResults.length} publications failed to import. Please try again later.`)
      }

      // replace other format of dblp homepage with persistent url
      if ($('#dblp_url').val() !== dblpUrl) {
        // eslint-disable-next-line no-unused-expressions
        updateDBLPUrl ? updateDBLPUrl(dblpUrl) : $('#dblp_url').val(dblpUrl)
      }

      if (allExistInOpenReview) {
        setTimeout(() => {
          $(modalEl.current).modal('hide')
        }, 2000)
      }
    } catch (error) {
      const errorMessage =
        error.name === 'TooManyError'
          ? 'DBLP import quota has reached'
          : 'An error occurred while importing your publications. Please try again later.'
      setMessage(errorMessage)
    }

    $(modalEl.current).find('.modal-body')[0].scrollTop = 0
    setIsSavingPublications(false)
    setSelectedPublications([])
  }

  const handlePersistentUrlInputKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      fetchNewPublications(dblpPersistentUrl, true)
    }
  }

  useEffect(() => {
    $(modalEl.current).on('show.bs.modal', () => {
      clearMessage()
      // read current dblp url from input
      let dblpInputVal = $('#dblp_url').val().trim()
      if (dblpInputVal.endsWith('.html')) dblpInputVal = dblpInputVal.slice(0, -5)
      if (!dblpInputVal) {
        setMessage('DBLP URL cannot be empty.')
        return
      }
      setDblpUrl(dblpInputVal)
      setDblpPersistentUrl('')
      setSelectedPublications([])
      fetchNewPublications(dblpInputVal)
    })
  }, [])

  return (
    <div id="dblp-import-modal" className="modal fade in" tabIndex="-1" ref={modalEl}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            {!isSavingPublications && (
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">{'\u00D7'}</span>
              </button>
            )}
            <h3 className="modal-title">Import DBLP Publications</h3>
          </div>

          <div className={`modal-body ${isSavingPublications ? 'disable-scroll' : ''}`}>
            {message && (
              <ErrorMessage
                message={message}
                dblpNames={dblpNames.current}
                profileNames={profileNames}
              />
            )}

            {showPersistentUrlInput && (
              <form>
                <div className="input-group persistent-url-input">
                  <input
                    type="text"
                    className="form-control"
                    value={dblpPersistentUrl}
                    placeholder="DBLP.org Persistent URL"
                    onChange={(e) =>
                      setDblpPersistentUrl(
                        e.target.value.trim().endsWith('.html')
                          ? e.target.value.trim().slice(0, -5)
                          : e.target.value.trim()
                      )
                    }
                    maxLength={100}
                    onKeyPress={(e) => handlePersistentUrlInputKeyPress(e)}
                  />
                  <span className="input-group-btn">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => fetchNewPublications(dblpPersistentUrl, true)}
                      disabled={!dblpPersistentUrl}
                    >
                      Show Papers
                    </button>
                  </span>
                </div>
                <div className="body-message">
                  Retrieving papers from DBLP requires a &quot;Persistent DBLP URL.&quot;
                  Unfortunately, DBLP does not provide this URL by default. You must obtain the
                  persistent URL for your home page from DBLP by following the steps below:
                  <ol>
                    <li>
                      Visit your DBLP home page:{' '}
                      <a href={dblpUrl} target="_blank" rel="noreferrer">
                        {dblpUrl}
                      </a>
                    </li>
                    <li>
                      Hover over the share icon (
                      <img src="/images/share_alt.svg" alt="share" />) to the right of your
                      name in the page heading
                    </li>
                    <li>Copy the URL labeled &quot;persistent URL&quot; in the hover menu</li>
                  </ol>
                  Paste this URL into the text field above and click &quot;Show Papers&quot;
                </div>
              </form>
            )}

            {isFetchingPublications ? (
              <LoadingSpinner inline />
            ) : (
              <DblpPublicationTable
                dblpPublications={publications}
                orPublications={publicationsInOpenReview.current}
                orPublicationsImportedByOtherProfile={
                  publicationsImportedByOtherProfiles.current
                }
                selectedPublications={selectedPublications}
                setSelectedPublications={setSelectedPublications}
                maxNumberofPublicationsToImport={maxNumberofPublicationsToImport}
              />
            )}

            {isSavingPublications && (
              <div className="saving-overlay">
                <LoadingSpinner text="saving" />
              </div>
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
