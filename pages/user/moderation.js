/* globals $: false */
/* globals promptError: false */
/* globals promptMessage: false */

import { useEffect, useState, useReducer, useRef } from 'react'
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
  const [shouldReload, reload] = useReducer((p) => !p, true)
  const [configNote, setConfigNote] = useState(null)

  const moderationDisabled = configNote?.content?.moderate === 'No'

  const getModerationStatus = async () => {
    try {
      const { notes } = await api.get('/notes', {
        invitation: 'OpenReview.net/Support/-/OpenReview_Config',
        limit: 1,
      })
      if (notes?.length > 0) {
        setConfigNote(notes[0])
      } else {
        promptError('Moderation config could not be loaded')
      }
    } catch (error) {
      promptError(error.message)
    }
  }

  const enableDisableModeration = async () => {
    // eslint-disable-next-line no-alert
    const result = window.confirm(`${moderationDisabled ? 'Enable' : 'Disable'} moderation?`)
    if (!result) return

    try {
      await api.post(
        '/notes',
        {
          ...configNote,
          content: { ...configNote.content, moderate: moderationDisabled ? 'Yes' : 'No' },
        },
        { accessToken }
      )
      getModerationStatus()
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    setBannerHidden(true)
    getModerationStatus()
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

      {configNote && (
        <div className="moderation-status">
          <h4>Moderation Status:</h4>

          <select
            className="form-control input-sm"
            value={moderationDisabled ? 'disabled' : 'enabled'}
            onChange={enableDisableModeration}
          >
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      )}

      <div className="moderation-container">
        <UserModerationQueue
          accessToken={accessToken}
          title="Recently Created Profiles"
          onlyModeration={false}
          reload={reload}
          shouldReload={shouldReload}
        />

        <UserModerationQueue
          accessToken={accessToken}
          title="New Profiles Pending Moderation"
          reload={reload}
          shouldReload={shouldReload}
          showSortButton
        />
      </div>
    </>
  )
}

