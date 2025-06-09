'use client'

/* globals $, promptMessage, promptError: false */
import { useEffect, useState } from 'react'
import { cloneDeep } from 'lodash'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cloneAssignmentConfigNoteV2, formatDateTime, prettyId } from '../../lib/utils'
import BasicModal from '../../components/BasicModal'
import LoadingSpinner from '../../components/LoadingSpinner'
import NoteContent from '../../components/NoteContent'
import ErrorAlert from '../../components/ErrorAlert'
import NoteEditor from '../../components/NoteEditor'
import Table from '../../components/Table'
import ActionLink from './ActionLink'
import { getNoteContentValues } from '../../lib/forum-utils'
import { getEdgeBrowserUrl } from '../../lib/edge-utils'
import api from '../../lib/api-client'
import PaginationLinks from '../../components/PaginationLinks'
import useSocket from '../../hooks/useSocket'

const NewNoteEditorModal = ({
  editorNote,
  setEditorNote,
  configInvitation,
  assignmentNotes,
}) => {
  const [errorMessage, setErrorMessage] = useState(null)

  const invitationWithHiddenFields = cloneDeep(configInvitation)
  const fieldsToHide = [
    'config_invitation',
    'assignment_invitation',
    'error_message',
    'status',
  ]
  fieldsToHide.forEach((p) => {
    const fieldDescription = invitationWithHiddenFields?.edit?.note?.content?.[p]?.value?.param
    if (fieldDescription) {
      fieldDescription.hidden = true
    }
  })

  const closeModal = () => {
    $('#new-note-editor-modal').modal('hide')
    $('.modal-backdrop').remove()
  }

  const validator = (formData) => {
    const noteWithMatchingTitle = assignmentNotes.find(
      (p) =>
        p.content.title.value === formData.title && (!editorNote || p.id !== editorNote.id)
    )
    if (noteWithMatchingTitle) {
      return {
        isValid: false,
        errorMessage: 'The configuration title must be unique within the conference',
      }
    }
    return { isValid: true }
  }

  if (!configInvitation) return null

  return (
    <BasicModal
      id="new-note-editor-modal"
      options={{ hideFooter: true, extraClasses: 'modal-lg' }}
      onClose={() => {
        setEditorNote(null)
        setErrorMessage(null)
      }}
    >
      {errorMessage && <ErrorAlert error={{ message: errorMessage }} />}

      <NoteEditor
        key={editorNote?.content?.title?.value || 'new-note'}
        note={editorNote}
        invitation={invitationWithHiddenFields}
        closeNoteEditor={() => {
          closeModal()
        }}
        onNoteCreated={() => {
          closeModal()
          promptMessage('Note updated successfully')
          window.location.reload()
        }}
        setErrorAlertMessage={(msg) => {
          setErrorMessage(msg)
          $('#new-note-editor-modal').animate({ scrollTop: 0 }, 400)
        }}
        customValidator={validator}
      />
    </BasicModal>
  )
}

