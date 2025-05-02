/* globals $: false */
import { useEffect, useRef, useState } from 'react'
import { getOrcidPublicationsFromXmlUrl } from '../lib/profiles'
import DblpPublicationTable from './DblpPublicationTable'

const ORCIDImportModal = ({ profileNames }) => {
  const modalEl = useRef(null)
  const [message, setMessage] = useState('')
  const [isSavingPublications, setIsSavingPublications] = useState(false)
  const [publications, setPublications] = useState([])

  const fetchNewPublications = async (orcid) => {
    try {
      const fetchedPublications = await getOrcidPublicationsFromXmlUrl(orcid, profileNames)
      setPublications(fetchedPublications)
    } catch (error) {
      setMessage(error.message)
    }
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
            <DblpPublicationTable
              dblpPublications={publications}
              orPublications={[]}
              orPublicationsImportedByOtherProfile={[]}
              selectedPublications={[]}
              // setSelectedPublications={setSelectedPublications}
              // maxNumberofPublicationsToImport={maxNumberofPublicationsToImport}
            />
          </div>

          <div className="modal-footer"></div>
        </div>
      </div>
    </div>
  )
}

export default ORCIDImportModal
