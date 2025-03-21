/* globals $: false */
/* globals view, view2: false */
/* globals Handlebars: false */
/* globals promptError: false */
/* globals promptMessage: false */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import cloneDeep from 'lodash/cloneDeep'
import Table from '../../components/Table'
import LoadingSpinner from '../../components/LoadingSpinner'
import Icon from '../../components/Icon'
import ErrorDisplay from '../../components/ErrorDisplay'
import BasicModal from '../../components/BasicModal'
import NoteContent from '../../components/NoteContent'
import ErrorAlert from '../../components/ErrorAlert'
import NoteEditor from '../../components/NoteEditor'
import PaginationLinks from '../../components/PaginationLinks'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import useQuery from '../../hooks/useQuery'
import useInterval from '../../hooks/useInterval'
import api from '../../lib/api-client'
import {
  prettyId,
  formatDateTime,
  cloneAssignmentConfigNote,
  cloneAssignmentConfigNoteV2,
} from '../../lib/utils'
import { getNoteContentValues } from '../../lib/forum-utils'
import { getEdgeBrowserUrl } from '../../lib/edge-utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

const ActionLink = ({ label, className, iconName, href, onClick, disabled }) => {
  if (href) {
    return (
      <Link href={href} className={`action-link ${className || ''}`} disabled={disabled}>
        <Icon name={iconName} />
        {label}
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
  apiVersion,
  handleEditConfiguration,
  handleViewConfiguration,
  handleCloneConfiguration,
  handleRunMatcher,
  handleDeployMatcher,
  handleUndeployMatcher,
  referrer,
  shouldShowDeployLink,
  preferredEmailInvitationId,
}) => {
  const [loading, setLoading] = useState(false)
  const noteContent = apiVersion === 2 ? getNoteContentValues(note.content) : note.content
  const edgeBrowserUrl = getEdgeBrowserUrl(noteContent, {
    version: apiVersion,
    preferredEmailInvitationId,
  })
  const edgeEditUrl = getEdgeBrowserUrl(noteContent, {
    editable: true,
    version: apiVersion,
    preferredEmailInvitationId,
  })
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
          onClick={() => handleEditConfiguration(note, apiVersion)}
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
          onClick={() => handleCloneConfiguration(note, apiVersion)}
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

const NewNoteEditorModal = ({
  editorNote,
  setEditorNote,
  configInvitation,
  assignmentNotes,
  getAssignmentNotes,
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
          getAssignmentNotes()
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

const Assignments = ({ appContext }) => {
  const { accessToken } = useLoginRedirect()
  const [configInvitation, setConfigInvitation] = useState(null)
  const [assignmentNotes, setAssignmentNotes] = useState(null)
  const [preferredEmailInvitationId, setPreferredEmailInvitationId] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [apiVersion, setApiVersion] = useState(null)
  const [error, setError] = useState(null)
  const [viewModalContent, setViewModalContent] = useState(null)
  const [editorNote, setEditorNote] = useState(null)
  const query = useQuery()
  const { setBannerContent } = appContext
  const newNoteEditor = configInvitation?.domain
  const pageSize = 25

  const shouldShowDeployLink =
    configInvitation?.content?.multiple_deployments?.value ||
    !assignmentNotes?.some((p) =>
      apiVersion === 2
        ? p?.content?.status?.value === 'Deployed'
        : p?.content?.status === 'Deployed'
    )

  // API functions
  const getPreferredEmailInvitationId = async (invitation) => {
    try {
      const domainGroup = await api.getGroupById(invitation.domain, accessToken)
      setPreferredEmailInvitationId(domainGroup?.content?.preferred_emails_id?.value)
    } catch (_) {
      /* empty */
    }
  }

  const getConfigInvitation = async () => {
    const notFoundMessage =
      'There is currently no assignment configuration ready for use. Please go to your venue request form and use the Paper Matching Setup to compute conflicts and/or affinity scores.'

    try {
      const invitation = await api.getInvitationById(
        `${query.group}/-/Assignment_Configuration`,
        accessToken
      )
      if (invitation) {
        setConfigInvitation(invitation)
        setApiVersion(invitation.apiVersion)
        getPreferredEmailInvitationId(invitation)
      } else {
        setError({
          statusCode: 404,
          message: notFoundMessage,
        })
      }
    } catch (apiError) {
      setError({
        statusCode: 404,
        message: notFoundMessage,
      })
    }
  }

  const getAssignmentNotes = async () => {
    try {
      const { notes, count } = await api.get(
        '/notes',
        {
          invitation: `${query.group}/-/Assignment_Configuration`,
          offset: pageSize * (currentPage - 1),
          limit: pageSize,
        },
        { accessToken, version: apiVersion }
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

    if (newNoteEditor) {
      setEditorNote(null)
      $('#new-note-editor-modal').modal({ backdrop: 'static' })
      return
    }

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
    const editorFunc = apiVersion === 2 ? view2.mkNewNoteEditor : view.mkNewNoteEditor
    editorFunc(configInvitation, null, null, null, {
      onNoteCreated: hideEditorModal,
      onNoteCancelled: hideEditorModal,
      onError: showDialogErrorMessage,
      onValidate: validateConfigNoteForm,
      onCompleted: appendEditorToModal,
    })
  }

  const handleEditConfiguration = (note, version) => {
    if (!configInvitation) return

    if (newNoteEditor) {
      setEditorNote(note)
      $('#new-note-editor-modal').modal({ backdrop: 'static' })
      return
    }

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
    const editorFunc = version === 2 ? view2.mkNoteEditor : view.mkNoteEditor
    editorFunc(note, configInvitation, null, {
      onNoteEdited: hideEditorModal,
      onNoteCancelled: hideEditorModal,
      onError: showDialogErrorMessage,
      onValidate: validateConfigNoteForm,
      onCompleted: appendEditorToModal,
    })
  }

  const handleCloneConfiguration = (note, version) => {
    if (!configInvitation) return

    if (newNoteEditor) {
      const clone = cloneAssignmentConfigNoteV2(note)
      setEditorNote(clone)
      $('#new-note-editor-modal').modal({ backdrop: 'static' })
      return
    }

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

    const clone =
      version === 2 ? cloneAssignmentConfigNoteV2(note) : cloneAssignmentConfigNote(note)
    const editorFunc = version === 2 ? view2.mkNoteEditor : view.mkNoteEditor
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

    getConfigInvitation()
  }, [accessToken, query])

  useEffect(() => {
    if (apiVersion) {
      getAssignmentNotes()
    }
  }, [apiVersion, currentPage])

  useEffect(() => {
    if (assignmentNotes) {
      $('[data-toggle="popover"]').popover({ container: '#content' })
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
                  apiVersion={apiVersion}
                  handleEditConfiguration={handleEditConfiguration}
                  handleViewConfiguration={handleViewConfiguration}
                  handleCloneConfiguration={handleCloneConfiguration}
                  handleRunMatcher={handleRunMatcher}
                  handleDeployMatcher={handleDeployMatcher}
                  handleUndeployMatcher={handleUndeployMatcher}
                  referrer={encodeURIComponent(
                    `[all assignments for ${prettyId(query?.group)}](/assignments?group=${
                      query?.group
                    })`
                  )}
                  shouldShowDeployLink={shouldShowDeployLink}
                  preferredEmailInvitationId={preferredEmailInvitationId}
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

      <NewNoteEditorModal
        editorNote={editorNote}
        configInvitation={configInvitation}
        setEditorNote={setEditorNote}
        assignmentNotes={assignmentNotes}
        getAssignmentNotes={getAssignmentNotes}
      />
    </>
  )
}

Assignments.bodyClass = 'assignments-list'

export default Assignments
