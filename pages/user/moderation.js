/* globals promptError: false */
/* globals promptMessage: false */

import { useEffect, useState, useReducer } from 'react'
import Head from 'next/head'
import withAdminAuth from '../../components/withAdminAuth'
import Icon from '../../components/Icon'
import LoadSpinner from '../../components/LoadingSpinner'
import PaginationLinks from '../../components/PaginationLinks'
import api from '../../lib/api-client'
import { prettyId, formatDateTime } from '../../lib/utils'
import '../../styles/pages/moderation.less'

const Moderation = ({ appContext, accessToken }) => {
  const { setBannerHidden } = appContext
  const [shouldReload, reload] = useReducer(p => !p, true)

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
        <UserModerationQueue accessToken={accessToken} title="Recently Created Profiles" onlyModeration={false} reload={reload} shouldReload={shouldReload} />

        <UserModerationQueue accessToken={accessToken} title="New Profiles Pending Moderation" reload={reload} shouldReload={shouldReload} />
      </div>
    </>
  )
}

const UserModerationQueue = ({
  accessToken, title, onlyModeration = true, pageSize = 15, reload, shouldReload,
}) => {
  const [profiles, setProfiles] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showBlockConfirmationModal, setShowBlockConfirmationModal] = useState(false)
  const [profileIdToReject, setProfileIdToReject] = useState(null)
  const [profileToBlockUnblock, setProfileToBlockUnblock] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  const getProfiles = async () => {
    const queryOptions = onlyModeration ? { needsModeration: true } : {}

    try {
      const result = await api.get('/profiles', {
        ...queryOptions,
        sort: 'tcdate:desc',
        limit: pageSize,
        offset: (pageNumber - 1) * pageSize,
        trash: !onlyModeration,
      }, { accessToken })
      setTotalCount(result.count ?? 0)
      setProfiles(result.profiles ?? [])
    } catch (error) {
      promptError(error.message)
    }
  }

  const acceptUser = async (profileId) => {
    try {
      await api.post('/profile/moderate', { id: profileId, activate: true }, { accessToken })
      reload()
      promptMessage(`${prettyId(profileId)} is now active`)
    } catch (error) {
      promptError(error.message)
    }
  }

  const rejectUser = async (profileId) => {
    setProfileIdToReject(profileId)
    setShowRejectionModal(true)
  }

  const blockUnblockUser = async (profile) => {
    setProfileToBlockUnblock(profile)
    setShowBlockConfirmationModal(true)
  }

  useEffect(() => {
    getProfiles()
  }, [pageNumber, shouldReload])

  return (
    <div className="profiles-list">
      {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
      <h4>{title} ({totalCount})</h4>

      {profiles ? (
        <ul className="list-unstyled list-paginated">
          {profiles.map((profile) => {
            const name = profile.content.names[0]
            return (
              <li key={profile.id} className={`${profile.ddate ? 'blocked' : null}`}>
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
                      {' '}
                      <button type="button" className="btn btn-xs block-profile" onClick={() => blockUnblockUser(profile)}>
                        <Icon name="ban-circle" />
                        {'   '}
                        Block
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-xs block-profile"
                      onClick={() => blockUnblockUser(profile)}
                    >
                      <Icon name={`${profile.ddate ? 'refresh' : 'ban-circle'}`} />
                      {' '}
                      {`${profile.ddate ? 'Unblock' : 'Block'}`}
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
        onModalClosed={reload}
        payload={{ accessToken, profileIdToReject }}
      />

      <BlockConfirmationModal
        display={showBlockConfirmationModal}
        setDisplay={setShowBlockConfirmationModal}
        onModalClosed={reload}
        payload={{ accessToken, profileToBlockUnblock }}
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
      await api.post('/profile/moderate', {
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

const BlockConfirmationModal = ({
  display, setDisplay, onModalClosed, payload,
}) => {
  const actionIsBlock = !payload.profileToBlockUnblock?.ddate

  const cleanup = () => {
    setDisplay(false)
    if (typeof onModalClosed === 'function') {
      onModalClosed()
    }
  }

  const blockUnblockUser = async (profileId) => {
    try {
      await api.post('/profile/moderate', { id: payload.profileToBlockUnblock.id, block: actionIsBlock }, { accessToken: payload.accessToken })
    } catch (error) {
      promptError(error.message)
    } finally {
      cleanup()
    }
  }

  return (
    <>
      <div className="modal" tabIndex={-1} role="dialog" style={{ display: `${display ? 'block' : 'none'}` }}>
        <div className="modal-dialog">
          <div className="modal-content">

            <div className="modal-body">
              {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
              {`${payload.profileToBlockUnblock?.content?.names?.[0]?.first} ${payload.profileToBlockUnblock?.content?.names?.[0]?.last} will be ${actionIsBlock ? 'blocked' : 'unblocked'}`}, confirm?
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal" onClick={cleanup}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={blockUnblockUser}>{`${actionIsBlock ? 'Block' : 'Unblock'}`}</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade in" style={{ display: `${display ? 'block' : 'none'}` }} />
    </>
  )
}

export default withAdminAuth(Moderation)
