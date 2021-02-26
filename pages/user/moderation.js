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
import Dropdown from '../../components/Dropdown'

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
      await api.post('/profile/moderate', { id: profileId, status: 'accept' }, { accessToken })
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
    const actionIsBlock = !profile?.ddate
    // eslint-disable-next-line no-alert
    const confirmResult = window.confirm(`Are you sure you want to ${actionIsBlock ? 'block' : 'unblock'} ${profile?.content?.names?.[0]?.first} ${profile?.content?.names?.[0]?.last}?`)
    if (confirmResult) {
      try {
        await api.post('/profile/moderate', { id: profile.id, status: actionIsBlock ? 'block' : 'unblock' }, { accessToken })
      } catch (error) {
        promptError(error.message)
      }
      reload()
    }
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
                      <button type="button" className="btn btn-xs btn-block-profile" onClick={() => blockUnblockUser(profile)}>
                        <Icon name="ban-circle" />
                        {'   '}
                        Block
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-xs btn-block-profile"
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
    </div>
  )
}

const RejectionModal = ({
  display, setDisplay, onModalClosed, payload,
}) => {
  const [rejectionMessage, setRejectionMessage] = useState('')
  const [selectedRejectionReason, setSelectedRejectionReason] = useState(null)

  const instructionText = 'Please go back to the sign up page, enter the same name and email, click the Resend Activation button and complete the missing data.'
  const rejectionReasons = [
    { value: 'invalidHomepageAndEmail', label: 'Invalid Homepage + Missing Institution Email', rejectionText: `A valid Homepage and institutional email is required.\n\n${instructionText}` },
    { value: 'invalidEmail', label: 'Missing Institution Email', rejectionText: `An Institution email is required.\n\n${instructionText}` },
    { value: 'invalidHomepage', label: 'Invalid Homepage', rejectionText: `A valid Homepage is required.\n\n${instructionText}` },
    { value: 'invalidName', label: 'Invalid Name', rejectionText: `A valid name is required.\n\n${instructionText}` },
    { value: 'invalidHistory', label: 'Missing Latest Career/Education history', rejectionText: `Latest Career/Education history is missing. The info is used for conflict of interest detection.\n\n${instructionText}` },
  ]

  const cleanup = () => {
    setDisplay(false)
    setRejectionMessage('')
    setSelectedRejectionReason(null)
    if (typeof onModalClosed === 'function') {
      onModalClosed()
    }
  }

  const submitRejection = async () => {
    try {
      await api.post('/profile/moderate', {
        id: payload.profileIdToReject,
        status: 'reject',
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
                <div className="form-group form-rejection">
                  {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                  <label htmlFor="message">Reason for rejecting {prettyId(payload.profileIdToReject)}:</label>
                  <Dropdown
                    name="rejection-reason"
                    instanceId="rejection-reason"
                    placeholder="Choose a common reject reason..."
                    options={rejectionReasons}
                    value={selectedRejectionReason}
                    onChange={(p) => { setRejectionMessage(p.rejectionText); setSelectedRejectionReason(p) }}
                  />
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
