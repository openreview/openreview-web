/* globals $,promptError,promptMessage,view2: false */

import { useEffect, useState, useReducer, useRef, useCallback } from 'react'
import Head from 'next/head'
import { cloneDeep, orderBy, sortBy, uniqBy } from 'lodash'
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
  inflect,
  getProfileStateLabelClass,
  getVenueTabCountMessage,
  getRejectionReasons,
} from '../../lib/utils'
import BasicModal from '../../components/BasicModal'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../../components/Tabs'
import PaginatedList from '../../components/PaginatedList'
import Table from '../../components/Table'
import { formatProfileData } from '../../lib/profiles'
import Markdown from '../../components/EditorComponents/Markdown'
import Dropdown from '../../components/Dropdown'
import ProfilePreviewModal from '../../components/profile/ProfilePreviewModal'

dayjs.extend(relativeTime)

const UserModerationTab = ({ accessToken }) => {
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

const FullComment = ({ comment }) => <Markdown text={comment} />

const FullUsernameList = ({ usernames }) => (
  <ul>
    {usernames.map((p) => (
      <li key={p}>{p}</li>
    ))}
  </ul>
)

const NameDeletionTab = ({ accessToken, setNameDeletionRequestCount, isActive }) => {
  const [nameDeletionNotes, setNameDeletionNotes] = useState(null)
  const [nameDeletionNotesToShow, setNameDeletionNotesToShow] = useState(null)
  const [noteToReject, setNoteToReject] = useState(null)
  const [commentToView, setCommentToView] = useState(null)
  const [idsLoading, setIdsLoading] = useState([])
  const [page, setPage] = useState(1)
  const pageSize = 25
  const fullTextModalId = 'deletion-fulltext-modal'

  const loadNameDeletionRequests = async (noteId) => {
    const nameDeletionDecisionInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Name_Removal_Decision`
    try {
      let nameRemovalNotesP
      let decisionResultsP
      let processLogsP

      if (noteId) {
        nameRemovalNotesP = api.get('/notes', { id: noteId }, { accessToken })
        decisionResultsP = api.getAll(
          '/notes/edits',
          { 'note.id': noteId, invitation: nameDeletionDecisionInvitationId },
          { accessToken, resultsKey: 'edits' }
        )
        processLogsP = Promise.resolve(null)
      } else {
        nameRemovalNotesP = api.get(
          '/notes',
          {
            invitation: `${process.env.SUPER_USER}/Support/-/Profile_Name_Removal`,
          },
          { accessToken }
        )
        decisionResultsP = api.getAll(
          '/notes/edits',
          {
            invitation: nameDeletionDecisionInvitationId,
          },
          { accessToken, resultsKey: 'edits' }
        )
        processLogsP = isActive
          ? api.getAll(
              '/logs/process',
              { invitation: nameDeletionDecisionInvitationId },
              { accessToken, resultsKey: 'logs' }
            )
          : Promise.resolve([])
      }

      const [nameRemovalNotes, decisionResults, processLogs] = await Promise.all([
        nameRemovalNotesP,
        decisionResultsP,
        processLogsP,
      ])
      const sortedResult = noteId
        ? [
            ...nameDeletionNotes.filter(
              (p) => p.content.status.value === 'Pending' && p.id !== noteId
            ),
            {
              ...nameRemovalNotes.notes[0],
              processLogStatus: 'running',
              processLogUrl: `${process.env.API_URL}/logs/process?id=${decisionResults[0].id}`,
            },
            ...nameDeletionNotes.filter((p) => p.content.status.value !== 'Pending'),
          ]
        : [
            ...nameRemovalNotes.notes.filter((p) => p.content.status.value === 'Pending'),
            ...nameRemovalNotes.notes.filter((p) => p.content.status.value !== 'Pending'),
          ].map((p) => {
            const decisionEdit = decisionResults.find((q) => q.note.id === p.id)
            let processLogStatus = 'N/A'
            if (p.content.status.value !== 'Pending')
              processLogStatus =
                processLogs.find((q) => q.id === decisionEdit.id)?.status ?? 'running'
            return {
              ...p,
              processLogStatus,
              processLogUrl: decisionEdit
                ? `${process.env.API_URL}/logs/process?id=${decisionEdit.id}`
                : null,
            }
          })
      setNameDeletionNotes(sortedResult)
      setNameDeletionNotesToShow(
        sortedResult.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize)
      )
      const pendingRequestCount = nameRemovalNotes.notes.filter(
        (p) => p.content.status.value === 'Pending'
      ).length
      setNameDeletionRequestCount(pendingRequestCount)
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
      const nameDeletionDecisionInvitation = await api.getInvitationById(
        nameDeletionDecisionInvitationId,
        accessToken
      )

      const editToPost = view2.constructEdit({
        formData: {
          id: nameDeletionNote.id,
          status: response,
          ...(response === 'Rejected' && { support_comment: supportComment }),
        },

        invitationObj: nameDeletionDecisionInvitation,
      })
      const result = await api.post('/notes/edits', editToPost, { accessToken })
      $('#name-delete-reject').modal('hide')
      loadNameDeletionRequests(nameDeletionNote.id)
    } catch (error) {
      promptError(error.message)
      setIdsLoading((p) => p.filter((q) => q !== nameDeletionNote.id))
    }
  }

  const getStatusLabelClass = (note) => {
    switch (note.content.status.value) {
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
  }, [isActive])

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
                  <span className={getStatusLabelClass(note)}>
                    {note.content.status.value}
                  </span>
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
                    setCommentToView(
                      <FullUsernameList usernames={note.content.usernames.value} />
                    )
                  }
                >
                  {note.content.usernames.value.join(',')}
                </span>
                <div className="comment">
                  <span
                    onClick={() =>
                      setCommentToView(<FullComment comment={note.content.comment.value} />)
                    }
                  >
                    {note.content.comment.value}
                  </span>
                </div>
                <span className="col-created">{formatDateTime(note.tcdate)}</span>
                <span className="col-actions">
                  {note.content.status.value === 'Pending' && (
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

const ProfileMergeTab = ({
  accessToken,
  superUser,
  setProfileMergeRequestCount,
  isActive,
}) => {
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

  const loadProfileMergeRequests = async (noteId) => {
    try {
      let profileMergeNotesP
      let decisionResultsP
      let processLogsP

      if (noteId) {
        profileMergeNotesP = api.get('/notes', { id: noteId }, { accessToken })
        decisionResultsP = api.getAll(
          '/notes/edits',
          { 'note.id': noteId },
          { accessToken, resultsKey: 'edits' }
        )
        processLogsP = Promise.resolve(null)
      } else {
        profileMergeNotesP = api.get(
          '/notes',
          {
            invitation: profileMergeInvitationId,
          },
          { accessToken }
        )
        decisionResultsP = api.getAll(
          '/notes/edits',
          {
            invitation: profileMergeDecisionInvitationId,
          },
          { accessToken, resultsKey: 'edits' }
        )
        processLogsP = isActive
          ? api.getAll(
              '/logs/process',
              { invitation: profileMergeDecisionInvitationId },
              { accessToken, resultsKey: 'logs' }
            )
          : Promise.resolve([])
      }

      const [profileMergeNotesResults, decisionResults, processLogs] = await Promise.all([
        profileMergeNotesP,
        decisionResultsP,
        processLogsP,
      ])

      const sortedResult = noteId
        ? [
            ...profileMergeNotes.filter(
              (p) => p.content.status.value === 'Pending' && p.id !== noteId
            ),
            {
              ...profileMergeNotesResults.notes[0],
              processLogStatus: 'running',
              processLogUrl: `${process.env.API_URL}/logs/process?id=${decisionResults[0].id}`,
            },
            ...profileMergeNotes.filter((p) => p.content.status.value !== 'Pending'),
          ]
        : [
            ...profileMergeNotesResults.notes.filter(
              (p) => p.content.status.value === 'Pending'
            ),
            ...profileMergeNotesResults.notes.filter(
              (p) => p.content.status.value !== 'Pending'
            ),
          ].map((p) => {
            const decisionEdit = decisionResults.find((q) => q.note.id === p.id)
            let processLogStatus = 'N/A'
            if (p.content.status.value !== 'Pending')
              processLogStatus =
                processLogs.find((q) => q.id === decisionEdit.id)?.status ?? 'running'
            return {
              ...p,
              processLogStatus,
              processLogUrl: decisionEdit
                ? `${process.env.API_URL}/logs/process?id=${decisionEdit.id}`
                : null,
            }
          })
      setProfileMergeNotes(sortedResult)
      setProfileMergeNotesToShow(
        sortedResult.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize)
      )
      const pendingRequestCount = profileMergeNotesResults.notes.filter(
        (p) => p.content.status.value === 'Pending'
      ).length
      setProfileMergeRequestCount(pendingRequestCount)
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
      const profileMergeDecisionInvitation = await api.getInvitationById(
        profileMergeDecisionInvitationId,
        accessToken
      )
      const editToPost = view2.constructEdit({
        formData: {
          id: profileMergeNote.id,
          status: response,
          ...(response === 'Rejected' && { support_comment: supportComment }),
        },
        invitationObj: profileMergeDecisionInvitation,
      })
      const result = await api.post('/notes/edits', editToPost, { accessToken })
      $('#name-delete-reject').modal('hide')
      loadProfileMergeRequests(profileMergeNote.id)
    } catch (error) {
      promptError(error.message)
      setIdsLoading((p) => p.filter((q) => q !== profileMergeNote.id))
    }
  }

  const getStatusLabelClass = (note) => {
    switch (note.content.status.value) {
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
  }, [isActive])

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
                      if (note.content.support_comment.value) {
                        setTextToView(
                          <FullComment comment={note.content.support_comment.value} />
                        )
                      }
                    }}
                  >
                    {note.content.status.value}
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
                        setTextToView(<FullComment comment={note.content.email.value} />)
                      }
                    >
                      {note.content.email.value}
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
                    href={`/profile/compare?left=${note.content.left.value}&right=${note.content.right.value}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setLastComparedNote(note.id)}
                  >
                    {`${note.content.left.value},${note.content.right.value}`}
                  </a>
                </span>
                <div className="comment">
                  <span
                    onClick={() =>
                      setTextToView(<FullComment comment={note.content.comment.value} />)
                    }
                  >
                    {note.content.comment.value}
                  </span>
                </div>
                <span className="col-created">{formatDateTime(note.tcdate)}</span>
                <span className="col-actions">
                  {note.content.status.value === 'Pending' && (
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
    if (
      replies.length === 1 &&
      replies[0].signatures.includes(`${process.env.SUPER_USER}/Support`)
    ) {
      return true
    }

    return replies.some((p) => hasBeenReplied(p, allReplies))
  }

  const loadRequestNotes = async () => {
    try {
      const { notes, count } = await api.get(
        '/notes',
        {
          invitation: `${process.env.SUPER_USER}/Support/-/Request_Form`,
          sort: 'tcdate',
          details: 'replies',
          select: `id,forum,tcdate,content['Abbreviated Venue Name'],content.venue_id,tauthor,details.replies[*].id,details.replies[*].replyto,details.replies[*].content.comment,details.replies[*].invitation,details.replies[*].signatures,details.replies[*].cdate,details.replies[*].tcdate`,
        },
        { accessToken, version: 1 }
      )

      const allVenueRequests = notes?.map((p) => ({
        id: p.id,
        forum: p.forum,
        tcdate: p.tcdate,
        abbreviatedName: p.content?.['Abbreviated Venue Name'],
        hasOfficialReply: p.details?.replies?.find((q) =>
          q.signatures.includes(`${process.env.SUPER_USER}/Support`)
        ),
        unrepliedPcComments: sortBy(
          p.details?.replies?.filter(
            (q) =>
              q.invitation.endsWith('Comment') &&
              !q.signatures.includes(`${process.env.SUPER_USER}/Support`) &&
              !hasBeenReplied(q, p.details?.replies ?? []) &&
              dayjs().diff(dayjs(q.cdate), 'd') < 7
          ),
          (s) => -s.cdate
        ),
        deployed: p.content?.venue_id,
        tauthor: p.tauthor,
      }))

      const undeployedVenueCount = allVenueRequests.filter((p) => !p.deployed).length
      const venueWithUnrepliedCommentCount = allVenueRequests.filter(
        (p) => p.unrepliedPcComments.length > 0
      ).length
      setPendingVenueRequestCount(
        getVenueTabCountMessage(venueWithUnrepliedCommentCount, undeployedVenueCount)
      )
      setVenueRequestNotes(
        orderBy(
          allVenueRequests,
          [(p) => !p.deployed, (p) => p.unrepliedPcComments.length, 'tcdate'],
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

const EmailDeletionTab = ({ accessToken, isActive }) => {
  const [emailDeletionNotes, setEmailDeletionNotes] = useState(null)
  const [emailDeletionNotesToShow, setEmailDeletionNotesToShow] = useState(null)
  const [page, setPage] = useState(1)
  const emailDeletionFormRef = useRef(null)

  const emailRemovalInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Email_Removal`
  const pageSize = 25

  const loadEmailDeletionNotes = async () => {
    try {
      const notesResultP = api.getAll(
        '/notes',
        { invitation: emailRemovalInvitationId, sort: 'tcdate' },
        { accessToken }
      )
      const editResultsP = api.getAll(
        '/notes/edits',
        { invitation: emailRemovalInvitationId },
        { accessToken, resultsKey: 'edits' }
      )
      const processLogsP = isActive
        ? api.getAll(
            '/logs/process',
            { invitation: emailRemovalInvitationId },
            { accessToken, resultsKey: 'logs' }
          )
        : Promise.resolve([])
      const [notes, edits, processLogs] = await Promise.all([
        notesResultP,
        editResultsP,
        processLogsP,
      ])

      const notesWithStatus = notes.map((p) => {
        const edit = edits.find((q) => q.note.id === p.id)
        return {
          ...p,
          processLogStatus: processLogs.find((q) => q.id === edit?.id)?.status ?? 'running',
        }
      })

      setEmailDeletionNotes(notesWithStatus)
      setEmailDeletionNotesToShow(
        notesWithStatus.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize)
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleEmailDeletionRequest = async (e) => {
    e.preventDefault()

    const formData = new FormData(emailDeletionFormRef.current)
    const formContent = {}
    formData.forEach((value, name) => {
      const cleanValue = value.trim()
      formContent[name] = cleanValue?.length ? cleanValue : undefined
    })
    try {
      const emailRemovalInvitation = await api.getInvitationById(
        emailRemovalInvitationId,
        accessToken
      )

      const editToPost = view2.constructEdit({
        formData: formContent,
        invitationObj: emailRemovalInvitation,
      })

      const editResult = await api.post('/notes/edits', editToPost, {
        accessToken,
        version: 2,
      })
      const noteResult = await api.getNoteById(editResult.note.id, accessToken)

      const updatedEmailDeletionNotes = [
        { ...noteResult, processLogStatus: 'running' },
        ...emailDeletionNotes,
      ]
      setEmailDeletionNotes(updatedEmailDeletionNotes)
      setEmailDeletionNotesToShow(updatedEmailDeletionNotes.slice(0, pageSize))
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!emailDeletionNotes) return
    setEmailDeletionNotesToShow(
      emailDeletionNotes.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize)
    )
  }, [page])

  useEffect(() => {
    loadEmailDeletionNotes()
  }, [isActive])

  return (
    <>
      <div className="email-deletion-container">
        <form
          className="well mt-3"
          ref={emailDeletionFormRef}
          onSubmit={handleEmailDeletionRequest}
        >
          <input
            type="text"
            name="email"
            className="form-control input-sm"
            placeholder="Email to delete"
          />
          <input
            type="text"
            name="profile_id"
            className="form-control input-sm"
            placeholder="Profile ID the email is associated with"
          />
          <input
            type="text"
            name="comment"
            className="form-control input-sm comment"
            placeholder="Moderator comment"
          />

          <button type="submit" className="btn btn-xs">
            Submit
          </button>
        </form>
        <div className="email-deletion-list">
          {emailDeletionNotesToShow ? (
            <>
              <Table
                headings={[
                  { content: 'Status', width: '5%' },
                  { content: 'Email', width: '25%' },
                  { content: 'Profile Id', width: '25%' },
                  { content: 'Comment', width: '25%' },
                  { content: 'Date' },
                ]}
              />
              {emailDeletionNotesToShow.map((note) => (
                <div className="email-deletion-row" key={note.id}>
                  <span className="col-status">
                    <a
                      href={`${process.env.API_URL}/logs/process?id=${note.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span
                        className={`label label-${
                          note.processLogStatus === 'ok' ? 'success' : 'default'
                        }`}
                      >
                        {note.processLogStatus}
                      </span>
                    </a>
                  </span>
                  <span className="col-email">
                    <span>{note.content.email.value}</span>
                  </span>
                  <span className="col-profile">
                    <a
                      href={`/profile?id=${note.content.profile_id.value}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {note.content.profile_id.value}
                    </a>
                  </span>
                  <span className="col-comment">{note.content.comment.value}</span>
                  <span className="col-created">{formatDateTime(note.tcdate)}</span>
                </div>
              ))}
              {emailDeletionNotes.length === 0 ? (
                <p className="empty-message">No email deletion requests.</p>
              ) : (
                <PaginationLinks
                  currentPage={page}
                  itemsPerPage={pageSize}
                  totalCount={emailDeletionNotes.length}
                  options={{ useShallowRouting: true }}
                  setCurrentPage={setPage}
                />
              )}
            </>
          ) : (
            <LoadSpinner inline />
          )}
        </div>
      </div>
    </>
  )
}

const InstitutionTab = ({ accessToken, isActive }) => {
  const [institutions, setInstitutions] = useState(null)
  const [institutionsToShow, setInstitutionsToShow] = useState(null)
  const [institutionToEdit, setInstitutionToEdit] = useState(null)
  const [countryOptions, setCountryOptions] = useState([])
  const [page, setPage] = useState(1)
  const [searchAddForm, setSearchAddForm] = useReducer((state, action) => {
    if (action.type === 'reset') return {}
    return { ...state, [action.type]: action.payload }
  }, {})

  const pageSize = 25

  const loadInstitutionsDomains = async (noCache) => {
    try {
      const result = await api.get(
        `/settings/institutiondomains${noCache ? '?cache=false' : ''}`
      )
      setInstitutions(result)
      setInstitutionsToShow(
        result.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize)
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  const loadCountryOptions = async () => {
    const result = await api.get('/settings/countries')
    setCountryOptions(
      Object.entries(result ?? {})?.map(([name, details]) => ({
        value: details.alphaTwoCode,
        label: name,
      }))
    )
  }

  const getInstitutionDetails = async (institutionDomain) => {
    try {
      const result = await api.get('/settings/institutions', { domain: institutionDomain })
      const institution = result.institutions[0]
      if (!institution) {
        promptError(`Institution ${institutionDomain} not found.`)
        return
      }
      if (institution.id !== institutionDomain) {
        promptError(`Id of ${institutionDomain} is ${institution.id}`)
        return
      }
      setInstitutionToEdit({
        ...institution,
        domains: institution.domains.join(','),
        webPages: institution.webPages?.join(',') ?? '',
      })
    } catch (error) {
      promptError(error.message)
    }
  }

  const saveInstitution = async () => {
    try {
      const result = await api.post(
        '/settings/institutions',
        {
          id: institutionToEdit.id,
          shortname: institutionToEdit.shortname ? institutionToEdit.shortname.trim() : null,
          fullname: institutionToEdit.fullname ? institutionToEdit.fullname.trim() : null,
          parent: institutionToEdit.parent ? institutionToEdit.parent.trim() : null,
          domains: institutionToEdit.domains
            ? institutionToEdit.domains.split(',').map((p) => p.trim())
            : [],
          country: institutionToEdit.country,
          alphaTwoCode: institutionToEdit.alphaTwoCode,
          stateProvince: institutionToEdit.stateProvince
            ? institutionToEdit.stateProvince.trim()
            : null,
          webPages: institutionToEdit.webPages
            ? institutionToEdit.webPages.split(',').map((p) => p.trim())
            : null,
        },
        { accessToken }
      )
      promptMessage(`${institutionToEdit.id} saved.`)
      setInstitutionToEdit(null)
      loadInstitutionsDomains()
    } catch (error) {
      promptError(error.message)
    }
  }

  const deleteInstitution = async (institutionId) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(`Are you sure you want to delete ${institutionId}?`)
    if (!confirmed) return
    try {
      await api.delete(`/settings/institutions/${institutionId}`, undefined, { accessToken })
      promptMessage(`${institutionId} is deleted.`)
      loadInstitutionsDomains(true)
    } catch (error) {
      promptError(error.message)
    }
  }

  const searchInstitution = () => {
    const institutionIdToSearch = searchAddForm.institutionIdToSearch?.trim()
    setPage(1)
    if (!institutionIdToSearch?.length) {
      loadInstitutionsDomains()
      return
    }

    setInstitutions(
      institutions.filter((p) => p.toLowerCase().includes(institutionIdToSearch.toLowerCase()))
    )
  }

  const addInstitution = async () => {
    const institutionId = searchAddForm.id?.trim()?.toLowerCase()
    if (!institutionId) {
      promptError('Institution ID is required.')
      return
    }

    const institutionDomains = searchAddForm.domains
      ?.split(',')
      .flatMap((p) => (p.trim().toLowerCase()?.length ? p.trim().toLowerCase() : []))
    const webPages = searchAddForm.webPages
      ?.split(',')
      .flatMap((p) => (p.trim().toLowerCase()?.length ? p.trim().toLowerCase() : []))

    try {
      await api.post(
        '/settings/institutions',
        {
          id: institutionId,
          shortname: searchAddForm.shortname?.trim(),
          fullname: searchAddForm.fullname?.trim(),
          parent: searchAddForm.parent?.trim(),
          domains: institutionDomains,
          country: searchAddForm.country?.label,
          alphaTwoCode: searchAddForm.country?.value,
          stateProvince: searchAddForm.stateProvince?.trim(),
          webPages,
        },
        { accessToken }
      )
      promptMessage(`${searchAddForm.id} added.`)
      setSearchAddForm({ type: 'reset' })
      loadInstitutionsDomains(true)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!institutions) return
    setInstitutionsToShow(
      institutions.slice(pageSize * (page - 1), pageSize * (page - 1) + pageSize)
    )
  }, [page, institutions])

  useEffect(() => {
    loadInstitutionsDomains(true)
    loadCountryOptions()
  }, [isActive])

  return (
    <>
      <div className="institution-container">
        <div className="well search-forms">
          <div className="institution-search-form">
            <input
              type="text"
              name="institutionId"
              className="form-control input-sm"
              placeholder="Institution ID to Search"
              value={searchAddForm.institutionIdToSearch ?? ''}
              onChange={(e) => {
                if (!e.target.value?.trim()?.length) {
                  setPage(1)
                  loadInstitutionsDomains(true)
                }
                setSearchAddForm({ type: 'institutionIdToSearch', payload: e.target.value })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchInstitution()
                }
              }}
            />
            {/* <div className="search-button"> */}
            <button
              type="submit"
              className="btn btn-xs search-button"
              onClick={searchInstitution}
            >
              Search
            </button>
            {/* </div> */}
          </div>
          <div className="institution-add-form">
            <input
              type="text"
              name="institutionId"
              className="form-control input-sm"
              placeholder="Institution ID (the domain)"
              value={searchAddForm.id ?? ''}
              onChange={(e) => {
                setSearchAddForm({ type: 'id', payload: e.target.value })
              }}
            />
            <input
              type="text"
              name="institutionId"
              className="form-control input-sm"
              placeholder="Short Name"
              value={searchAddForm.shortname ?? ''}
              onChange={(e) => {
                setSearchAddForm({ type: 'shortname', payload: e.target.value })
              }}
            />
            <input
              type="text"
              name="institutionId"
              className="form-control input-sm"
              placeholder="Full Name"
              value={searchAddForm.fullname ?? ''}
              onChange={(e) => {
                setSearchAddForm({ type: 'fullname', payload: e.target.value })
              }}
            />
            <input
              type="text"
              name="institutionId"
              className="form-control input-sm"
              placeholder="Parent"
              value={searchAddForm.parent ?? ''}
              onChange={(e) => {
                setSearchAddForm({ type: 'parent', payload: e.target.value })
              }}
            />
            <input
              type="text"
              name="institutionId"
              className="form-control input-sm"
              placeholder="Domains"
              value={searchAddForm.domains ?? ''}
              onChange={(e) => {
                setSearchAddForm({ type: 'domains', payload: e.target.value })
              }}
            />
            <Dropdown
              options={countryOptions}
              onChange={(e) => {
                setSearchAddForm({
                  type: 'country',
                  payload: e,
                })
              }}
              value={
                countryOptions?.find((q) => q.value === searchAddForm.country?.value) ?? null
              }
              placeholder="Institution Country/Region"
              className="dropdown-select dropdown-sm"
              hideArrow
              isClearable
            />
            <input
              type="text"
              name="institutionId"
              className="form-control input-sm"
              placeholder="State/Province"
              value={searchAddForm.stateProvince ?? ''}
              onChange={(e) => {
                setSearchAddForm({ type: 'stateProvince', payload: e.target.value })
              }}
            />
            <input
              type="text"
              name="institutionId"
              className="form-control input-sm"
              placeholder="Web pages e.g. https://www.umass.edu"
              value={searchAddForm.webPages ?? ''}
              onChange={(e) => {
                setSearchAddForm({ type: 'webPages', payload: e.target.value })
              }}
            />
            <button type="submit" className="btn btn-xs add-button" onClick={addInstitution}>
              Add
            </button>
          </div>
        </div>
        <div>
          {institutionsToShow ? (
            <>
              <Table
                headings={[
                  { content: '', width: '8%' },
                  { content: 'Id', width: '15%' },
                  { content: 'Short Name', width: '25%' },
                  { content: 'Full Name', width: '25%' },
                  { content: 'Parent', width: '25%' },
                  { content: 'Domains', width: '15%' },
                ]}
              />
              {institutionsToShow.map((institutionDomain) => (
                <div className="institution-row" key={institutionDomain}>
                  <span className="col-actions">
                    {institutionDomain === institutionToEdit?.id ? (
                      <button type="button" className="btn btn-xs " onClick={saveInstitution}>
                        <Icon name="floppy-disk" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-xs "
                        onClick={() => {
                          getInstitutionDetails(institutionDomain)
                        }}
                      >
                        <Icon name="edit" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-xs btn-delete-institution"
                      onClick={() => {
                        deleteInstitution(institutionDomain)
                      }}
                    >
                      <Icon name="trash" />
                    </button>
                  </span>

                  {institutionDomain === institutionToEdit?.id ? (
                    <>
                      <span className="col-id">
                        <input
                          className="form-control input-sm"
                          value={institutionToEdit.id ?? ''}
                          onChange={() => {}}
                        />
                      </span>
                      <span className="col-short-name">
                        <input
                          className="form-control input-sm"
                          value={institutionToEdit.shortname ?? ''}
                          onChange={(e) => {
                            setInstitutionToEdit((p) => ({
                              ...p,
                              shortname: e.target.value,
                            }))
                          }}
                        />
                      </span>
                      <span className="col-full-name">
                        <input
                          className="form-control input-sm"
                          value={institutionToEdit.fullname ?? ''}
                          onChange={(e) => {
                            setInstitutionToEdit((p) => ({
                              ...p,
                              fullname: e.target.value,
                            }))
                          }}
                        />
                      </span>
                      <span className="col-parent">
                        <input
                          className="form-control input-sm"
                          value={institutionToEdit.parent ?? ''}
                          onChange={(e) => {
                            setInstitutionToEdit((p) => ({
                              ...p,
                              parent: e.target.value,
                            }))
                          }}
                        />
                      </span>
                      <span className="col-domains">
                        <input
                          className="form-control input-sm"
                          value={institutionToEdit.domains ?? ''}
                          onChange={(e) => {
                            setInstitutionToEdit((p) => ({
                              ...p,
                              domains: e.target.value,
                            }))
                          }}
                        />
                      </span>
                      <th key="empty" scope="col" style={{ width: '8%' }}></th>
                      <th key="country" scope="col" style={{ width: '20%' }}>
                        Country/Region
                      </th>
                      <th key="state" scope="col" style={{ width: '20%' }}>
                        State/Province
                      </th>
                      <th key="webpages" scope="col" style={{ width: '50%' }}>
                        Webpages
                      </th>
                      <span className="col-actions"></span>
                      <span className="col-country">
                        <Dropdown
                          options={countryOptions}
                          onChange={(e) => {
                            setInstitutionToEdit((p) => ({
                              ...p,
                              country: e?.label ?? null,
                              alphaTwoCode: e?.value ?? null,
                            }))
                          }}
                          value={
                            countryOptions?.find(
                              (q) => q.value === institutionToEdit.alphaTwoCode
                            ) ?? null
                          }
                          placeholder="Institution Country/Region"
                          className="dropdown-select dropdown-sm"
                          hideArrow
                          isClearable
                        />
                      </span>
                      <span className="col-state">
                        <input
                          className="form-control input-sm"
                          value={institutionToEdit.stateProvince ?? ''}
                          onChange={(e) => {
                            setInstitutionToEdit((p) => ({
                              ...p,
                              stateProvince: e.target.value,
                            }))
                          }}
                        />
                      </span>
                      <span className="col-webpages">
                        <input
                          className="form-control input-sm"
                          value={institutionToEdit.webPages ?? ''}
                          onChange={(e) => {
                            setInstitutionToEdit((p) => ({
                              ...p,
                              webPages: e.target.value,
                            }))
                          }}
                        />
                      </span>
                    </>
                  ) : (
                    <span className="col-id">{institutionDomain}</span>
                  )}
                </div>
              ))}
              {institutions.length === 0 ? (
                <p className="empty-message">No matching domains found.</p>
              ) : (
                <PaginationLinks
                  currentPage={page}
                  itemsPerPage={pageSize}
                  totalCount={institutions.length}
                  options={{ useShallowRouting: true }}
                  setCurrentPage={setPage}
                />
              )}
            </>
          ) : (
            <LoadSpinner inline />
          )}
        </div>
      </div>
    </>
  )
}

const TabMessageCount = ({ count }) => {
  if (!count) return null
  return (count > 0 || typeof count === 'string') && <span className="badge">{count}</span>
}

const Moderation = ({ appContext, accessToken, superUser }) => {
  const { setBannerHidden } = appContext
  const [nameDeletionRequestCount, setNameDeletionRequestCount] = useState(null)
  const [profileMergeRequestCount, setProfileMergeRequestCount] = useState(null)
  const [pendingVenueRequestCount, setPendingVenueRequestCount] = useState(null)
  const [activeTabId, setActiveTabId] = useState('#profiles')

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
          <Tab
            id="profiles"
            active={activeTabId === '#profiles' ? true : undefined}
            onClick={() => setActiveTabId('#profiles')}
          >
            User Moderation
          </Tab>
          <Tab
            id="email"
            active={activeTabId === '#email' ? true : undefined}
            onClick={() => setActiveTabId('#email')}
          >
            Email Delete Requests
          </Tab>
          <Tab
            id="name"
            active={activeTabId === '#name' ? true : undefined}
            onClick={() => setActiveTabId('#name')}
          >
            Name Delete Requests <TabMessageCount count={nameDeletionRequestCount} />
          </Tab>
          <Tab
            id="merge"
            active={activeTabId === '#merge' ? true : undefined}
            onClick={() => setActiveTabId('#merge')}
          >
            Profile Merge Requests <TabMessageCount count={profileMergeRequestCount} />
          </Tab>
          <Tab
            id="institution"
            active={activeTabId === '#institution' ? true : undefined}
            onClick={() => setActiveTabId('#institution')}
          >
            Institution List
          </Tab>
          <Tab
            id="requests"
            active={activeTabId === '#requests' ? true : undefined}
            onClick={() => setActiveTabId('#requests')}
          >
            Venue Requests <TabMessageCount count={pendingVenueRequestCount} />
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="profiles">
            <UserModerationTab accessToken={accessToken} />
          </TabPanel>
          <TabPanel id="email">
            <EmailDeletionTab accessToken={accessToken} isActive={activeTabId === '#email'} />
          </TabPanel>
          <TabPanel id="name">
            <NameDeletionTab
              accessToken={accessToken}
              setNameDeletionRequestCount={setNameDeletionRequestCount}
              isActive={activeTabId === '#name'}
            />
          </TabPanel>
          <TabPanel id="merge">
            <ProfileMergeTab
              accessToken={accessToken}
              superUser={superUser}
              setProfileMergeRequestCount={setProfileMergeRequestCount}
              isActive={activeTabId === '#merge'}
            />
          </TabPanel>
          <TabPanel id="institution">
            <InstitutionTab
              accessToken={accessToken}
              isActive={activeTabId === '#institution'}
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
  const [profileToReject, setProfileToReject] = useState(null)
  const [signedNotes, setSignedNotes] = useState(0)
  const [idsLoading, setIdsLoading] = useState([])
  const [descOrder, setDescOrder] = useState(true)
  const [pageSize, setPageSize] = useState(onlyModeration ? 200 : 15)
  const [profileToPreview, setProfileToPreview] = useState(null)
  const [lastPreviewedProfileId, setLastPreviewedProfileId] = useState(null)
  const modalId = `${onlyModeration ? 'new' : ''}-user-reject-modal`
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

    $(`#${modalId}`).modal('show')
  }

  const rejectUser = async (rejectionMessage) => {
    try {
      await api.post(
        '/profile/moderate',
        {
          id: profileToReject.id,
          decision: 'reject',
          reason: rejectionMessage,
        },
        { accessToken }
      )
      $(`#${modalId}`).modal('hide')
      if (profiles.length === 1 && pageNumber !== 1) {
        setPageNumber((p) => p - 1)
      }
      reload()
    } catch (error) {
      promptError(error.message, { scrollToTop: false })
    }
  }

  const blockUnblockUser = async (profile) => {
    if (!profile) return

    const actionIsBlock = profile.state !== 'Blocked'
    const signedAuthoredNotesCount = (await getSignedAuthoredNotesCount(profile.id)).length

    const noteCountMessage =
      !onlyModeration && actionIsBlock && signedAuthoredNotesCount
        ? `There ${inflect(signedAuthoredNotesCount, 'is', 'are', false)} ${inflect(
            signedAuthoredNotesCount,
            'note',
            'notes',
            true
          )} signed by this profile.`
        : ''
    // eslint-disable-next-line no-alert
    const confirmResult = window.confirm(
      `Are you sure you want to ${actionIsBlock ? 'block' : 'unblock'} ${
        profile.content?.names?.[0]?.fullname
      }?\n\n${noteCountMessage}`
    )
    if (confirmResult) {
      try {
        await api.post(
          '/profile/moderate',
          { id: profile.id, decision: actionIsBlock ? 'block' : 'unblock' },
          { accessToken }
        )
        if (profiles.length === 1 && pageNumber !== 1) {
          setPageNumber((p) => p - 1)
        }
      } catch (error) {
        promptError(error.message, { scrollToTop: false })
      }
      reload()
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
                        onClick={() => blockUnblockUser(profile)}
                      >
                        <Icon name="ban-circle" />
                        {'   '}
                        Block
                      </button>
                    </>
                  ) : (
                    <>
                      {profile.state === 'Needs Moderation' && (
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
                          onClick={() => blockUnblockUser(profile)}
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
        profileToReject={profileToReject}
        rejectUser={rejectUser}
        signedNotes={signedNotes}
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
        ]}
        showNextProfile={showNextProfile}
        acceptUser={acceptUser}
        blockUser={blockUnblockUser}
        setProfileToReject={setProfileToReject}
        rejectUser={rejectUser}
      />
    </div>
  )
}

export const RejectionModal = ({ id, profileToReject, rejectUser, signedNotes }) => {
  const [rejectionMessage, setRejectionMessage] = useState('')
  const selectRef = useRef(null)

  const currentInstitutionName = profileToReject?.content?.history?.find(
    (p) => !p.end || p.end >= new Date().getFullYear()
  )?.institution?.name

  const rejectionReasons = getRejectionReasons(currentInstitutionName)

  const updateMessageForPastRejectProfile = () => {
    setRejectionMessage(
      (p) =>
        `Submitting invalid info is a violation of OpenReview's Terms and Conditions (https://openreview.net/legal/terms) which may result in terminating your access to the system.\n\n${p}`
    )
  }

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

            <button className="btn btn-xs" onClick={updateMessageForPastRejectProfile}>
              Add Invalid Info Warning
            </button>

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
              Reason for rejecting {noteToReject.content.name?.value}:
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

export default withAdminAuth(Moderation)
