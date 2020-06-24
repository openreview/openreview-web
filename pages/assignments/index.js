/* globals $: false */
/* globals view: false */
/* globals Handlebars: false */
/* globals promptError: false */
/* globals promptMessage: false */

import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import Router from 'next/router'
import withError from '../../components/withError'
import UserContext from '../../components/UserContext'
import Table from '../../components/Table'
import LoadingSpinner from '../../components/LoadingSpinner'
import Icon from '../../components/Icon'
import useInterval from '../../hooks/useInterval'
import { auth } from '../../lib/auth'
import api from '../../lib/api-client'
import {
  prettyId, formatDateTime, getEdgeBrowserUrl, cloneAssignmentConfigNote,
} from '../../lib/utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

import '../../styles/pages/assignments.less'

const ActionLink = ({
  label, className, iconName, href, onClick, disabled,
}) => {
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
  note, configInvitation, handleEditConfiguration, handleCloneConfiguration, handleRunMatcher, referrer,
}) => {
  const edgeBrowserUrl = getEdgeBrowserUrl(note.content)
  const { status, error_message: errorMessage } = note.content

  return (
    <tr>
      <td>{note.number}</td>

      <td className="assignment-label" style={{ overflow: 'hidden' }}>
        <Link href={edgeBrowserUrl}>
          <a disabled={edgeBrowserUrl ? null : true}>
            {note.content.title ? note.content.title : note.content.label}
          </a>
        </Link>
      </td>

      <td>{formatDateTime(note.tcdate)}</td>

      <td>{note.tmdate === note.tcdate ? null : formatDateTime(note.tmdate)}</td>

      <td>
        {(status === 'Error' || status === 'No Solution') ? (
          <span className="assignment-status" data-toggle="tooltip" data-placement="top" title={errorMessage}>
            {status}
          </span>
        ) : (
          <span className="assignment-status">{status}</span>
        )}
      </td>

      <td>
        <ActionLink
          label="Edit"
          iconName="pencil"
          onClick={() => handleEditConfiguration(note)}
          disabled={status === 'Running' || !configInvitation}
        />
        <ActionLink
          label="Copy"
          iconName="duplicate"
          onClick={() => handleCloneConfiguration(note)}
          disabled={!configInvitation}
        />
      </td>

      <td className="assignment-actions">
        {(status === 'Initialized' || status === 'Error' || status === 'No Solution') && (
          <ActionLink label="Run Matcher" iconName="cog" onClick={() => handleRunMatcher(note.id)} />
        )}
        {(status === 'Complete' || status === 'Deployed') && (
          <>
            <ActionLink label="Browse Assignments" iconName="eye-open" href={edgeBrowserUrl} disabled={!edgeBrowserUrl} />
            <ActionLink label="View Statistics" iconName="stats" href={`/assignments/stats?id=${note.id}&referrer=${referrer}`} />
          </>
        )}
        {status === 'Complete' && (
          <ActionLink label="Deploy Assignment" iconName="share" onClick={() => {}} disabled />
        )}
      </td>
    </tr>
  )
}