const UserModerationQueue = ({
  accessToken,
  title,
  onlyModeration = true,
  pageSize = 15,
  reload,
  shouldReload,
  showSortButton = false,
}) => {
  const [profiles, setProfiles] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [filters, setFilters] = useState({})
  const [profileIdToReject, setProfileIdToReject] = useState(null)
  const [idsLoading, setIdsLoading] = useState([])
  const [descOrder, setDescOrder] = useState(true)
  const modalId = `${onlyModeration ? 'new' : ''}-user-reject-modal`

  const getProfiles = async () => {
    const queryOptions = onlyModeration ? { needsModeration: true } : {}

    try {
      const result = await api.get(
        '/profiles',
        {
          ...queryOptions,
          sort: `tcdate:${descOrder ? 'desc' : 'asc'}`,
          limit: pageSize,
          offset: (pageNumber - 1) * pageSize,
          withBlocked: onlyModeration ? undefined : true,
          ...filters,
        },
        { accessToken, cachePolicy: 'no-cache' }
      )
      setTotalCount(result.count ?? 0)
      setProfiles(result.profiles ?? [])
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
  }

  const filterProfiles = (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    const newFilters = {}
    formData.forEach((value, name) => {
      if (name === 'id' && value.includes('@')) {
        newFilters.email = value.trim()
      } else {
        newFilters[name] = value.trim()
      }
    })

    setPageNumber(1)
    setFilters(newFilters)
  }

  const acceptUser = async (profileId) => {
    try {
      setIdsLoading((p) => [...p, profileId])
      await api.post(
        '/profile/moderate',
        { id: profileId, decision: 'accept' },
        { accessToken }
      )
      reload()
      promptMessage(`${prettyId(profileId)} is now active`, { scrollToTop: false })
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
      setIdsLoading((p) => p.filter((q) => q !== profileId))
    }
  }

  const showRejectionModal = (profileId) => {
    setProfileIdToReject(profileId)
    $(`#${modalId}`).modal('show')
  }

  const rejectUser = async (rejectionMessage) => {
    try {
      await api.post(
        '/profile/moderate',
        {
          id: profileIdToReject,
          decision: 'reject',
          reason: rejectionMessage,
        },
        { accessToken }
      )
      $(`#${modalId}`).modal('hide')
      reload()
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
  }

  const blockUnblockUser = async (profile) => {
    const actionIsBlock = !profile?.block
    // eslint-disable-next-line no-alert
    const confirmResult = window.confirm(
      `Are you sure you want to ${actionIsBlock ? 'block' : 'unblock'} ${
        profile?.content?.names?.[0]?.first
      } ${profile?.content?.names?.[0]?.last}?`
    )
    if (confirmResult) {
      try {
        await api.post(
          '/profile/moderate',
          { id: profile.id, decision: actionIsBlock ? 'block' : 'unblock' },
          { accessToken }
        )
      } catch (error) {
        promptError(error.message, { scrollToTop: false })
      }
      reload()
    }
  }

  useEffect(() => {
    getProfiles()
  }, [pageNumber, filters, shouldReload, descOrder])

  return (
    <div className="profiles-list">
      <h4>
        {title} ({totalCount})
      </h4>
      {showSortButton && profiles && profiles.length !== 0 && (
        <button className="btn btn-xs sort-button" onClick={() => setDescOrder((p) => !p)}>{`${
          descOrder ? 'Sort: Newest First' : 'Sort: Oldest First'
        }`}</button>
      )}

      {!onlyModeration && (
        <form className="filter-form well mt-3" onSubmit={filterProfiles}>
          <input
            type="text"
            name="first"
            className="form-control input-sm"
            placeholder="First Name"
          />
          <input
            type="text"
            name="middle"
            className="form-control input-sm"
            placeholder="Middle Name"
          />
          <input
            type="text"
            name="last"
            className="form-control input-sm"
            placeholder="Last Name"
          />
          <input
            type="text"
            name="id"
            className="form-control input-sm"
            placeholder="Username or Email"
          />
          <button type="submit" className="btn btn-xs">
            Search
          </button>
        </form>
      )}

      {profiles ? (
        <ul className="list-unstyled list-paginated">
          {profiles.map((profile) => {
            const name = profile.content.names[0]
            return (
              <li key={profile.id} className={`${profile.block ? 'blocked' : null}`}>
                <span className="col-name">
                  <a
                    href={`/profile?id=${profile.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title={profile.id}
                  >
                    {name.first} {name.middle} {name.last}
                  </a>
                </span>
                <span className="col-email text-muted">{profile.content.preferredEmail}</span>
                <span className="col-created">{formatDateTime(profile.tcdate)}</span>
                <span className="col-status">
                  <span className={`label label-${profile.password ? 'success' : 'danger'}`}>
                    password
                  </span>{' '}
                  <span className={`label label-${profile.active ? 'success' : 'danger'}`}>
                    active
                  </span>
                </span>
                <span className="col-actions">
                  {onlyModeration ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-xs"
                        disabled={idsLoading.includes(profile.id)}
                        onClick={() => acceptUser(profile.id)}
                      >
                        <Icon name="ok-circle" /> Accept
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-xs"
                        onClick={() => showRejectionModal(profile.id)}
                      >
                        <Icon name="remove-circle" /> Reject
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-xs btn-block-profile"
                        onClick={() => blockUnblockUser(profile)}
                      >
                        <Icon name="ban-circle" />
                        {'   '}
                        Block
                      </button>
                    </>
                  ) : (
                    <>
                      {!profile.block && profile.active && (
                        <button
                          type="button"
                          className="btn btn-xs"
                          onClick={() => showRejectionModal(profile.id)}
                        >
                          <Icon name="remove-circle" /> Reject
                        </button>
                      )}{' '}
                      <button
                        type="button"
                        className="btn btn-xs btn-block-profile"
                        onClick={() => blockUnblockUser(profile)}
                      >
                        <Icon name={`${profile.block ? 'refresh' : 'ban-circle'}`} />{' '}
                        {`${profile.block ? 'Unblock' : 'Block'}`}
                      </button>
                    </>
                  )}
                </span>
              </li>
            )
          })}
          {profiles.length === 0 && (
            <li>
              <p className="empty-message">{`${
                onlyModeration
                  ? 'No profiles pending moderation.'
                  : 'No matching profile found'
              }`}</p>
            </li>
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
  const selectRef = useRef(null)

  const instructionText =
    'Please go back to the sign up page, enter the same name and email, click the Resend Activation button and complete the missing data.'
  const rejectionReasons = [
    {
      value: 'inaccessibleHomepage',
      label: 'Inaccessible Homepage',
      rejectionText: `A valid Homepage is required. The homepage url provided in your profile is not accessible.\n\n${instructionText}`,
    },
    {
      value: 'imPersonalHomepage',
      label: 'Impersonal Homepage',
      rejectionText: `The homepage url provided in your profile doesn't display your name so your identity can't be determined.\n\n${instructionText}`,
    },
    {
      value: 'invalidHomepageAndEmail',
      label: 'Invalid Homepage + Missing Institution Email',
      rejectionText: `A valid Homepage and institutional email matching your latest career/education history is required.\n\n${instructionText}`,
    },
    {
      value: 'invalidName',
      label: 'Invalid Name',
      rejectionText: `A valid name is required, and must match the one listed on your provided personal homepages.\n\n${instructionText}`,
    },
    {
      value: 'invalidEmail',
      label: 'Missing Institution Email',
      rejectionText: `An Institution email is required.\n\n${instructionText}`,
    },
  ]

  return (
    <BasicModal
      id={id}
      primaryButtonDisabled={!rejectionMessage}
      onPrimaryButtonClick={() => {
        rejectUser(rejectionMessage)
      }}
      onClose={() => {
        selectRef.current.clearValue()
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
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
            onChange={(p) => {
              setRejectionMessage(p?.rejectionText || '')
            }}
            selectRef={selectRef}
            isClearable
          />
          <textarea
            name="message"
            className="form-control mt-2"
            rows="5"
            value={rejectionMessage}
            onChange={(e) => {
              setRejectionMessage(e.target.value)
            }}
          />
        </div>
      </form>
    </BasicModal>
  )
}

export default withAdminAuth(Moderation)
