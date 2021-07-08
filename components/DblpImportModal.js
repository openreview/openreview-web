/* globals $: false */

import {
  useState, useRef, useEffect, useContext,
} from 'react'
import LoadingSpinner from './LoadingSpinner'
import DblpPublicationTable from './DblpPublicationTable'
import {
  getDblpPublicationsFromXmlUrl, getAllPapersByGroupId, postOrUpdatePaper, getAllPapersImportedByOtherProfiles,
} from '../lib/profiles'
import UserContext from './UserContext'
import { inflect } from '../lib/utils'

const ErrorMessage = ({ message, dblpNames, profileNames }) => {
  if (!dblpNames?.length) return <p>{message}</p>
  return (
    <>
      <p>
        Your OpenReview profile must contain the
        {' '}
        <strong>EXACT</strong>
        {' '}
        name used in your DBLP papers.
      </p>
      {dblpNames.length >= 0 && (
        <>
          <p>Should any of the following names be added to your profile?</p>
          <ul>
            {
              dblpNames.map(name => <li key={name}><strong>{name}</strong></li>)
            }
          </ul>
        </>
      )}
      {profileNames.length >= 0 && (
        <>
          <p>Your current names are listed below:</p>
          <ul>
            {
              profileNames.map(name => <li key={name}>{name}</li>)
            }
          </ul>
        </>
      )}
    </>
  )
}

