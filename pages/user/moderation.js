/* globals $: false */
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
import BasicModal from '../../components/BasicModal'

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
  const [totalCount, setTotalCount] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [filters, setFilters] = useState({})
  const [profileIdToReject, setProfileIdToReject] = useState(null)
  const modalId = `${onlyModeration ? 'new' : ''}-user-reject-modal`

  const getProfiles = async () => {
    const queryOptions = onlyModeration ? { needsModeration: true } : {}

    try {
      const result = await api.get('/profiles', {
        ...queryOptions,
        sort: 'tcdate:desc',
        limit: pageSize,
        offset: (pageNumber - 1) * pageSize,
        withBlocked: onlyModeration ? undefined : true,
        ...filters,
      }, { accessToken })
      setTotalCount(result.count ?? 0)
      setProfiles(result.profiles ?? [])
    } catch (error) {
      promptError(error.message)
    }
  }

  const filterProfiles = (e) => {
    e.preventDefault()
    const newFilters = [...e.target.elements].reduce((obj, elem) => {
      if (elem.name && elem.value) {
        // eslint-disable-next-line no-param-reassign
        obj[elem.name] = elem.value
      }
      return obj
    }, {})

    setPageNumber(1)
    setFilters(newFilters)
  }

  const acceptUser = async (profileId) => {
    try {
      await api.post('/profile/moderate', { id: profileId, decision: 'accept' }, { accessToken })
      reload()
      promptMessage(`${prettyId(profileId)} is now active`)
    } catch (error) {
      promptError(error.message)
    }
  }

  const showRejectionModal = (profileId) => {
    setProfileIdToReject(profileId)
    $(`#${modalId}`).modal('show')
  }

  const rejectUser = async (rejectionMessage) => {
    try {
      await api.post('/profile/moderate', {
        id: profileIdToReject,
        decision: 'reject',
        reason: rejectionMessage,
      }, { accessToken })
      $(`#${modalId}`).modal('hide')
      reload()
    } catch (error) {
      promptError(error.message)
    }
  }

  const blockUnblockUser = async (profile) => {
    const actionIsBlock = !profile?.block
    // eslint-disable-next-line no-alert
    const confirmResult = window.confirm(`Are you sure you want to ${actionIsBlock ? 'block' : 'unblock'} ${profile?.content?.names?.[0]?.first} ${profile?.content?.names?.[0]?.last}?`)
    if (confirmResult) {
      try {
        await api.post('/profile/moderate', { id: profile.id, decision: actionIsBlock ? 'block' : 'unblock' }, { accessToken })
      } catch (error) {
        promptError(error.message)
      }
      reload()
    }
  }

  useEffect(() => {
    getProfiles()
  }, [pageNumber, filters, shouldReload])

  return (
    <div className="profiles-list">
      {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
      <h4>{title} ({totalCount})</h4>

      {!onlyModeration && (
        <form className="filter-form well mt-3" onSubmit={filterProfiles}>
          <input type="text" name="first" className="form-control input-sm" placeholder="First Name" />
          <input type="text" name="middle" className="form-control input-sm" placeholder="Middle Name" />
          <input type="text" name="last" className="form-control input-sm" placeholder="Last Name" />
          <input type="text" name="id" className="form-control input-sm" placeholder="Username" />
          <button type="submit" className="btn btn-xs">Search</button>
        </form>
      )}

      {profiles ? (
        <ul className="list-unstyled list-paginated">
          {profiles.map((profile) => {
            const name = profile.content.names[0]
            return (
              <li key={profile.id} className={`${profile.block ? 'blocked' : null}`}>
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
                      <button type="button" className="btn btn-xs" onClick={() => showRejectionModal(profile.id)}>
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
                      <Icon name={`${profile.block ? 'refresh' : 'ban-circle'}`} />
                      {' '}
                      {`${profile.block ? 'Unblock' : 'Block'}`}
                    </button>
                  )}
                </span>
              </li>
            )
          })}
          {profiles.length === 0 && (
            <li><p className="empty-message">{`${onlyModeration ? 'No profiles pending moderation.' : 'No matching profile found'}`}</p></li>
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
        id={modalId}
        profileIdToReject={profileIdToReject}
        rejectUser={rejectUser}
      />
    </div>
  )
}

const RejectionModal = ({ id, profileIdToReject, rejectUser }) => {
  const [rejectionMessage, setRejectionMessage] = useState('')

  const instructionText = 'Please go back to the sign up page, enter the same name and email, click the Resend Activation button and complete the missing data.'
  const rejectionReasons = [
    { value: 'invalidHomepageAndEmail', label: 'Invalid Homepage + Missing Institution Email', rejectionText: `A valid Homepage and institutional email is required.\n\n${instructionText}` },
    { value: 'invalidEmail', label: 'Missing Institution Email', rejectionText: `An Institution email is required.\n\n${instructionText}` },
    { value: 'invalidHomepage', label: 'Invalid Homepage', rejectionText: `A valid Homepage is required.\n\n${instructionText}` },
    { value: 'invalidName', label: 'Invalid Name', rejectionText: `A valid name is required.\n\n${instructionText}` },
    { value: 'invalidHistory', label: 'Missing Latest Career/Education history', rejectionText: `Latest Career/Education history is missing. The info is used for conflict of interest detection.\n\n${instructionText}` },
  ]

  return (
    <BasicModal
      id={id}
      primaryButtonDisabled={!rejectionMessage}
      onPrimaryButtonClick={() => { rejectUser(rejectionMessage) }}
      onClose={() => { setRejectionMessage('') }}
    >
      <form onSubmit={(e) => { e.preventDefault() }}>
        <div className="form-group form-rejection">
          <label htmlFor="message" className="mb-1">
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            Reason for rejecting {prettyId(profileIdToReject)}:
          </label>
          <Dropdown
            name="rejection-reason"
            instanceId="rejection-reason"
            placeholder="Choose a common reject reason..."
            options={rejectionReasons}
            onChange={(p) => { setRejectionMessage(p.rejectionText) }}
          />
          <textarea
            name="message"
            className="form-control mt-2"
            rows="5"
            value={rejectionMessage}
            onChange={(e) => { setRejectionMessage(e.target.value) }}
          />
        </div>
      </form>
    </BasicModal>
  )
}

export default withAdminAuth(Moderation)
