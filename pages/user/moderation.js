/* globals $,promptError,promptMessage: false */

import { useEffect, useState, useReducer, useRef, useCallback } from 'react'
import Head from 'next/head'
import { cloneDeep, orderBy, sortBy } from 'lodash'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import withAdminAuth from '../../components/withAdminAuth'
import Icon from '../../components/Icon'
import LoadSpinner from '../../components/LoadingSpinner'
import PaginationLinks from '../../components/PaginationLinks'
import api from '../../lib/api-client'
import {
  prettyId,
  formatDateTime,
  buildArray,
  inflect,
  getProfileStateLabelClass,
  getTabCountMessage,
} from '../../lib/utils'
import BasicModal from '../../components/BasicModal'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../../components/Tabs'
import PaginatedList from '../../components/PaginatedList'
import Table from '../../components/Table'
import BasicProfileView from '../../components/profile/BasicProfileView'
import { formatProfileData } from '../../lib/profiles'
import Markdown from '../../components/EditorComponents/Markdown'
import Dropdown from '../../components/Dropdown'

dayjs.extend(relativeTime)

const UserModerationTab = ({ accessToken }) => {
  const [shouldReload, reload] = useReducer((p) => !p, true)
  const [configNote, setConfigNote] = useState(null)
  const moderationDisabled = configNote?.content?.moderate === 'No'

  const getModerationStatus = async () => {
    try {
      const { notes } = await api.get('/notes', {
        invitation: `${process.env.SUPER_USER}/Support/-/OpenReview_Config`,
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

  useEffect(() => {
    getModerationStatus()
  }, [])

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

const FullComment = ({ comment }) => <Markdown text={comment} />

const FullUsernameList = ({ usernames }) => (
  <ul>
    {usernames.map((p) => (
      <li key={p}>{p}</li>
    ))}
  </ul>
)

const NameDeletionTab = ({ accessToken, superUser, setNameDeletionRequestCountMsg }) => {
  const [nameDeletionNotes, setNameDeletionNotes] = useState(null)
  const [nameDeletionNotesToShow, setNameDeletionNotesToShow] = useState(null)
  const [noteToReject, setNoteToReject] = useState(null)
  const [commentToView, setCommentToView] = useState(null)
  const [idsLoading, setIdsLoading] = useState([])
  const [page, setPage] = useState(1)
  const pageSize = 25
  const fullTextModalId = 'deletion-fulltext-modal'

  const loadNameDeletionRequests = async () => {
    const nameDeletionDecisionInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Name_Removal_Decision`
    try {
      const nameRemovalNotesP = api.get(
        '/notes',
        {
          invitation: `${process.env.SUPER_USER}/Support/-/Profile_Name_Removal`,
        },
        { accessToken }
      )
      const decisionResultsP = api.getAll(
        '/references',
        {
          invitation: nameDeletionDecisionInvitationId,
        },
        { accessToken, resultsKey: 'references' }
      )
      const processLogsP = api.getAll(
        '/logs/process',
        { invitation: nameDeletionDecisionInvitationId },
        { accessToken, resultsKey: 'logs' }
      )

      const [nameRemovalNotes, decisionResults, processLogs] = await Promise.all([
        nameRemovalNotesP,
        decisionResultsP,
        processLogsP,
      ])
      const sortedResult = [
        ...nameRemovalNotes.notes.filter((p) => p.content.status === 'Pending'),
        ...nameRemovalNotes.notes.filter((p) => p.content.status !== 'Pending'),
      ].map((p) => {
        const decisionReference = decisionResults.find((q) => q.referent === p.id)
        let processLogStatus = 'N/A'
        if (p.content.status !== 'Pending')
          processLogStatus =
            processLogs.find((q) => q.id === decisionReference.id)?.status ?? 'running'
        return {
          ...p,
          processLogStatus,
          processLogUrl: decisionReference
            ? `${process.env.API_URL}/logs/process?id=${decisionReference.id}`
            : null,
        }
      })
      setNameDeletionNotes(sortedResult)
      setNameDeletionNotesToShow(
        sortedResult.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize)
      )
      const pendingRequestCount = nameRemovalNotes.notes.filter(
        (p) => p.content.status === 'Pending'
      ).length
      const errorProcessCount = sortedResult.filter(
        (p) => p.processLogStatus === 'error'
      ).length
      setNameDeletionRequestCountMsg(
        getTabCountMessage(pendingRequestCount, errorProcessCount)
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleRejectButtonClick = (note) => {
    setNoteToReject(note)
  }

  const acceptRejectNameDeletionNote = async (nameDeletionNote, response, supportComment) => {
    const nameDeletionDecisionInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Name_Removal_Decision`
    try {
      setIdsLoading((p) => [...p, nameDeletionNote.id])
      const invitationResult = await api.get(
        '/invitations',
        { id: nameDeletionDecisionInvitationId },
        { accessToken }
      )
      const nameDeletionDecisionInvitation = invitationResult.invitations[0]
      const noteToPost = {
        referent: nameDeletionNote.id,
        invitation: nameDeletionDecisionInvitation.id,
        content: {
          status: response,
          ...(response === 'Rejected' && { support_comment: supportComment }),
        },
        readers: buildArray(nameDeletionDecisionInvitation, 'readers', superUser.profile.id),
        writers: buildArray(nameDeletionDecisionInvitation, 'writers', superUser.profile.id),
        signatures: buildArray(
          nameDeletionDecisionInvitation,
          'signatures',
          superUser.profile.id
        ),
      }
      const result = await api.post('/notes', noteToPost, { accessToken })
      $('#name-delete-reject').modal('hide')
      loadNameDeletionRequests()
    } catch (error) {
      promptError(error.message)
      setIdsLoading((p) => p.filter((q) => q !== nameDeletionNote.id))
    }
  }

  const getStatusLabelClass = (note) => {
    switch (note.content.status) {
      case 'Accepted':
        return 'label label-success'
      case 'Rejected':
        return 'label label-danger'
      default:
        return 'label label-default'
    }
  }

  const getProcessLogStatusLabelClass = (note) => {
    switch (note.processLogStatus) {
      case 'ok':
        return 'label label-success'
      case 'error':
        return 'label label-danger'
      case 'running':
        return 'label label-default'
      default:
        return ''
    }
  }

  useEffect(() => {
    if (noteToReject) $('#name-delete-reject').modal('show')
  }, [noteToReject])

  useEffect(() => {
    if (commentToView) $(`#${fullTextModalId}`).modal('show')
  }, [commentToView])

  useEffect(() => {
    if (!nameDeletionNotes) return
    setNameDeletionNotesToShow(
      nameDeletionNotes.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize)
    )
  }, [page])

  useEffect(() => {
    loadNameDeletionRequests()
  }, [])

  return (
    <>
      <div className="name-deletion-list">
        {nameDeletionNotesToShow ? (
          <>
            <Table
              headings={[
                { content: 'Status', width: '12%' },
                { content: 'Requester', width: '15%' },
                { content: 'Name to delete', width: '15%' },
                { content: 'Reason', width: '20%' },
                { content: 'Date' },
              ]}
            />
            {nameDeletionNotesToShow.map((note) => (
              <div className="name-deletion-row" key={note.id}>
                <span className="col-status">
                  <span className={getStatusLabelClass(note)}>{note.content.status}</span>
                </span>
                <span className="col-status">
                  <a href={note.processLogUrl} target="_blank" rel="noreferrer">
                    <span className={getProcessLogStatusLabelClass(note)}>
                      {note.processLogStatus}
                    </span>
                  </a>
                </span>
                <span className="name">
                  <a
                    href={`/profile?id=${note.signatures[0]}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {prettyId(note.signatures[0])}
                  </a>
                </span>
                <span
                  className="usernames"
                  onClick={() =>
                    setCommentToView(<FullUsernameList usernames={note.content.usernames} />)
                  }
                >
                  {note.content.usernames.join(',')}
                </span>
                <div className="comment">
                  <span
                    onClick={() =>
                      setCommentToView(<FullComment comment={note.content.comment} />)
                    }
                  >
                    {note.content.comment}
                  </span>
                </div>
                <span className="col-created">{formatDateTime(note.tcdate)}</span>
                <span className="col-actions">
                  {note.content.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-xs"
                        disabled={idsLoading.includes(note.id)}
                        onClick={() => {
                          acceptRejectNameDeletionNote(note, 'Accepted')
                        }}
                      >
                        <Icon name="ok-circle" /> Accept
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-xs"
                        disabled={idsLoading.includes(note.id)}
                        onClick={() => {
                          handleRejectButtonClick(note, false)
                        }}
                      >
                        <Icon name="remove-circle" /> Reject
                      </button>{' '}
                    </>
                  )}
                </span>
              </div>
            ))}
            {nameDeletionNotes.length === 0 ? (
              <p className="empty-message">No name deletion requests.</p>
            ) : (
              <PaginationLinks
                currentPage={page}
                itemsPerPage={pageSize}
                totalCount={nameDeletionNotes.length}
                options={{ useShallowRouting: true }}
                setCurrentPage={setPage}
              />
            )}
          </>
        ) : (
          <LoadSpinner inline />
        )}
      </div>
      <RequestRejectionModal
        noteToReject={noteToReject}
        acceptRejectNote={acceptRejectNameDeletionNote}
        setNoteToReject={setNoteToReject}
      />
      <FullTextModal
        id={fullTextModalId}
        textToView={commentToView}
        setTextToView={setCommentToView}
      />
    </>
  )
}

const ProfileMergeTab = ({ accessToken, superUser, setProfileMergeRequestCountMsg }) => {
  const [profileMergeNotes, setProfileMergeNotes] = useState(null)
  const [profileMergeNotesToShow, setProfileMergeNotesToShow] = useState(null)
  const [noteToReject, setNoteToReject] = useState(null)
  const [textToView, setTextToView] = useState(null)
  const [idsLoading, setIdsLoading] = useState([])
  const [lastComparedNote, setLastComparedNote] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 25
  const fullTextModalId = 'merge-fulltext-modal'
  const profileMergeDecisionInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge_Decision`
  const profileMergeInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge`

  const loadProfileMergeRequests = async () => {
    try {
      const profileMergeNotesP = api.get(
        '/notes',
        {
          invitation: profileMergeInvitationId,
        },
        { accessToken }
      )
      const decisionResultsP = api.getAll(
        '/references',
        {
          invitation: profileMergeDecisionInvitationId,
        },
        { accessToken, resultsKey: 'references' }
      )
      const processLogsP = api.getAll(
        '/logs/process',
        { invitation: profileMergeDecisionInvitationId },
        { accessToken, resultsKey: 'logs' }
      )

      const [profileMergeNotesResults, decisionResults, processLogs] = await Promise.all([
        profileMergeNotesP,
        decisionResultsP,
        processLogsP,
      ])
      const sortedResult = [
        ...profileMergeNotesResults.notes.filter((p) => p.content.status === 'Pending'),
        ...profileMergeNotesResults.notes.filter((p) => p.content.status !== 'Pending'),
      ].map((p) => {
        const decisionReference = decisionResults.find((q) => q.referent === p.id)
        let processLogStatus = 'N/A'
        if (p.content.status !== 'Pending')
          processLogStatus =
            processLogs.find((q) => q.id === decisionReference.id)?.status ?? 'running'
        return {
          ...p,
          processLogStatus,
          processLogUrl: decisionReference
            ? `${process.env.API_URL}/logs/process?id=${decisionReference.id}`
            : null,
        }
      })
      setProfileMergeNotes(sortedResult)
      setProfileMergeNotesToShow(
        sortedResult.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize)
      )
      const pendingRequestCount = profileMergeNotesResults.notes.filter(
        (p) => p.content.status === 'Pending'
      ).length
      const errorProcessCount = sortedResult.filter(
        (p) => p.processLogStatus === 'error'
      ).length
      setProfileMergeRequestCountMsg(
        getTabCountMessage(pendingRequestCount, errorProcessCount)
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleRejectButtonClick = (note) => {
    setNoteToReject(note)
  }

  const acceptRejectProfileMergeNote = async (profileMergeNote, response, supportComment) => {
    try {
      setIdsLoading((p) => [...p, profileMergeNote.id])
      const invitationResult = await api.get(
        '/invitations',
        { id: profileMergeDecisionInvitationId },
        { accessToken }
      )
      const profileMergeDecisionInvitation = invitationResult.invitations[0]
      const noteToPost = {
        referent: profileMergeNote.id,
        invitation: profileMergeDecisionInvitation.id,
        content: {
          status: response,
          ...(response === 'Rejected' && { support_comment: supportComment }),
        },
        readers: buildArray(profileMergeDecisionInvitation, 'readers', superUser.profile.id),
        writers: buildArray(profileMergeDecisionInvitation, 'writers', superUser.profile.id),
        signatures: buildArray(
          profileMergeDecisionInvitation,
          'signatures',
          superUser.profile.id
        ),
      }
      const result = await api.post('/notes', noteToPost, { accessToken })
      $('#name-delete-reject').modal('hide')
      loadProfileMergeRequests()
    } catch (error) {
      promptError(error.message)
      setIdsLoading((p) => p.filter((q) => q !== profileMergeNote.id))
    }
  }

  const getStatusLabelClass = (note) => {
    switch (note.content.status) {
      case 'Accepted':
        return 'label label-success'
      case 'Rejected':
        return 'label label-danger'
      default:
        return 'label label-default'
    }
  }

  const getProcessLogStatusLabelClass = (note) => {
    switch (note.processLogStatus) {
      case 'ok':
        return 'label label-success'
      case 'error':
        return 'label label-danger'
      case 'running':
        return 'label label-default'
      default:
        return ''
    }
  }

  useEffect(() => {
    if (noteToReject) $('#name-delete-reject').modal('show')
  }, [noteToReject])

  useEffect(() => {
    if (textToView) $(`#${fullTextModalId}`).modal('show')
  }, [textToView])

  useEffect(() => {
    if (!profileMergeNotes) return
    setProfileMergeNotesToShow(
      profileMergeNotes.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize)
    )
  }, [page])

  useEffect(() => {
    loadProfileMergeRequests()
  }, [])

  return (
    <>
      <div className="profile-merge-list">
        {profileMergeNotesToShow ? (
          <>
            <Table
              headings={[
                { content: 'Status', width: '12%' },
                { content: 'Signature/Email', width: '15%' },
                { content: 'Compare', width: '20%' },
                { content: 'Comment' },
              ]}
            />
            {profileMergeNotesToShow.map((note) => (
              <div className="profile-merge-row" key={note.id}>
                <span className="col-status">
                  <span
                    className={getStatusLabelClass(note)}
                    onClick={() => {
                      if (note.content.support_comment) {
                        setTextToView(<FullComment comment={note.content.support_comment} />)
                      }
                    }}
                  >
                    {note.content.status}
                  </span>
                </span>
                <span className="col-status">
                  <a href={note.processLogUrl} target="_blank" rel="noreferrer">
                    <span className={getProcessLogStatusLabelClass(note)}>
                      {note.processLogStatus}
                    </span>
                  </a>
                </span>
                <span className="signature">
                  {note.signatures[0] === '(guest)' ? (
                    <span
                      onClick={() =>
                        setTextToView(<FullComment comment={note.content.email} />)
                      }
                    >
                      {note.content.email}
                    </span>
                  ) : (
                    <a
                      href={`/profile?id=${note.signatures[0]}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {prettyId(note.signatures[0])}
                    </a>
                  )}
                </span>
                <span
                  className={`compare${note.id === lastComparedNote ? ' last-previewed' : ''}`}
                >
                  <a
                    href={`/profile/compare?left=${note.content.left}&right=${note.content.right}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setLastComparedNote(note.id)}
                  >
                    {`${note.content.left},${note.content.right}`}
                  </a>
                </span>
                <div className="comment">
                  <span
                    onClick={() =>
                      setTextToView(<FullComment comment={note.content.comment} />)
                    }
                  >
                    {note.content.comment}
                  </span>
                </div>
                <span className="col-created">{formatDateTime(note.tcdate)}</span>
                <span className="col-actions">
                  {note.content.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-xs"
                        disabled={idsLoading.includes(note.id)}
                        onClick={() => {
                          acceptRejectProfileMergeNote(note, 'Accepted')
                        }}
                      >
                        <Icon name="ok-circle" /> Done
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-xs"
                        disabled={idsLoading.includes(note.id)}
                        onClick={() => {
                          handleRejectButtonClick(note, false)
                        }}
                      >
                        <Icon name="remove-circle" /> Reject
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-xs"
                        disabled={idsLoading.includes(note.id)}
                        onClick={() => {
                          acceptRejectProfileMergeNote(note, 'Ignored')
                        }}
                      >
                        Ignore
                      </button>
                    </>
                  )}
                </span>
              </div>
            ))}
            {profileMergeNotes.length === 0 ? (
              <p className="empty-message">No profile merge requests.</p>
            ) : (
              <PaginationLinks
                currentPage={page}
                itemsPerPage={pageSize}
                totalCount={profileMergeNotes.length}
                options={{ useShallowRouting: true }}
                setCurrentPage={setPage}
              />
            )}
          </>
        ) : (
          <LoadSpinner inline />
        )}
      </div>
      <RequestRejectionModal
        noteToReject={noteToReject}
        acceptRejectNote={acceptRejectProfileMergeNote}
        setNoteToReject={setNoteToReject}
      />
      <FullTextModal
        id={fullTextModalId}
        textToView={textToView}
        setTextToView={setTextToView}
      />
    </>
  )
}

const VenueRequestRow = ({ item }) => {
  const { forum, abbreviatedName, unrepliedPcComments, deployed, tauthor, tcdate } = item
  return (
    <div className="venue-request-row">
      <a className="request-name" href={`/forum?id=${forum}`} target="_blank" rel="noreferrer">
        {abbreviatedName}
      </a>
      <div className="request-status">
        <div className="deploy-label">
          <span className={`label label-${deployed ? 'success' : 'default'}`}>
            {deployed ? 'Deployed' : 'Not Deployed'}
          </span>
        </div>
        <div className="comment-label">
          <span
            className={`label label-${unrepliedPcComments.length ? 'warning' : 'success'}`}
          >
            {unrepliedPcComments.length > 0 ? (
              <a
                href={`/forum?id=${forum}&noteId=${unrepliedPcComments[0].id}`}
                target="_blank"
                rel="noreferrer"
                title={`
${dayjs(unrepliedPcComments[0].tcdate).fromNow()}
${unrepliedPcComments[0].content?.comment}`}
              >
                {`${inflect(unrepliedPcComments.length, 'comment', 'comments', true)}`}
              </a>
            ) : (
              'no comment'
            )}
          </span>
        </div>
        <div className="tcdate-label">{dayjs(tcdate).fromNow()}</div>
      </div>
      <a href={`/profile?email=${tauthor}`} target="_blank" rel="noreferrer">
        {prettyId(tauthor)}
      </a>
    </div>
  )
}

const VenueRequestsTab = ({ accessToken, setPendingVenueRequestCount }) => {
  const [venuRequestNotes, setVenueRequestNotes] = useState([])
  const hasBeenReplied = (comment, allReplies) => {
    // checks the reply itself or its replies have been replied by support
    const replies = allReplies.filter((p) => p.replyto === comment.id)
    if (!replies.length) return false
    if (replies.length === 1 && replies[0].signatures.includes('OpenReview.net/Support')) {
      return true
    }

    return replies.some((p) => hasBeenReplied(p, allReplies))
  }

  const loadRequestNotes = async () => {
    try {
      const { notes, count } = await api.get(
        '/notes',
        {
          invitation: 'OpenReview.net/Support/-/Request_Form',
          sort: 'tcdate',
          details: 'replies',
        },
        { accessToken }
      )

      const allVenueRequests = notes?.map((p) => ({
        id: p.id,
        forum: p.forum,
        tcdate: p.tcdate,
        isCreatedInPastWeek: dayjs().diff(dayjs(p.tcdate), 'd') < 7,
        abbreviatedName: p.content?.['Abbreviated Venue Name'],
        hasOfficialReply: p.details.replies.find((q) =>
          q.signatures.includes('OpenReview.net/Support')
        ),
        unrepliedPcComments: sortBy(
          p.details.replies.filter(
            (q) =>
              q.invitation.endsWith('Comment') &&
              !q.signatures.includes('OpenReview.net/Support') &&
              !hasBeenReplied(q, p.details.replies) &&
              dayjs().diff(dayjs(q.cdate), 'd') < 7
          ),
          (s) => -s.cdate
        ),
        deployed: p.content?.venue_id,
        tauthor: p.tauthor,
      }))

      const venueNotDeployedInPastWeekCount = allVenueRequests.filter(
        (p) => !p.deployed && p.isCreatedInPastWeek
      ).length
      const venueWithUnrepliedCommentCount = allVenueRequests.filter(
        (p) => p.unrepliedPcComments.length > 0
      ).length
      setPendingVenueRequestCount(
        getTabCountMessage(
          venueWithUnrepliedCommentCount,
          venueNotDeployedInPastWeekCount,
          'venue with comment',
          'venue request'
        )
      )
      setVenueRequestNotes(
        orderBy(
          allVenueRequests,
          [
            (p) => !p.deployed && p.isCreatedInPastWeek,
            (p) => p.unrepliedPcComments.length,
            'tcdate',
          ],
          ['desc', 'desc', 'desc']
        )
      )
    } catch (error) {
      promptError(error.message)
    }
  }
  const loadItems = useCallback(
    (limit, offset) =>
      Promise.resolve({
        items: venuRequestNotes.slice(offset, offset + limit),
        count: venuRequestNotes.length,
      }),
    [venuRequestNotes]
  )

  useEffect(() => {
    loadRequestNotes()
  }, [])

  return (
    <PaginatedList
      className="venue-request-list"
      loadItems={loadItems}
      emptyMessage="No venue requests"
      itemsPerPage={25}
      ListItem={VenueRequestRow}
    />
  )
}

const Moderation = ({ appContext, accessToken, superUser }) => {
  const { setBannerHidden } = appContext
  const [nameDeletionRequestCountMsg, setNameDeletionRequestCountMsg] = useState(0)
  const [profileMergeRequestCountMsg, setProfileMergeRequestCountMsg] = useState(0)
  const [pendingVenueRequestCount, setPendingVenueRequestCount] = useState(0)

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
        {/* <hr /> */}
      </header>

      <Tabs>
        <TabList>
          <Tab id="reply" active>
            User Moderation
          </Tab>
          <Tab id="preview">
            Name Delete Requests{' '}
            {nameDeletionRequestCountMsg && (
              <span className="badge">{nameDeletionRequestCountMsg}</span>
            )}
          </Tab>
          <Tab id="merge">
            Profile Merge Requests{' '}
            {profileMergeRequestCountMsg && (
              <span className="badge">{profileMergeRequestCountMsg}</span>
            )}
          </Tab>
          <Tab id="requests">
            Venue Requests{' '}
            {pendingVenueRequestCount !== 0 && (
              <span className="badge">{pendingVenueRequestCount}</span>
            )}
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="reply">
            <UserModerationTab accessToken={accessToken} />
          </TabPanel>
          <TabPanel id="preview">
            <NameDeletionTab
              accessToken={accessToken}
              superUser={superUser}
              setNameDeletionRequestCountMsg={setNameDeletionRequestCountMsg}
            />
          </TabPanel>
          <TabPanel id="merge">
            <ProfileMergeTab
              accessToken={accessToken}
              superUser={superUser}
              setProfileMergeRequestCountMsg={setProfileMergeRequestCountMsg}
            />
          </TabPanel>
          <TabPanel id="requests">
            <VenueRequestsTab
              accessToken={accessToken}
              setPendingVenueRequestCount={setPendingVenueRequestCount}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
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
  const [profileIdToReject, setProfileIdToReject] = useState(null)
  const [signedNotesCount, setSignedNotesCount] = useState(0)
  const [idsLoading, setIdsLoading] = useState([])
  const [descOrder, setDescOrder] = useState(true)
  const [pageSize, setPageSize] = useState(15)
  const [profileToPreview, setProfileToPreview] = useState(null)
  const [lastPreviewedProfileId, setLastPreviewedProfileId] = useState(null)
  const modalId = `${onlyModeration ? 'new' : ''}-user-reject-modal`
  const pageSizeOptions = [15, 30, 50, 100].map((p) => ({
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
  ].map((p) => ({ label: p, value: p }))

  const getProfiles = async () => {
    const queryOptions = onlyModeration ? { needsModeration: true } : {}
    const cleanSearchTerm = filters.term?.trim()
    const shouldSearchProfile = profileStateOption === 'All' && cleanSearchTerm
    let searchQuery = { fullname: cleanSearchTerm?.toLowerCase() }
    if (cleanSearchTerm?.startsWith('~')) searchQuery = { id: cleanSearchTerm }
    if (cleanSearchTerm?.includes('@')) searchQuery = { email: cleanSearchTerm.toLowerCase() }

    try {
      const result = await api.get(
        shouldSearchProfile ? '/profiles/search' : '/profiles',
        {
          ...queryOptions,

          ...(!shouldSearchProfile && { sort: `tcdate:${descOrder ? 'desc' : 'asc'}` }),
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
      reload()
      promptMessage(`${prettyId(profileId)} is now active`, { scrollToTop: false })
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
      setIdsLoading((p) => p.filter((q) => q !== profileId))
    }
  }

  const showRejectionModal = async (profileId) => {
    if (!onlyModeration) {
      const signedNotes = await api.getCombined('/notes', { signature: profileId }, null, {
        accessToken,
      })
      setSignedNotesCount(signedNotes.count)
    }
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
    const actionIsBlock = profile?.state !== 'Blocked'
    const signedNotes = !onlyModeration
      ? await api.getCombined('/notes', { signature: profile.id }, null, {
          accessToken,
        })
      : {}
    // eslint-disable-next-line no-alert
    const confirmResult = window.confirm(
      `Are you sure you want to ${actionIsBlock ? 'block' : 'unblock'} ${
        profile?.content?.names?.[0]?.first
      } ${profile?.content?.names?.[0]?.last}?${
        !onlyModeration && actionIsBlock && signedNotes.count
          ? `\n\nThere are ${signedNotes.count} notes signed by this profile.`
          : ''
      }`
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

  const deleteRestoreUser = async (profile) => {
    const actionIsDelete = !profile?.ddate

    if (actionIsDelete) {
      const signedNotes = await api.getCombined('/notes', { signature: profile.id }, null, {
        accessToken,
      })
      if (signedNotes.count) {
        promptError(
          `There are ${inflect(
            signedNotes.count,
            'note',
            'notes',
            true
          )} signed by this profile.`
        )
        return
      }
    }

    // eslint-disable-next-line no-alert
    const confirmResult = window.confirm(
      `Are you sure you want to ${actionIsDelete ? 'delete' : 'restore'} ${
        profile?.content?.names?.[0]?.first
      } ${profile?.content?.names?.[0]?.last}?`
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
          descOrder ? 'Sort: Newest First' : 'Sort: Oldest First'
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
                    {name.first} {name.middle} {name.last}
                  </a>
                </span>
                <span className="col-email text-muted">{profile.content.preferredEmail}</span>
                <span className="col-created">{formatDateTime(profile.tcdate)}</span>
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
                      {!(profile.state === 'Blocked' || profile.ddate) && (
                        <button
                          type="button"
                          className="btn btn-xs"
                          onClick={() => showRejectionModal(profile.id)}
                        >
                          <Icon name="remove-circle" /> Reject
                        </button>
                      )}{' '}
                      {!profile.ddate && (
                        <button
                          type="button"
                          className="btn btn-xs btn-block-profile"
                          onClick={() => blockUnblockUser(profile)}
                        >
                          <Icon
                            name={`${profile.state === 'Blocked' ? 'refresh' : 'ban-circle'}`}
                          />{' '}
                          {`${profile.state === 'Blocked' ? 'Unblock' : 'Block'}`}
                        </button>
                      )}{' '}
                      {state !== 'Merged' && (
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
        <LoadSpinner inline />
      )}
      <div className="pagination-container-with-control">
        <PaginationLinks
          currentPage={pageNumber}
          itemsPerPage={pageSize}
          totalCount={totalCount}
          setCurrentPage={setPageNumber}
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
        id={modalId}
        profileIdToReject={profileIdToReject}
        rejectUser={rejectUser}
        signedNotesCount={signedNotesCount}
      />
      <ProfilePreviewModal
        profileToPreview={profileToPreview}
        setProfileToPreview={setProfileToPreview}
        setLastPreviewedProfileId={setLastPreviewedProfileId}
      />
    </div>
  )
}

const RejectionModal = ({ id, profileIdToReject, rejectUser, signedNotesCount }) => {
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
      rejectionText: `A valid Homepage and institutional email matching your latest career/education history are required.\n\n${instructionText}`,
    },
    {
      value: 'imPersonalHomepageAndEmail',
      label: 'Impersonal Homepage + Missing Institution Email',
      rejectionText: `A Homepage url which displays your name and institutional email matching your latest career/education history are required.\n\n${instructionText}`,
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
      <>
        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="form-group form-rejection">
            <label htmlFor="message" className="mb-1">
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
        {signedNotesCount > 0 && (
          <h4>{`There are ${signedNotesCount} notes signed by this profile.`}</h4>
        )}
      </>
    </BasicModal>
  )
}

const RequestRejectionModal = ({ noteToReject, acceptRejectNote, setNoteToReject }) => {
  const [supportComment, setSupportComment] = useState('')
  if (!noteToReject) return null
  return (
    <BasicModal
      id="name-delete-reject"
      primaryButtonDisabled={!supportComment}
      onPrimaryButtonClick={() => {
        acceptRejectNote(noteToReject, 'Rejected', supportComment)
      }}
      onClose={() => {
        setNoteToReject(null)
        setSupportComment('')
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
              Reason for rejecting {noteToReject.content.name}:
            </label>
            <textarea
              name="message"
              className="form-control mt-2"
              rows="5"
              value={supportComment}
              onChange={(e) => {
                setSupportComment(e.target.value)
              }}
            />
          </div>
        </form>
      </>
    </BasicModal>
  )
}

const FullTextModal = ({ id, textToView, setTextToView }) => (
  <BasicModal
    id={id}
    onClose={() => setTextToView(null)}
    primaryButtonText={null}
    cancelButtonText="OK"
  >
    {textToView}
  </BasicModal>
)

const ProfilePreviewModal = ({
  profileToPreview,
  setProfileToPreview,
  setLastPreviewedProfileId,
}) => {
  if (!profileToPreview) return null
  return (
    <BasicModal
      id="profile-preview"
      primaryButtonText={null}
      cancelButtonText="OK"
      onClose={() => {
        setProfileToPreview(null)
        setLastPreviewedProfileId(profileToPreview.id)
      }}
    >
      <BasicProfileView profile={profileToPreview} showLinkText={true} />
    </BasicModal>
  )
}

export default withAdminAuth(Moderation)
