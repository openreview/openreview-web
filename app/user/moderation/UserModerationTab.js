/* globals promptMessage,promptError,view2,$: false */
import { useEffect, useReducer, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { cloneDeep, uniqBy } from 'lodash'
import api from '../../../lib/api-client'
import {
  formatDateTime,
  getProfileStateLabelClass,
  inflect,
  prettyId,
} from '../../../lib/utils'
import Dropdown from '../../../components/Dropdown'
import { formatProfileData } from '../../../lib/profiles'
import Icon from '../../../components/Icon'
import LoadingSpinner from '../../../components/LoadingSpinner'
import PaginationLinks from '../../../components/PaginationLinks'
import BasicModal from '../../../components/BasicModal'
import ProfilePreviewModal from '../../../components/profile/ProfilePreviewModal'

export const RejectionModal = ({ id, profileToReject, rejectUser, signedNotes }) => {
  const [rejectionMessage, setRejectionMessage] = useState('')
  const selectRef = useRef(null)

  const currentInstitutionName = profileToReject?.content?.history?.find(
    (p) => !p.end || p.end >= new Date().getFullYear()
  )?.institution?.name

  const instructionText =
    'Please go back to the sign up page, enter the same name and email, click the Resend Activation button and follow the activation link to update your information.'
  const rejectionReasons = [
    {
      value: 'requestEmailVerification',
      label: 'Institutional Email is missing',
      rejectionText: `Please add and confirm an institutional email ${
        currentInstitutionName ? `issued by ${currentInstitutionName} ` : ''
      }to your profile. Please make sure the verification token is entered and verified.\n\nIf your affiliation ${
        currentInstitutionName ? `issued by ${currentInstitutionName} ` : ''
      } is not current, please update your profile with your current affiliation and associated institutional email.\n\n${instructionText}`,
    },
    {
      value: 'requestEmailConfirmation',
      label: 'Institutional Email is added but not confirmed',
      rejectionText: `Please confirm the institutional email in your profile by clicking the "Confirm" button next to the email and enter the verification token received.\n\n${instructionText}`,
    },
    {
      value: 'invalidDBLP',
      label: 'DBLP link is a disambiguation page',
      rejectionText: `The DBLP link you have provided is a disambiguation page and is not intended to be used as a bibliography. Please select the correct bibliography page listed under "Other persons with a similar name". If your page is not listed please contact the DBLP team so they can add your bibliography page. We recommend providing a different bibliography homepage when resubmitting to OpenReview moderation.\n\n${instructionText}`,
    },
    {
      value: 'imPersonalHomepage',
      label: 'Homepage is invalid',
      rejectionText: `The homepage url provided in your profile is invalid or does not display your name/email used to register so your identity can't be determined.\n\n${instructionText}`,
    },
    {
      value: 'imPersonalHomepageAndEmail',
      label: 'Homepage is invalid + no institution email',
      rejectionText: `A Homepage url which displays your name and institutional email matching your latest career/education history are required. Please confirm the institutional email by entering the verification token received after clicking confirm button next to the institutional email.\n\n${instructionText}`,
    },
    {
      value: 'invalidName',
      label: 'Profile name is invalid',
      rejectionText: `The name in your profile does not match the name listed in your homepage or is invalid.\n\n${instructionText}`,
    },
    {
      value: 'invalidORCID',
      label: 'ORCID profile is incomplete',
      rejectionText: `The ORCID profile you've provided as a homepage is empty or does not match the Career & Education history you've provided.\n\n${instructionText}`,
    },
    {
      value: 'lastNotice',
      label: 'Last notice before block',
      rejectionText: `If invalid info is submitted again, your email will be blocked.\n\n${instructionText}`,
    },
  ]

  const updateMessageForPastRejectProfile = (messageToAdd) => {
    setRejectionMessage((p) => `${messageToAdd}\n\n${p}`)
  }

  return (
    <BasicModal
      id={id}
      primaryButtonDisabled={!rejectionMessage}
      onPrimaryButtonClick={() => {
        rejectUser(rejectionMessage, profileToReject.id)
      }}
      onClose={() => {
        selectRef.current.clearValue()
      }}
    >
      <>
        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="form-group form-rejection">
            <label htmlFor="message" className="mb-1">
              Reason for rejecting {prettyId(profileToReject?.id)}:
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

            <div>
              <button
                className="btn btn-xs mr-2"
                onClick={() =>
                  updateMessageForPastRejectProfile(
                    "Submitting invalid info is a violation of OpenReview's Terms and Conditions (https://openreview.net/legal/terms) which may result in terminating your access to the system."
                  )
                }
              >
                Add Invalid Info Warning
              </button>
              <button
                className="btn btn-xs"
                onClick={() =>
                  updateMessageForPastRejectProfile(
                    'If invalid info is submitted again, your email will be blocked.'
                  )
                }
              >
                Add Last Notice Warning
              </button>
            </div>

            <textarea
              name="message"
              className="form-control mt-2"
              rows="10"
              value={rejectionMessage}
              onChange={(e) => {
                setRejectionMessage(e.target.value)
              }}
            />
          </div>
        </form>
        {signedNotes.length > 0 && (
          <>
            <h4>{`There ${inflect(signedNotes.length, 'is', 'are', false)} ${inflect(
              signedNotes.length,
              'note',
              'notes',
              true
            )} signed by this profile.`}</h4>
            {signedNotes.slice(0, 10).map((p) => (
              <div key={p.id}>
                <a
                  href={`${
                    p.apiVersion === 2 ? process.env.API_V2_URL : process.env.API_URL
                  }/notes?id=${p.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.id}
                </a>
              </div>
            ))}
          </>
        )}
      </>
    </BasicModal>
  )
}

const BlockModal = ({ id, profileToBlockUnblock, signedNotes, reload, accessToken }) => {
  const [blockTag, setBlockTag] = useState('')
  const actionIsBlock = profileToBlockUnblock?.state !== 'Blocked'

  const blockUnblockUser = async (profile) => {
    if (!profile) return

    try {
      await api.post('/tags', {
        profile: profileToBlockUnblock.id,
        label: blockTag.trim(),
        signature: `${process.env.SUPER_USER}/Support`,
        invitation: `${process.env.SUPER_USER}/Support/-/Profile_Blocked_Status`,
        readers: [`${process.env.SUPER_USER}/Support`],
      })

      await api.post(
        '/profile/moderate',
        { id: profile.id, decision: actionIsBlock ? 'block' : 'unblock' },
        { accessToken }
      )
      setBlockTag('')
      $(`#${id}`).modal('hide')
    } catch (error) {
      promptError(error.message)
    }
    reload()
  }

  useEffect(() => {}, [profileToBlockUnblock])

  return (
    <BasicModal
      id={id}
      primaryButtonText={`${profileToBlockUnblock?.state === 'Blocked' ? 'Unblock' : 'Block'}`}
      onPrimaryButtonClick={() => {
        blockUnblockUser(profileToBlockUnblock)
      }}
      primaryButtonDisabled={!blockTag.trim()}
    >
      <>
        <h4>{`You are about to ${actionIsBlock ? 'block' : 'unblock'} ${
          profileToBlockUnblock?.content?.names?.[0]?.fullname
        }.`}</h4>
        <div>
          <input
            id="tag-input"
            type="text"
            className="form-control mb-2"
            value={blockTag}
            placeholder="a tag to be added to this profile such as block/unblock reason"
            onChange={(e) => setBlockTag(e.target.value)}
          />
        </div>
        {actionIsBlock && signedNotes.length > 0 && (
          <>
            <h4>{`There ${inflect(signedNotes.length, 'is', 'are', false)} ${inflect(
              signedNotes.length,
              'note',
              'notes',
              true
            )} signed by this profile.`}</h4>
            {signedNotes.slice(0, 10).map((p) => (
              <div key={p.id}>
                <a
                  href={`${
                    p.apiVersion === 2 ? process.env.API_V2_URL : process.env.API_URL
                  }/notes?id=${p.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.id}
                </a>
              </div>
            ))}
          </>
        )}
      </>
    </BasicModal>
  )
}

const UserModerationQueue = ({
  accessToken,
  title,
  onlyModeration = true,
  reload,
  shouldReload,
  showSortButton = false,
}) => {
  const [profiles, setProfiles] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [filters, setFilters] = useState({})
  const [profileToReject, setProfileToReject] = useState(null)
  const [profileToBlockUnblock, setProfileToBlockUnblock] = useState(null)
  const [signedNotes, setSignedNotes] = useState(0)
  const [idsLoading, setIdsLoading] = useState([])
  const [descOrder, setDescOrder] = useState(true)
  const [pageSize, setPageSize] = useState(onlyModeration ? 200 : 15)
  const [profileToPreview, setProfileToPreview] = useState(null)
  const [lastPreviewedProfileId, setLastPreviewedProfileId] = useState(null)
  const rejectModalId = `${onlyModeration ? 'new' : ''}-user-reject-modal`
  const blockModalId = `${onlyModeration ? 'new' : ''}-user-block-modal`
  const pageSizeOptions = [15, 30, 50, 100, 200].map((p) => ({
    label: `${p} items`,
    value: p,
  }))
  const [profileStateOption, setProfileStateOption] = useState('All')
  const profileStateOptions = [
    'All',
    'Active Automatic',
    'Blocked',
    'Rejected',
    'Limited',
    'Inactive',
    'Merged',
    'Needs Moderation',
  ].map((p) => ({ label: p, value: p }))
  const twoWeeksAgo = dayjs().subtract(2, 'week').valueOf()

  const getProfiles = async () => {
    const queryOptions = onlyModeration ? { needsModeration: true } : {}
    const cleanSearchTerm = filters.term?.trim()
    const shouldSearchProfile = profileStateOption === 'All' && cleanSearchTerm
    const sortKey = onlyModeration ? 'tmdate' : 'tcdate'
    let searchQuery = { fullname: cleanSearchTerm?.toLowerCase() }
    if (cleanSearchTerm?.startsWith('~')) searchQuery = { id: cleanSearchTerm }
    if (cleanSearchTerm?.includes('@')) searchQuery = { email: cleanSearchTerm.toLowerCase() }

    try {
      const result = await api.get(
        shouldSearchProfile ? '/profiles/search' : '/profiles',
        {
          ...queryOptions,

          ...(!shouldSearchProfile && { sort: `${sortKey}:${descOrder ? 'desc' : 'asc'}` }),
          limit: pageSize,
          offset: (pageNumber - 1) * pageSize,
          withBlocked: onlyModeration ? undefined : true,
          ...(!onlyModeration && { trash: true }),
          ...(shouldSearchProfile && { es: true }),
          ...(shouldSearchProfile && searchQuery),
          ...(profileStateOption !== 'All' && { state: profileStateOption }),
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
    if (profileStateOption !== 'All') setProfileStateOption('All')
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
      if (profiles.length === 1 && pageNumber !== 1) {
        setPageNumber((p) => p - 1)
      }
      reload()
      promptMessage(`${prettyId(profileId)} is now active`, { scrollToTop: false })
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
      setIdsLoading((p) => p.filter((q) => q !== profileId))
    }
  }

  const getSignedAuthoredNotesCount = async (profileId) => {
    const signedNotesP = api.getCombined(
      '/notes',
      { signature: profileId, select: 'id' },
      null,
      {
        accessToken,
        includeVersion: true,
      }
    )
    const authoredNotesP = api.getCombined(
      '/notes',
      { 'content.authorids': profileId, select: 'id' },
      null,
      { accessToken, includeVersion: true }
    )

    const [signedNotesResult, authoredNotesResult] = await Promise.all([
      signedNotesP,
      authoredNotesP,
    ])

    return uniqBy([...signedNotesResult.notes, ...authoredNotesResult.notes], 'id')
  }

  const showRejectionModal = async (profile) => {
    if (!onlyModeration) {
      const signedAuthoredNotes = await getSignedAuthoredNotesCount(profile.id)
      setSignedNotes(signedAuthoredNotes)
    }
    setProfileToReject(profile)

    $(`#${rejectModalId}`).modal('show')
  }

  const showBlockUnblockModal = async (profile) => {
    const signedAuthoredNotes = await getSignedAuthoredNotesCount(profile.id)
    setSignedNotes(signedAuthoredNotes)
    setProfileToBlockUnblock(profile)
    $(`#${blockModalId}`).modal('show')
  }

  const rejectUser = async (rejectionMessage, id) => {
    try {
      await api.post(
        '/profile/moderate',
        {
          id,
          decision: 'reject',
          reason: rejectionMessage,
        },
        { accessToken }
      )
      $(`#${rejectModalId}`).modal('hide')
      if (profiles.length === 1 && pageNumber !== 1) {
        setPageNumber((p) => p - 1)
      }
      reload()
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
  }

  const deleteRestoreUser = async (profile) => {
    if (!profile) return

    const actionIsDelete = !profile.ddate

    const signedAuthoredNotesCount = actionIsDelete
      ? (await getSignedAuthoredNotesCount(profile.id)).length
      : 0

    const noteCountMessage =
      actionIsDelete && signedAuthoredNotesCount
        ? `There ${inflect(signedAuthoredNotesCount, 'is', 'are', false)} ${inflect(
            signedAuthoredNotesCount,
            'note',
            'notes',
            true
          )} signed by this profile.`
        : ''

    const actionLabel = actionIsDelete ? 'delete' : 'restore'
    const name = profile.content?.names?.[0]?.fullname ?? 'this profile'
    // eslint-disable-next-line no-alert
    const confirmResult = window.confirm(
      `Are you sure you want to ${actionLabel} ${name}?\n\n${noteCountMessage}`
    )
    if (confirmResult) {
      try {
        await api.post(
          '/profile/moderate',
          { id: profile.id, decision: actionIsDelete ? 'delete' : 'restore' },
          { accessToken }
        )
      } catch (error) {
        promptError(error.message, { scrollToTop: false })
      }
      reload()
    }
  }

  const addSDNException = async (profileId) => {
    const sdnExceptionGroupId = `${process.env.SUPER_USER}/Support/SDN_Profiles/Exceptions`
    try {
      const sdnExceptionGroup = await api.getGroupById(sdnExceptionGroupId, accessToken)
      await api.post(
        '/groups/edits',
        {
          group: {
            id: `${process.env.SUPER_USER}/Support/SDN_Profiles/Exceptions`,
            members: {
              append: [profileId],
            },
          },
          readers: sdnExceptionGroup.signatures,
          writers: sdnExceptionGroup.signatures,
          signatures: sdnExceptionGroup.signatures,
          invitation: sdnExceptionGroup.invitations?.[0],
        },
        { accessToken }
      )
      promptMessage(`${profileId} is added to SDN exception group`)
    } catch (error) {
      promptError(error.message)
    }
  }

  const showNextProfile = (currentProfileId) => {
    const nextProfile = profiles[profiles.findIndex((p) => p.id === currentProfileId) + 1]
    if (nextProfile) {
      setProfileToPreview(formatProfileData(cloneDeep(nextProfile)))
      setLastPreviewedProfileId(nextProfile.id)
    }
  }

  useEffect(() => {
    getProfiles()
  }, [pageNumber, filters, shouldReload, descOrder, pageSize, profileStateOption])

  useEffect(() => {
    if (profileToPreview) $('#profile-preview').modal('show')
  }, [profileToPreview])

  return (
    <div className="profiles-list">
      <h4>
        {title} ({totalCount})
      </h4>
      {showSortButton && profiles && profiles.length !== 0 && (
        <button className="btn btn-xs sort-button" onClick={() => setDescOrder((p) => !p)}>{`${
          descOrder ? 'Sort: Most Recently Modified' : 'Sort: Least Recently Modified'
        }`}</button>
      )}

      {!onlyModeration && (
        <form className="filter-form well mt-3" onSubmit={filterProfiles}>
          <input type="text" name="term" className="form-control input-sm" />
          <Dropdown
            className="dropdown-select dropdown-profile-state dropdown-sm"
            options={profileStateOptions}
            placeholder="Select profile state"
            value={profileStateOptions.find((option) => option.value === profileStateOption)}
            onChange={(e) => {
              setPageNumber(1)
              setProfileStateOption(e.value)
            }}
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
            const state =
              profile.ddate && profile.state !== 'Merged' ? 'Deleted' : profile.state
            return (
              <li
                key={profile.id}
                className={`${profile.state === 'Blocked' ? 'blocked' : ''}${
                  profile.ddate ? ' deleted' : ''
                }`}
              >
                <span className="col-name">
                  <a
                    href={`/profile?id=${profile.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title={profile.id}
                  >
                    {name.fullname}
                  </a>
                </span>
                <span className="col-email text-muted">{profile.content.preferredEmail}</span>
                <span className="col-created">
                  {profile.tcdate !== profile.tmdate && (
                    <>
                      <span>
                        {formatDateTime(profile.tcdate, {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: undefined,
                          timeZoneName: undefined,
                          hour12: false,
                        })}
                      </span>
                      {' / '}
                    </>
                  )}
                  <span
                    className={`${
                      onlyModeration && profile.tmdate < twoWeeksAgo ? 'passed-moderation' : ''
                    }`}
                  >
                    {formatDateTime(profile.tmdate, {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: undefined,
                      timeZoneName: undefined,
                      hour12: false,
                    })}
                  </span>
                </span>
                <span className="col-status">
                  <span className={`label label-${profile.password ? 'success' : 'danger'}`}>
                    password
                  </span>{' '}
                  <span
                    className={`${getProfileStateLabelClass(state)}${
                      profile.id === lastPreviewedProfileId ? ' last-previewed' : ''
                    }`}
                    onClick={() => {
                      setProfileToPreview(formatProfileData(cloneDeep(profile)))
                    }}
                  >
                    {state}
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
                        onClick={() => showRejectionModal(profile)}
                      >
                        <Icon name="remove-circle" /> Reject
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-xs btn-block-profile"
                        onClick={() => showBlockUnblockModal(profile)}
                      >
                        <Icon name="ban-circle" />
                        {'   '}
                        Block
                      </button>
                    </>
                  ) : (
                    <>
                      {(profile.state === 'Needs Moderation' ||
                        profile.state === 'Rejected') && (
                        <button
                          type="button"
                          className="btn btn-xs"
                          onClick={() => acceptUser(profile.id)}
                        >
                          <Icon name="ok-circle" /> Accept
                        </button>
                      )}{' '}
                      {!(
                        profile.state === 'Blocked' ||
                        profile.state === 'Limited' ||
                        profile.state === 'Rejected' ||
                        profile.ddate
                      ) && (
                        <button
                          type="button"
                          className="btn btn-xs"
                          onClick={() => showRejectionModal(profile)}
                        >
                          <Icon name="remove-circle" /> Reject
                        </button>
                      )}
                      {profile.state === 'Limited' && profile.content.yearOfBirth && (
                        <button
                          type="button"
                          className="btn btn-xs"
                          onClick={() => addSDNException(profile.id)}
                        >
                          <Icon name="plus" /> Exception
                        </button>
                      )}{' '}
                      {!profile.ddate && (
                        <button
                          type="button"
                          className="btn btn-xs btn-block-profile"
                          onClick={() => showBlockUnblockModal(profile)}
                        >
                          <Icon
                            name={`${profile.state === 'Blocked' ? 'refresh' : 'ban-circle'}`}
                          />{' '}
                          {`${profile.state === 'Blocked' ? 'Unblock' : 'Block'}`}
                        </button>
                      )}{' '}
                      {state !== 'Merged' && profile.state !== 'Needs Moderation' && (
                        <button
                          type="button"
                          className="btn btn-xs"
                          onClick={() => deleteRestoreUser(profile)}
                          title={
                            profile.ddate ? 'restore this profile' : 'delete this profile'
                          }
                        >
                          <Icon name={profile.ddate ? 'refresh' : 'trash'} />
                        </button>
                      )}
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
        <LoadingSpinner inline />
      )}
      <div className="pagination-container-with-control">
        <PaginationLinks
          currentPage={pageNumber}
          itemsPerPage={pageSize}
          totalCount={totalCount}
          setCurrentPage={setPageNumber}
          options={{ noScroll: true }}
        />
        {totalCount > pageSize && (
          <Dropdown
            className="dropdown-select dropdown-pagesize"
            options={pageSizeOptions}
            value={pageSizeOptions.find((p) => p.value === pageSize)}
            onChange={(e) => {
              setPageNumber(1)
              setPageSize(e.value)
            }}
          />
        )}
      </div>

      <RejectionModal
        id={rejectModalId}
        profileToReject={profileToReject}
        rejectUser={rejectUser}
        signedNotes={signedNotes}
      />
      <BlockModal
        id={blockModalId}
        profileToBlockUnblock={profileToBlockUnblock}
        signedNotes={signedNotes}
        reload={reload}
        accessToken={accessToken}
      />
      <ProfilePreviewModal
        profileToPreview={profileToPreview}
        setProfileToPreview={setProfileToPreview}
        setLastPreviewedProfileId={setLastPreviewedProfileId}
        contentToShow={[
          'names',
          'emails',
          'links',
          'history',
          'relations',
          'expertise',
          'publications',
          'messages',
          'tags',
        ]}
        showNextProfile={showNextProfile}
        acceptUser={acceptUser}
        setProfileToReject={setProfileToReject}
        rejectUser={rejectUser}
      />
    </div>
  )
}

export default function UserModerationTab({ accessToken }) {
  const [shouldReload, reload] = useReducer((p) => !p, true)
  const [configNote, setConfigNote] = useState(null)

  const moderationDisabled = configNote?.content?.moderate?.value === 'No'

  const getModerationStatus = async () => {
    try {
      const result = await api.get(
        '/notes',
        {
          invitation: `${process.env.SUPER_USER}/-/OpenReview_Config`,
          details: 'invitation',
          limit: 1,
        },
        { accessToken }
      )

      if (result?.notes?.[0]) {
        setConfigNote(result?.notes?.[0])
      } else {
        promptError('Moderation config could not be loaded')
      }
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    getModerationStatus()
  }, [])

  const enableDisableModeration = async () => {
    // eslint-disable-next-line no-alert
    const result = window.confirm(`${moderationDisabled ? 'Enable' : 'Disable'} moderation?`)
    if (!result) return

    try {
      await api.post(
        '/notes/edits',
        view2.constructEdit({
          formData: { moderate: moderationDisabled ? 'Yes' : 'No' },
          invitationObj: configNote.details.invitation,
          noteObj: configNote,
        }),
        { accessToken }
      )
      getModerationStatus()
    } catch (error) {
      promptError(error.message)
    }
  }

  const updateTermStamp = async () => {
    const currentTimeStamp = dayjs().valueOf()
    // eslint-disable-next-line no-alert
    const result = window.confirm(
      `Update terms of service timestamp to ${currentTimeStamp}? (${dayjs(
        currentTimeStamp
      ).toISOString()})`
    )
    if (!result) return

    try {
      await api.post(
        '/notes/edits',
        view2.constructEdit({
          formData: { terms_timestamp: currentTimeStamp },
          invitationObj: configNote.details.invitation,
          noteObj: configNote,
        }),
        { accessToken }
      )

      getModerationStatus()
    } catch (error) {
      promptError(error.message)
    }
  }

  return (
    <>
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

          <span className="terms-timestamp">
            {`Terms Timestamp is ${configNote?.content?.terms_timestamp?.value ?? 'unset'}`}
          </span>
          <button type="button" className="btn btn-xs" onClick={updateTermStamp}>
            Update Terms Stamp
          </button>
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
