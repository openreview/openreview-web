/* globals $: false */
/* globals view: false */
/* globals Handlebars: false */
/* globals promptError: false */
/* globals promptMessage: false */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import Table from '../../components/Table'
import LoadingSpinner from '../../components/LoadingSpinner'
import Icon from '../../components/Icon'
import ErrorDisplay from '../../components/ErrorDisplay'
import BasicModal from '../../components/BasicModal'
import NoteContent from '../../components/NoteContent'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import useQuery from '../../hooks/useQuery'
import useInterval from '../../hooks/useInterval'
import api from '../../lib/api-client'
import { prettyId, formatDateTime, cloneAssignmentConfigNote } from '../../lib/utils'
import { getEdgeBrowserUrl } from '../../lib/edge-utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

const ActionLink = ({ label, className, iconName, href, onClick, disabled }) => {
  if (href) {
    return (
      <Link href={href}>
        <a className={`action-link ${className || ''}`} disabled={disabled}>
          <Icon name={iconName} />
          {label}
        </a>
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={`btn btn-link ${className || ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={iconName} />
      {label}
    </button>
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
  referrer,
  shouldRemoveDeployLink,
}) => {
  const edgeBrowserUrl = getEdgeBrowserUrl(note.content)
  const edgeEditUrl = getEdgeBrowserUrl(note.content, { editable: true })
  const { status, error_message: errorMessage } = note.content

  return (
    <tr>
      <td>{note.number}</td>

      <td className="assignment-label">
        <Link href={edgeBrowserUrl}>
          <a disabled={edgeBrowserUrl ? null : true}>
            {note.content.title ? note.content.title : note.content.label}
          </a>
        </Link>
      </td>

      <td>{formatDateTime(note.tcdate)}</td>

      <td>{note.tmdate === note.tcdate ? null : formatDateTime(note.tmdate)}</td>

      <td>
        {['Error', 'No Solution', 'Deployment Error'].includes(status) ? (
          <span
            className="assignment-status"
            data-toggle="tooltip"
            data-placement="top"
            title={errorMessage}
          >
            {status}
          </span>
        ) : (
          <span className="assignment-status">{status}</span>
        )}
      </td>

      <td>
        <ActionLink
          label="View"
          iconName="info-sign"
          onClick={() => handleViewConfiguration(note)}
          disabled={!configInvitation}
        />
        <ActionLink
          label="Edit"
          iconName="pencil"
          onClick={() => handleEditConfiguration(note)}
          disabled={
            ['Running', 'Complete', 'Deploying', 'Deployed', 'Deployment Error'].includes(
              status
            ) || !configInvitation
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
        {['Initialized', 'Error', 'No Solution'].includes(status) && (
          <ActionLink
            label="Run Matcher"
            iconName="cog"
            onClick={() => handleRunMatcher(note.id)}
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
        {['Deployed'].includes(status) && (
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
          </>
        )}
        {['Complete', 'Deployment Error'].includes(status) && !shouldRemoveDeployLink && (
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

const Assignments = ({ appContext }) => {
  const { accessToken } = useLoginRedirect()
  const [assignmentNotes, setAssignmentNotes] = useState(null)
  const [configInvitation, setConfigInvitation] = useState(null)
  const [error, setError] = useState(null)
  const [viewModalContent, setViewModalContent] = useState(null)
  const query = useQuery()
  const { setBannerContent } = appContext

  const shouldRemoveDeployLink = assignmentNotes?.some(
    (p) => p?.content?.status === 'Deployed'
  )

  // API functions
  const getAssignmentNotes = async () => {
    try {
      const { notes } = await api.get(
        '/notes',
        {
          invitation: `${query.group}/-/Assignment_Configuration`,
        },
        { accessToken }
      )

      setAssignmentNotes(notes || [])
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const getConfigInvitation = async () => {
    try {
      const { invitations } = await api.get(
        '/invitations',
        {
          id: `${query.group}/-/Assignment_Configuration`,
        },
        { accessToken }
      )
      if (invitations?.length > 0) {
        setConfigInvitation(invitations[0])
      }
    } catch (apiError) {
      setError({
        statusCode: 404,
        message: 'Could not list assignments. Invitation not found.',
      })
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
    view.mkNewNoteEditor(configInvitation, null, null, null, {
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

    view.mkNoteEditor(note, configInvitation, null, {
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
    view.mkNoteEditor(clone, configInvitation, null, {
      onNoteEdited: hideEditorModal,
      onNoteCancelled: hideEditorModal,
      onError: showDialogErrorMessage,
      onValidate: validateConfigNoteForm,
      onCompleted: appendEditorToModal,
    })
  }

  const handleViewConfiguration = (note) => {
    if (note.id !== viewModalContent?.id) {
      setViewModalContent({
        id: note.id,
        title: note.content.title || note.content.label,
        content: note.content,
      })
    }

    $('#note-view-modal').modal('show')
  }

  const handleRunMatcher = async (id) => {
    try {
      const apiRes = await api.post('/match', { configNoteId: id }, { accessToken })
      promptMessage(
        'Matching started. The status of the assignments will be updated when the matching process is complete'
      )
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  const handleDeployMatcher = async (id) => {
    try {
      const apiRes = await api.post('/deploy', { configNoteId: id }, { accessToken })
      promptMessage('Deployment started.')
    } catch (apiError) {
      promptError(apiError.message)
    }
  }

  // Effects
  useEffect(() => {
    if (!accessToken || !query) return

    if (!query.group) {
      setError({
        statusCode: 404,
        message: 'Could not list assignments. Missing parameter group.',
      })
    }

    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      setBannerContent(venueHomepageLink(query.group))
    }

    getAssignmentNotes()
    getConfigInvitation()
  }, [accessToken, query])

  useEffect(() => {
    if (assignmentNotes) {
      $('[data-toggle="tooltip"]').tooltip()
    }
  }, [assignmentNotes])

  useInterval(() => {
    getAssignmentNotes()
  }, 5000)

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return (
    <>
      <Head>
        <title key="title">{`${prettyId(query?.group)} Assignments | OpenReview`}</title>
      </Head>

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
                  referrer={encodeURIComponent(
                    `[all assignments for ${prettyId(query?.group)}](/assignments?group=${
                      query?.group
                    })`
                  )}
                  shouldRemoveDeployLink={shouldRemoveDeployLink}
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

Assignments.bodyClass = 'assignments-list'

export default Assignments
