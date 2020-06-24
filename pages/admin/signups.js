/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import withAdminAuth from '../../components/withAdminAuth'
import api from '../../lib/api-client'
import { formatDateTime } from '../../lib/utils'
import Icon from '../../components/Icon'
import Pagination from '../../components/PaginationLinks'

const Signups = ({ appContext, accessToken }) => {
  const { setBannerHidden } = appContext

  useEffect(() => {
    setBannerHidden(true)
  }, [])

  return (
    <>
      <Head>
        <title key="title">User Moderation | OpenReview</title>
      </Head>
      <header>
        <h1>User Moderation</h1>
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        <p>Moderation is currently <strong>{`${process.env.USER_MODERATION ? 'enabled' : 'disabled'}`}</strong> for new user profiles.</p>
        <hr />
      </header>

      <div className="moderation-container">
        <div className="profiles-list not-moderated">
          <UserModerationQueue accessToken={accessToken} onlyModeration={false} title="Recently Created Profiles" />
        </div>

        <div className="profiles-list under-moderation">
          <UserModerationQueue accessToken={accessToken} />
        </div>
      </div>
    </>
  )
}

// eslint-disable-next-line object-curly-newline
const UserModerationQueue = ({ accessToken, onlyModeration = true, pageSize = 15, title = 'New Profiles Pending Moderation' }) => {
  const [profiles, setProfiles] = useState(null)
  const [pageNumber, setPageNumber] = useState(null)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [profileIdToReject, setProfileIdToReject] = useState(null)
  const totalCount = useRef(0)

  useEffect(() => {
    setPageNumber(1)
  }, [])

  useEffect(() => {
    getProfiles(pageNumber)
  }, [pageNumber])

  const getProfiles = async (pageNumber) => {
    if (!pageNumber) return
    const options = {
      sort: 'tcdate:desc',
      limit: pageSize,
      offset: (pageNumber - 1) * pageSize,
      ...onlyModeration ? { needsModeration: true } : {},
    }
    try {
      const result = await api.get('/profiles', options, { accessToken })
      if (pageNumber === 1) totalCount.current = result.count
      setProfiles(result.profiles)
    } catch (error) {
      promptError(error.message)
    }
  }

  const acceptButtonClickHandler = async (profileId, name) => {
    const result = await api.post('/activate/moderate', {
      id: profileId,
      activate: true,
    }, { accessToken })
    getProfiles(pageNumber)
    promptMessage(`${name} is now active`)
  }

  const rejectButtonClickHandler = async (profileId) => {
    setProfileIdToReject(profileId)
    setShowRejectionModal(true)
  }

  return (
    <>
      {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
      <h4>{title} ({totalCount.current})</h4>
      <ul className="list-unstyled list-paginated" style={{ height: `${totalCount.current === 0 ? 'undefined' : '485px'}` }}>
        {
          (profiles && profiles?.length) ? profiles.map((profile) => {
            const name = profile.content.names[0]
            return (
              <li key={profile.id}>
                <span className="col-name">
                  {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                  <a href={`/profile?id=${profile.id}`} target="_blank" rel="noreferrer" title={profile.id}>{name.first} {name.middle} {name.last}</a>
                </span>
                <span className="col-email text-muted">
                  {profile.content.preferredEmail}
                </span>
                <span className="col-created">
                  {formatDateTime(profile.tmdate)}
                </span>
                <span className="col-status">
                  <span className={`label label-${profile.password ? 'success' : 'danger'}`}>password</span>
                  {' '}
                  <span className={`label label-${profile.active ? 'success' : 'danger'}`}>active</span>
                </span>
                <span className="col-actions">
                  {
                    onlyModeration ? (
                      <>
                        <button type="button" className="btn btn-xs accept-profile" onClick={() => { acceptButtonClickHandler(profile.id, `${name.first} ${name.middle} ${name.last}`) }}>
                          <Icon name="ok-circle" />
                          Accept
                        </button>
                        {' '}
                        <button type="button" className="btn btn-xs reject-profile" onClick={() => rejectButtonClickHandler(profile.id)}>
                          <Icon name="remove-circle" />
                          Reject
                        </button>
                      </>
                    )
                      : (
                        // eslint-disable-next-line no-console
                        <button type="button" className="btn btn-xs delete-profile" disabled onClick={() => { console.warn('Deleting profiles is not currently possible from the UI') }}>
                          <Icon name="remove-circle" />
                          Delete
                        </button>
                      )
                  }
                </span>
              </li>
            )
          }) : <li><p className="empty-message">No profiles pending moderation.</p></li>
        }
      </ul>
      {totalCount.current !== 0 && <Pagination currentPage={pageNumber} itemsPerPage={15} totalCount={totalCount.current} baseUrl="/admin/signups?" updateParentPageNumber={setPageNumber} />}
      <RejectionModal show={showRejectionModal} modalClosed={() => setShowRejectionModal(false)} accessToken={accessToken} profileIdToReject={profileIdToReject} afterReject={() => getProfiles(pageNumber)} />
    </>
  )
}

// eslint-disable-next-line object-curly-newline
const RejectionModal = ({ show, modalClosed, accessToken, profileIdToReject, afterReject }) => {
  const [display, SetDisplay] = useState(false)
  const [rejectionMessage, setRejectionMessage] = useState('')
  useEffect(() => {
    SetDisplay(show)
  }, [show])

  const handleSubmitButtonClick = async () => {
    try {
      const result = await api.post('/activate/moderate', {
        id: profileIdToReject,
        activate: false,
        reason: rejectionMessage,
      }, { accessToken })
    } catch (error) {
      promptError(error.message)
    }
    cleanup()
    afterReject()
  }

  const cleanup = () => {
    SetDisplay(false)
    setRejectionMessage('')
    modalClosed()
  }

  return (
    <>
      <div className="modal" tabIndex={-1} role="dialog" style={{ display: `${display ? 'block' : 'none'}` }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-body">
              <form>
                <div className="form-group">
                  {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                  <label htmlFor="message">Reason to reject {profileIdToReject}:</label>
                  <textarea name="message" className="form-control" rows="5" required value={rejectionMessage} onChange={e => setRejectionMessage(e.target.value)} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal" onClick={cleanup}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSubmitButtonClick}>Submit</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade in" style={{ display: `${display ? 'block' : 'none'}` }} />
    </>
  )
}

export default withAdminAuth(Signups)