const AssignmentRow = ({
  note,
  configInvitation,
  handleEditConfiguration,
  handleViewConfiguration,
  handleCloneConfiguration,
  handleRunMatcher,
  handleDeployMatcher,
  handleUndeployMatcher,
  referrer,
  shouldShowDeployLink,
  preferredEmailInvitationId,
  handleConfigNoteUpdate,
}) => {
  const statusToCheck = ['Running', 'Queued', 'Deploying', 'Undeploying']
  const [loading, setLoading] = useState(false)
  const noteContent = getNoteContentValues(note.content)
  const events = useSocket(
    statusToCheck.includes(noteContent.status) ? 'note' : undefined,
    ['edit-upserted'],
    {
      id: note.id,
    }
  )
  const edgeBrowserUrl = getEdgeBrowserUrl(noteContent, {
    version: 2,
    preferredEmailInvitationId,
  })
  const edgeEditUrl = getEdgeBrowserUrl(noteContent, {
    editable: true,
    version: 2,
    preferredEmailInvitationId,
  })
  const { status, error_message: errorMessage } = noteContent

  useEffect(() => {
    if (!events) return
    handleConfigNoteUpdate(events.data?.noteId)
  }, [events?.uniqueId])

  return (
    <tr>
      <td>{note.number}</td>

      <td className="assignment-label">
        <Link href={edgeBrowserUrl} disabled={edgeBrowserUrl ? null : true}>
          {noteContent.title ? noteContent.title : noteContent.label}
        </Link>
      </td>

      <td>{formatDateTime(note.tcdate)}</td>

      <td>{note.tmdate === note.tcdate ? null : formatDateTime(note.tmdate)}</td>

      <td>
        {['Error', 'No Solution', 'Deployment Error', 'Undeployment Error'].includes(
          status
        ) ? (
          <>
            <strong>{status}</strong>
            <br />
            <a
              tabIndex="0"
              role="button"
              className="assignment-status"
              data-toggle="popover"
              data-placement="top"
              data-trigger="foucus"
              data-content={errorMessage}
              title="Error Details"
            >
              View Details
            </a>
          </>
        ) : (
          <span className="assignment-status">{status}</span>
        )}
      </td>

      <td>
        <ActionLink
          label="View"
          iconName="info-sign"
          onClick={() => handleViewConfiguration(note.id, noteContent)}
          disabled={!configInvitation}
        />
        <ActionLink
          label="Edit"
          iconName="pencil"
          onClick={() => handleEditConfiguration(note)}
          disabled={
            [
              'Running',
              'Complete',
              'Deploying',
              'Deployed',
              'Deployment Error',
              'Undeploying',
              'Undeployment Error',
            ].includes(status) || !configInvitation
          }
        />
        <ActionLink
          label="Copy"
          iconName="duplicate"
          onClick={() => handleCloneConfiguration(note)}
          disabled={!configInvitation}
        />
      </td>

      <td className="assignment-actions">
        {['Initialized', 'Error', 'No Solution', 'Cancelled'].includes(status) && (
          <ActionLink
            label="Run Matcher"
            iconName="cog"
            onClick={(e) => {
              setLoading(true)
              handleRunMatcher(note.id).then(() => setLoading(false))
            }}
            disabled={loading}
          />
        )}
        {['Complete', 'Deploying', 'Deployment Error'].includes(status) && (
          <>
            <ActionLink
              label="Browse Assignments"
              iconName="eye-open"
              href={edgeBrowserUrl}
              disabled={!edgeBrowserUrl}
            />
            <ActionLink
              label="View Statistics"
              iconName="stats"
              href={`/assignments/stats?id=${note.id}&referrer=${referrer}`}
            />
          </>
        )}
        {['Deployed', 'Undeployment Error'].includes(status) && (
          <>
            <ActionLink
              label="Edit Assignments "
              iconName="random"
              href={edgeEditUrl}
              disabled={!edgeEditUrl}
            />
            <ActionLink
              label="View Statistics"
              iconName="stats"
              href={`/assignments/stats?id=${note.id}&referrer=${referrer}`}
            />
            <ActionLink
              label="Undeploy Assignment"
              iconName="share"
              onClick={() => handleUndeployMatcher(note.id)}
            />
          </>
        )}
        {['Complete', 'Deployment Error'].includes(status) && shouldShowDeployLink && (
          <ActionLink
            label="Deploy Assignment"
            iconName="share"
            onClick={() => handleDeployMatcher(note.id)}
          />
        )}
      </td>
    </tr>
  )
}

const pageSize = 25