export default function DblpImportModal({ profileId, profileNames, email }) {
  const [dblpUrl, setDblpUrl] = useState('')
  const [dblpPersistentUrl, setDblpPersistentUrl] = useState('')
  const [message, setMessage] = useState('')
  // show persistent url input and button if dblp url in profile is not working
  const [showPersistentUrlInput, setShowPersistentUrlInput] = useState(false)
  const [publications, setPublications] = useState([])
  const [selectedPublications, setSelectedPublications] = useState([])
  const [isSavingPublications, setIsSavingPublications] = useState(false)
  const [isFetchingPublications, setIsFetchingPublications] = useState(false)
  // user's existing publications in openreview (for filtering and constructing publication link)
  const publicationsInOpenReview = useRef([])
  const publicationsImportedByOtherProfiles = useRef([])
  const modalEl = useRef(null)
  const dblpNames = useRef(null)
  const { accessToken } = useContext(UserContext)

  const getExistingFromDblpPubs = (allDblpPubs) => {
    const existingPubsInAllDblpPubs = allDblpPubs.filter(
      dblpPub => publicationsInOpenReview.current.find(orPub => orPub.title === dblpPub.formattedTitle),
    )
    const associatedWithOtherProfilesPubsInAllDblpPubs = allDblpPubs.filter(
      dblpPub => publicationsImportedByOtherProfiles.current.find(orPub => orPub.title === dblpPub.formattedTitle),
    )
    return {
      numExisting: existingPubsInAllDblpPubs.length,
      numAssociatedWithOtherProfile: associatedWithOtherProfilesPubsInAllDblpPubs.length,
      noPubsToImport: allDblpPubs.length === (
        existingPubsInAllDblpPubs.length + associatedWithOtherProfilesPubsInAllDblpPubs.length),
    }
  }

  const fetchNewPublications = async (url, isPersistentUrl = false) => {
    setMessage('Fetching publications from DBLP...')
    setIsFetchingPublications(true)
    setPublications([])
    dblpNames.current = null
    if (isPersistentUrl) setDblpUrl(dblpPersistentUrl)

    try {
      const { notes: allDblpPublications, possibleNames } = await getDblpPublicationsFromXmlUrl(`${url.trim()}.xml`, profileId)
      if (!allDblpPublications.some(pub => profileNames.some(name => (
        pub.note.content.dblp.toLowerCase().includes(name.toLowerCase())
      )))) {
        dblpNames.current = possibleNames
        setMessage('notMatchError')
        setShowPersistentUrlInput(false)
        setIsFetchingPublications(false)
        return
      }
      setPublications(allDblpPublications)
      setMessage(`${allDblpPublications.length} publications fetched.`)

      // contains id (for link) and title (for filtering) of existing publications in openreivew
      publicationsInOpenReview.current = await getAllPapersByGroupId(profileId, accessToken)
      const result = await getAllPapersImportedByOtherProfiles(allDblpPublications.map(p => ({
        authorIndex: p.authorIndex,
        authorCount: p.authorCount,
        title: p.formattedTitle,
      })), profileId, accessToken)
      publicationsImportedByOtherProfiles.current = result.filter(p => p)
      const {
        numExisting,
        numAssociatedWithOtherProfile,
        noPubsToImport,
      } = getExistingFromDblpPubs(allDblpPublications)
      if (noPubsToImport) {
        setMessage(`All ${allDblpPublications.length} of the publications fetched from DBLP already
            exist in OpenReview.`)
      } else {
        const newPubCount = allDblpPublications.length - numExisting - numAssociatedWithOtherProfile
        setMessage(` We found ${allDblpPublications.length} publications on your DBLP home page,
          ${numExisting} of which already exist in OpenReview,
          ${numAssociatedWithOtherProfile ? `${numAssociatedWithOtherProfile} of which ${numAssociatedWithOtherProfile === 1 ? 'is' : 'are'} associated with other profiles,` : ''}
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
    }
    setIsFetchingPublications(false)
  }

  const importSelectedPublications = async () => {
    setIsSavingPublications(true)

    try {
      await Promise.all(selectedPublications.map(index => postOrUpdatePaper(
        publications[index], profileId, profileNames, accessToken,
      )))

      publicationsInOpenReview.current = await getAllPapersByGroupId(profileId)
      const { noPubsToImport: allExistInOpenReview } = getExistingFromDblpPubs(publications)
      if (allExistInOpenReview) {
        setMessage(`${selectedPublications.length} publications were successfully imported.
            All ${publications.length} of the publications from DBLP now exist in OpenReview.`)
      } else {
        setMessage(`${selectedPublications.length} publications were successfully imported.
            Please select any additional publications you would like to add to your profile.`)
      }

      // replace other format of dblp homepage with persistent url
      if ($('#dblp_url').val() !== dblpUrl) {
        $('#dblp_url').val(dblpUrl)
      }

      if (allExistInOpenReview) {
        setTimeout(() => {
          $(modalEl.current).modal('hide')
        }, 2000)
      }
    } catch (error) {
      setMessage('An error occurred while importing your publications. Please try again later.')
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
      // read current dblp url from input
      const dblpInputVal = $('#dblp_url').val().trim()
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
            <h3 className="modal-title">
              Import DBLP Publications
            </h3>
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
                    onChange={e => setDblpPersistentUrl(e.target.value.trim().endsWith('.html') ? e.target.value.trim().slice(0, -5) : e.target.value.trim())}
                    maxLength={100}
                    onKeyPress={e => handlePersistentUrlInputKeyPress(e)}
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
                  Retrieving papers from DBLP requires a &quot;Persistent DBLP URL.&quot; Unfortunately, DBLP does
                  not provide this URL by default. You must obtain the persistent URL for your home page from DBLP
                  by following the steps below:
                  <ol>
                    <li>
                      Visit your DBLP home page:
                      {' '}
                      <a href={dblpUrl} target="_blank" rel="noreferrer">{dblpUrl}</a>
                    </li>
                    <li>
                      Hover over the share icon (
                      <img src="/images/share_alt.svg" alt="share" />
                      ) to the right of your name in the page heading
                    </li>
                    <li>Copy the URL labeled &quot;persistent URL&quot; in the hover menu</li>
                  </ol>
                  Paste this URL into the text field above and click &quot;Show Papers&quot;
                </div>
              </form>
            )}

            {isFetchingPublications && (
              <LoadingSpinner inline />
            )}

            <DblpPublicationTable
              dblpPublications={publications}
              orPublications={publicationsInOpenReview.current}
              orPublicationsImportedByOtherProfile={publicationsImportedByOtherProfiles.current}
              selectedPublications={selectedPublications}
              setSelectedPublications={setSelectedPublications}
            />

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
                  {inflect(selectedPublications.length, 'publication', 'publications', true)}
                  {' '}
                  selected
                </strong>
              )}
            </div>

            <button type="button" className="btn btn-default" data-dismiss="modal" disabled={isSavingPublications}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={importSelectedPublications} disabled={!selectedPublications.length || isSavingPublications}>
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
