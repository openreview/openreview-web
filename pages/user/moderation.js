/* globals promptError: false */
/* globals promptMessage: false */

import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import withAdminAuth from '../../components/withAdminAuth'
import Icon from '../../components/Icon'
import LoadSpinner from '../../components/LoadingSpinner'
import PaginationLinks from '../../components/PaginationLinks'
import api from '../../lib/api-client'
import { prettyId, formatDateTime } from '../../lib/utils'

const Moderation = ({ appContext, accessToken }) => {
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
        <hr />
      </header>

      <div className="moderation-container">
        <UserModerationQueue accessToken={accessToken} title="Recently Created Profiles" onlyModeration={false} />

        <UserModerationQueue accessToken={accessToken} title="New Profiles Pending Moderation" />
      </div>
    </>
  )
}

const UserModerationQueue = ({
  accessToken, title, onlyModeration = true, pageSize = 15,
}) => {
  const [profiles, setProfiles] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [profileIdToReject, setProfileIdToReject] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  const getProfiles = async () => {
    const queryOptions = onlyModeration ? { needsModeration: true } : {}

    try {
      const result = await api.get('/profiles', {
        ...queryOptions,
        sort: 'tcdate:desc',
        limit: pageSize,
        offset: (pageNumber - 1) * pageSize,
      }, { accessToken })
      setTotalCount(result.count ?? 0)
      setProfiles(result.profiles ?? [])
    } catch (error) {
      promptError(error.message)
    }
  }

  const acceptUser = async (profileId) => {
    try {
      await api.post('/activate/moderate', { id: profileId, activate: true }, { accessToken })
      getProfiles()
      promptMessage(`${prettyId(profileId)} is now active`)
    } catch (error) {
      promptError(error.message)
    }
  }

  const rejectUser = async (profileId) => {
    setProfileIdToReject(profileId)
    setShowRejectionModal(true)
  }

  useEffect(() => {
    getProfiles()
  }, [pageNumber])

  return (
    <div className="profiles-list">
      {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
      <h4>{title} ({totalCount})</h4>

      {profiles ? (
        <ul className="list-unstyled list-paginated">
          {profiles.map((profile) => {
            const name = profile.content.names[0]
            return (
              <li key={profile.id}>
                <span className="col-name">
                  <a href={`/profile?id=${profile.id}`} target="_blank" rel="noreferrer" title={profile.id}>
                    {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                    {name.first} {name.middle} {name.last}
                  </a>
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
                  {onlyModeration ? (
                    <>
                      <button type="button" className="btn btn-xs" onClick={() => acceptUser(profile.id)}>
                        <Icon name="ok-circle" />
                        {' '}
                        Accept
                      </button>
                      {' '}
                      <button type="button" className="btn btn-xs" onClick={() => rejectUser(profile.id)}>
                        <Icon name="remove-circle" />
                        {' '}
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-xs delete-profile"
                      disabled
                    >
                      <Icon name="remove-circle" />
                      {' '}
                      Delete
                    </button>
                  )}
                </span>
              </li>
            )
          })}
          {profiles.length === 0 && (
            <li><p className="empty-message">No profiles pending moderation.</p></li>
          )}
        </ul>
      ) : (
        <LoadSpinner inline />
      )}

      <PaginationLinks
        currentPage={pageNumber}
        itemsPerPage={15}
        totalCount={totalCount}
        setCurrentPage={setPageNumber}
      />

      <RejectionModal
        display={showRejectionModal}
        setDisplay={setShowRejectionModal}
        onModalClosed={() => getProfiles()}
        payload={{ accessToken, profileIdToReject }}
      />
    </div>
  )
}

const RejectionModal = ({
  display, setDisplay, onModalClosed, payload,
}) => {
  const [rejectionMessage, setRejectionMessage] = useState('')

  const cleanup = () => {
    setDisplay(false)
    setRejectionMessage('')
    if (typeof onModalClosed === 'function') {
      onModalClosed()
    }
  }

  const submitRejection = async () => {
    try {
      await api.post('/activate/moderate', {
        id: payload.profileIdToReject,
        activate: false,
        reason: rejectionMessage,
      }, { accessToken: payload.accessToken })
    } catch (error) {
      promptError(error.message)
    }
    cleanup()
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
                  <label htmlFor="message">Reason for rejecting {prettyId(payload.profileIdToReject)}:</label>
                  <textarea
                    name="message"
                    className="form-control"
                    rows="5"
                    value={rejectionMessage}
                    onChange={e => setRejectionMessage(e.target.value)}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal" onClick={cleanup}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={submitRejection} disabled={!rejectionMessage}>Submit</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade in" style={{ display: `${display ? 'block' : 'none'}` }} />
    </>
  )
}

export default withAdminAuth(Moderation)