export default function V2Assignments({
  configInvitation,
  accessToken,
  preferredEmailInvitationId,
}) {
  const [allConfigNotes, setAllConfigNotes] = useState([])
  const [assignmentNotes, setAssignmentNotes] = useState([])
  const [totalCount, setTotalCount] = useState(null)
  const [viewModalContent, setViewModalContent] = useState(null)
  const [editorNote, setEditorNote] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const query = useSearchParams()
  const group = query.get('group')

  const shouldShowDeployLink =
    configInvitation?.content?.multiple_deployments?.value ||
    !assignmentNotes?.some((p) => p?.content?.status?.value === 'Deployed')

  const getAssignmentNotes = async () => {
    try {
      const { notes, count } = await api.get(
        '/notes',
        {
          invitation: `${group}/-/Assignment_Configuration`,
        },
        { accessToken, version: 2 }
      )
      setAllConfigNotes(notes || [])
      setTotalCount(count || 0)
    } catch (error) {
      promptError(error.message)
    }
  }

  const handleNewConfiguration = () => {
    setEditorNote(null)
    $('#new-note-editor-modal').modal({ backdrop: 'static' })
  }

  const handleEditConfiguration = (note) => {
    setEditorNote(note)
    $('#new-note-editor-modal').modal({ backdrop: 'static' })
  }

  const handleCloneConfiguration = (note) => {
    const clone = cloneAssignmentConfigNoteV2(note)
    setEditorNote(clone)
    $('#new-note-editor-modal').modal({ backdrop: 'static' })
  }

  const handleViewConfiguration = (noteId, noteContent) => {
    if (noteId !== viewModalContent?.id) {
      setViewModalContent({
        id: noteId,
        title: noteContent.title || noteContent.label,
        content: noteContent,
      })
    }

    $('#note-view-modal').modal('show')
  }

  const handleRunMatcher = async (id) => {
    try {
      await api.post('/match', { configNoteId: id }, { accessToken })
      promptMessage(
        'Matching started. The status of the assignments will be updated when the matching process is complete'
      )
      getAssignmentNotes()
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const handleDeployMatcher = async (id) => {
    try {
      await api.post('/deploy', { configNoteId: id }, { accessToken })
      promptMessage('Deployment started.')
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const handleUndeployMatcher = async (id) => {
    try {
      await api.post('/undeploy', { configNoteId: id }, { accessToken })
      promptMessage('Undeployment started.')
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const handleConfigNoteUpdate = async (noteId) => {
    if (!noteId) return
    try {
      const updatedConfigNote = await api.getNoteById(noteId, accessToken)
      setAssignmentNotes((notes) =>
        notes.map((note) => (note.id === noteId ? updatedConfigNote : note))
      )
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    setAssignmentNotes(
      allConfigNotes.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    )
  }, [allConfigNotes, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [allConfigNotes])

  useEffect(() => {
    getAssignmentNotes()
  }, [configInvitation])

  return (
    <>
      <header className="row">
        <div className="col-xs-12 col-md-9">
          <h1>{`${prettyId(group)} Assignments`}</h1>
        </div>
        <div className="col-xs-12 col-md-3 text-right">
          <button
            type="button"
            className="btn"
            disabled={!configInvitation}
            onClick={handleNewConfiguration}
          >
            New Assignment Configuration
          </button>
        </div>
      </header>
      <div className="row">
        <div className="col-xs-12 horizontal-scroll">
          <Table
            className="table-hover assignments-table"
            headings={[
              { content: '#', width: '40px' },
              { content: 'Title' },
              { content: 'Created On', width: '185px' },
              { content: 'Last Modified', width: '185px' },
              { content: 'Status', width: '110px' },
              { content: 'Parameters', width: '110px' },
              { content: 'Actions', width: '175px' },
            ]}
          >
            {assignmentNotes.map((assignmentNote) => (
              <AssignmentRow
                key={assignmentNote.id}
                note={assignmentNote}
                configInvitation={configInvitation}
                handleEditConfiguration={handleEditConfiguration}
                handleViewConfiguration={handleViewConfiguration}
                handleCloneConfiguration={handleCloneConfiguration}
                handleRunMatcher={handleRunMatcher}
                handleDeployMatcher={handleDeployMatcher}
                handleUndeployMatcher={handleUndeployMatcher}
                referrer={encodeURIComponent(
                  `[all assignments for ${prettyId(group)}](/assignments?group=${group})`
                )}
                shouldShowDeployLink={shouldShowDeployLink}
                preferredEmailInvitationId={preferredEmailInvitationId}
                handleConfigNoteUpdate={handleConfigNoteUpdate}
              />
            ))}
          </Table>
          {totalCount === 0 && (
            <p className="empty-message">
              No assignments have been generated for this venue. Click the New Assignment
              button above to get started.
            </p>
          )}

          <PaginationLinks
            setCurrentPage={setCurrentPage}
            totalCount={totalCount}
            itemsPerPage={pageSize}
            currentPage={currentPage}
          />
        </div>
      </div>
      <BasicModal
        id="note-view-modal"
        title={viewModalContent?.title}
        cancelButtonText="Done"
        primaryButtonText={null}
      >
        {viewModalContent ? (
          <NoteContent
            id={viewModalContent.id}
            content={viewModalContent.content}
            invitation={configInvitation}
          />
        ) : (
          <LoadingSpinner inline />
        )}
      </BasicModal>
      <NewNoteEditorModal
        editorNote={editorNote}
        configInvitation={configInvitation}
        setEditorNote={setEditorNote}
        assignmentNotes={assignmentNotes}
      />
    </>
  )
}
