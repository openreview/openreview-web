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
  const [configNoteV2, setConfigNoteV2] = useState(null)

  const moderationDisabled = configNote?.content?.moderate === 'No'

  const getModerationStatus = async () => {
    try {
      const configNoteV1P = api.get(
        '/notes',
        {
          invitation: `${process.env.SUPER_USER}/Support/-/OpenReview_Config`,
          limit: 1,
        },
        { accessToken, version: 1 }
      )
      const configNoteV2P = api.get(
        '/notes',
        {
          invitation: `${process.env.SUPER_USER}/-/OpenReview_Config`,
          details: 'invitation',
          limit: 1,
        },
        { accessToken }
      )
      const results = await Promise.all([configNoteV1P, configNoteV2P])

      if (results?.[0]?.notes?.[0]) {
        setConfigNote(results?.[0]?.notes?.[0])
      } else {
        promptError('Moderation config could not be loaded')
      }
      if (results?.[1]?.notes?.[0]) {
        setConfigNoteV2(results?.[1]?.notes?.[0])
      } else {
        promptError('Moderation config could not be loaded for new API')
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
        { accessToken, version: 1 }
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
          invitationObj: configNoteV2.details.invitation,
          noteObj: configNoteV2,
        }),
        { accessToken }
      )
      await api.post(
        '/notes',
        {
          ...configNote,
          content: { ...configNote.content, terms_timestamp: currentTimeStamp },
        },
        { accessToken, version: 1 }
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
            {`Terms Timestamp is ${configNote?.content?.terms_timestamp ?? 'unset'}`}
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
        isCreatedInPastWeek: dayjs().diff(dayjs(p.tcdate), 'd') < 7,
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

      const venueNotDeployedInPastWeekCount = allVenueRequests.filter(
        (p) => !p.deployed && p.isCreatedInPastWeek
      ).length
      const venueWithUnrepliedCommentCount = allVenueRequests.filter(
        (p) => p.unrepliedPcComments.length > 0
      ).length
      setPendingVenueRequestCount(
        getVenueTabCountMessage(
          venueWithUnrepliedCommentCount,
          venueNotDeployedInPastWeekCount
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
                      href={`/profile?id=${note.content.profile_id}`}
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
  const [signedNotes, setSignedNotes] = useState(0)
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
    'Merged',
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

  const showRejectionModal = async (profileId) => {
    if (!onlyModeration) {
      const signedAuthoredNotes = await getSignedAuthoredNotesCount(profileId)
      setSignedNotes(signedAuthoredNotes)
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
    try {
      await api.put(
        '/groups/members',
        {
          id: `${process.env.SUPER_USER}/Support/SDN_Profiles/Exceptions`,
          members: [profileId],
        },
        { accessToken, version: 1 }
      )
      promptMessage(`${profileId} is added to SDN exception group`)
    } catch (error) {
      promptError(error.message)
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
                    {name.fullname}
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
                      {!(
                        profile.state === 'Blocked' ||
                        profile.state === 'Limited' ||
                        profile.ddate
                      ) && (
                        <button
                          type="button"
                          className="btn btn-xs"
                          onClick={() => showRejectionModal(profile.id)}
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
        ]}
      />
    </div>
  )
}

const RejectionModal = ({ id, profileIdToReject, rejectUser, signedNotes }) => {
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
