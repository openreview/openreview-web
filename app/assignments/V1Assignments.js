'use client'

/* globals $,view, Handlebars, promptError, promptMessage: false */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cloneAssignmentConfigNote, formatDateTime, prettyId } from '../../lib/utils'
import api from '../../lib/api-client'
import Table from '../../components/Table'
import LoadingSpinner from '../../components/LoadingSpinner'
import PaginationLinks from '../../components/PaginationLinks'
import { getEdgeBrowserUrl } from '../../lib/edge-utils'
import ActionLink from './ActionLink'
import ErrorDisplay from '../../components/ErrorDisplay'
import BasicModal from '../../components/BasicModal'
import NoteContent from '../../components/NoteContent'

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
}) => {
  const [loading, setLoading] = useState(false)
  const noteContent = note.content
  const edgeBrowserUrl = getEdgeBrowserUrl(noteContent, { version: 1 })
  const edgeEditUrl = getEdgeBrowserUrl(noteContent, { editable: true, version: 1 })
  const { status, error_message: errorMessage } = noteContent

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

export default function V1Assignments({ configInvitation, query, accessToken }) {
  const [assignmentNotes, setAssignmentNotes] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState(null)
  const [viewModalContent, setViewModalContent] = useState(null)
  const pageSize = 25

  const shouldShowDeployLink = !assignmentNotes?.some((p) => p?.content?.status === 'Deployed')

  const getAssignmentNotes = async () => {
    try {
      const { notes, count } = await api.get(
        '/notes',
        {
          invitation: `${query.group}/-/Assignment_Configuration`,
          offset: pageSize * (currentPage - 1),
          limit: pageSize,
        },
        { accessToken, version: 1 }
      )

      setAssignmentNotes(notes || [])
      setTotalCount(count || 0)
    } catch (apiError) {
      promptError(apiError.message)
    }
  }
  // Helper functions
  const hideEditorModal = () => {
    $('#note-editor-modal').modal('hide')
    getAssignmentNotes()
  }

  const appendEditorToModal = (editor) => {
    $('#note-editor-modal .modal-body').empty().addClass('legacy-styles').append(editor)
    view.hideNoteEditorFields('#note-editor-modal', [
      // To remove when all invitations have the following set to hidden true
      'config_invitation',
      'assignment_invitation',
      'error_message',
      'status',
    ])
  }

  const validateConfigNoteForm = (invitation, configContent, note) => {
    const errorList = []

    // Don't allow saving an existing note if its title matches that of some other in the list.
    const matchingNote = assignmentNotes.find((n) => {
      const idMatch = note ? n.id !== note.id : true
      return n.content.title === configContent.title && idMatch
    })
    if (matchingNote) {
      errorList.push('The configuration title must be unique within the conference')
    }

    // Make sure an equal number of scores and weights are provided
    if (
      configContent.scores_names &&
      configContent.scores_weights &&
      configContent.scores_names.length !== configContent.scores_weights.length
    ) {
      errorList.push('The scores and weights must have same number of values')
    }

    return errorList
  }

  const showDialogErrorMessage = (errors) => {
    $('#note-editor-modal .modal-body .alert-danger').remove()
    $('#note-editor-modal .modal-body').prepend(
      '<div class="alert alert-danger"><strong>Error:</strong> </div>'
    )
    if (errors?.length > 0) {
      $('#note-editor-modal .modal-body .alert-danger').append(errors.join(', '))
    } else {
      $('#note-editor-modal .modal-body .alert-danger').append(
        'Could not save assignment config note'
      )
    }
    $('#note-editor-modal').animate({ scrollTop: 0 }, 400)
  }

  // Handler functions
  const handleNewConfiguration = () => {
    if (!configInvitation) return

    $('#note-editor-modal').remove()
    $('main').append(
      Handlebars.templates.genericModal({
        id: 'note-editor-modal',
        extraClasses: 'modal-lg',
        showHeader: false,
        showFooter: false,
      })
    )
    $('#note-editor-modal').modal('show')
    const editorFunc = view.mkNewNoteEditor
    editorFunc(configInvitation, null, null, null, {
      onNoteCreated: hideEditorModal,
      onNoteCancelled: hideEditorModal,
      onError: showDialogErrorMessage,
      onValidate: validateConfigNoteForm,
      onCompleted: appendEditorToModal,
    })
  }

  const handleEditConfiguration = (note) => {
    if (!configInvitation) return

    $('#note-editor-modal').remove()
    $('main').append(
      Handlebars.templates.genericModal({
        id: 'note-editor-modal',
        extraClasses: 'modal-lg',
        showHeader: false,
        showFooter: false,
      })
    )
    $('#note-editor-modal').modal('show')
    const editorFunc = view.mkNoteEditor
    editorFunc(note, configInvitation, null, {
      onNoteEdited: hideEditorModal,
      onNoteCancelled: hideEditorModal,
      onError: showDialogErrorMessage,
      onValidate: validateConfigNoteForm,
      onCompleted: appendEditorToModal,
    })
  }

  const handleCloneConfiguration = (note) => {
    if (!configInvitation) return

    $('#note-editor-modal').remove()
    $('main').append(
      Handlebars.templates.genericModal({
        id: 'note-editor-modal',
        extraClasses: 'modal-lg',
        showHeader: false,
        showFooter: false,
      })
    )
    $('#note-editor-modal').modal('show')

    const clone = cloneAssignmentConfigNote(note)
    const editorFunc = view.mkNoteEditor
    editorFunc(clone, configInvitation, null, {
      onNoteEdited: hideEditorModal,
      onNoteCancelled: hideEditorModal,
      onError: showDialogErrorMessage,
      onValidate: validateConfigNoteForm,
      onCompleted: appendEditorToModal,
    })
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

  useEffect(() => {
    getAssignmentNotes()
  }, [configInvitation])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return (
    <>
      <header className="row">
        <div className="col-xs-12 col-md-9">
          <h1>{`${prettyId(query?.group)} Assignments`}</h1>
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
          {assignmentNotes ? (
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
                    `[all assignments for ${prettyId(query?.group)}](/assignments?group=${query?.group})`
                  )}
                  shouldShowDeployLink={shouldShowDeployLink}
                />
              ))}
            </Table>
          ) : (
            <LoadingSpinner inline />
          )}

          {assignmentNotes?.length === 0 && (
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
    </>
  )
}