const Assignments = ({ groupId, referrer, appContext }) => {
  const [assignmentNotes, setAssignmentNotes] = useState(null)
  const [configInvitation, setConfigInvitation] = useState(null)
  const { accessToken } = useContext(UserContext)
  const { setBannerContent, clientJsLoading } = appContext
  const referrerStr = encodeURIComponent(`[all assignments for ${prettyId(groupId)}](/assignments?group=${groupId})`)

  // API functions
  const getAssignmentNotes = async () => {
    try {
      const { notes } = await api.get('/notes', {
        invitation: `${groupId}/-/Assignment_Configuration`,
      }, { accessToken })

      setAssignmentNotes(notes || [])
    } catch (error) {
      promptError(error.message)
    }
  }

  const getConfigInvitation = async () => {
    try {
      const { invitations } = await api.get('/invitations', {
        id: `${groupId}/-/Assignment_Configuration`,
      }, { accessToken })
      if (invitations?.length > 0) {
        setConfigInvitation(invitations[0])
      }
    } catch (error) {
      promptError(error.details)
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
      'config_invitation', 'assignment_invitation', 'error_message', 'status',
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
    if (configContent.scores_names && configContent.scores_weights
      && configContent.scores_names.length !== configContent.scores_weights.length) {
      errorList.push('The scores and weights must have same number of values')
    }

    return errorList
  }

  const showDialogErrorMessage = (errors) => {
    $('#note-editor-modal .modal-body .alert-danger').remove()
    $('#note-editor-modal .modal-body').prepend('<div class="alert alert-danger"><strong>Error:</strong> </div>')
    if (errors?.length > 0) {
      $('#note-editor-modal .modal-body .alert-danger').append(errors.join(', '))
    } else {
      $('#note-editor-modal .modal-body .alert-danger').append('Could not save assignment config note')
    }
    $('#note-editor-modal').animate({ scrollTop: 0 }, 400)
  }

  // Handler functions
  const handleNewConfiguration = () => {
    if (!configInvitation) return

    $('#note-editor-modal').remove()
    $('main').append(Handlebars.templates.genericModal({
      id: 'note-editor-modal',
      extraClasses: 'modal-lg',
      showHeader: true,
      title: 'New Configuration',
      showFooter: false,
    }))

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
    $('main').append(Handlebars.templates.genericModal({
      id: 'note-editor-modal',
      extraClasses: 'modal-lg',
      showHeader: true,
      title: 'Edit Configuration',
      showFooter: false,
    }))
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
    $('main').append(Handlebars.templates.genericModal({
      id: 'note-editor-modal',
      extraClasses: 'modal-lg',
      showHeader: true,
      title: 'Copy Configuration',
      showFooter: false,
    }))
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

  const handleRunMatcher = async (id) => {
    try {
      const apiRes = await api.post('/match', { configNoteId: id }, { accessToken })
      promptMessage('Matching started. The status of the assignments will be updated when the matching process is complete')
    } catch (error) {
      promptError(error.message)
    }
  }

  // Effects
  useEffect(() => {
    if (clientJsLoading || !accessToken) return

    if (referrer) {
      setBannerContent(referrerLink(referrer))
    } else {
      setBannerContent(venueHomepageLink(groupId))
    }

    getAssignmentNotes()
    getConfigInvitation()
  }, [clientJsLoading, accessToken])

  useEffect(() => {
    if (assignmentNotes) {
      $('[data-toggle="tooltip"]').tooltip()
    }
  }, [assignmentNotes])

  useInterval(() => {
    getAssignmentNotes()
  }, 5000)

  return (
    <>
      <Head>
        <title key="title">{`${prettyId(groupId)} Assignments | OpenReview`}</title>
      </Head>

      <header className="row">
        <div className="col-xs-12 col-md-9">
          <h1>{`${prettyId(groupId)} Assignments`}</h1>
        </div>
        <div className="col-xs-12 col-md-3 text-right">
          <button type="button" className="btn" disabled={!configInvitation} onClick={handleNewConfiguration}>
            New Assignment Configuration
          </button>
        </div>
      </header>

      <div className="row">
        <div className="col-xs-12">
          {assignmentNotes ? (
            <Table
              className="table-hover assignments-table"
              headings={[
                { content: '#', width: '40px' },
                { content: 'Title' },
                { content: 'Created On', width: '200px' },
                { content: 'Last Modified', width: '200px' },
                { content: 'Status', width: '115px' },
                { content: 'Parameters', width: '115px' },
                { content: 'Actions', width: '175px' },
              ]}
            >
              {assignmentNotes.map(assignmentNote => (
                <AssignmentRow
                  key={assignmentNote.id}
                  note={assignmentNote}
                  configInvitation={configInvitation}
                  handleEditConfiguration={handleEditConfiguration}
                  handleCloneConfiguration={handleCloneConfiguration}
                  handleRunMatcher={handleRunMatcher}
                  referrer={referrerStr}
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
    </>
  )
}

Assignments.getInitialProps = async (ctx) => {
  const { group: groupId, referrer } = ctx.query
  if (!groupId) {
    return { statusCode: 404, message: 'Could not list generated assignments. Missing parameter group.' }
  }

  const { user } = auth(ctx)
  if (!user) {
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` }).end()
    } else {
      Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
    }
  }

  return { groupId, referrer }
}

Assignments.bodyClass = 'assignments-list'

export default withError(Assignments)
