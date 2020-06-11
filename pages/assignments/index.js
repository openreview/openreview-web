/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable consistent-return */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* globals $: false */
/* globals promptError: false */
import {
  useContext, useEffect, useState, useRef,
} from 'react'
import { useRouter } from 'next/router'
import withError from '../../components/withError'
import UserContext from '../../components/UserContext'
import api from '../../lib/api-client'
import {
  prettyId,
  formatDateTime,
  getEdgeBrowserUrl,
} from '../../lib/utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import {
  // eslint-disable-next-line max-len
  editNewConfig, editExistingConfig, editClonedConfig, setLegacyAssignmentNotes, setLegacyConfigInvitation, runMatcher, setUpdateAssignment,
} from '../../client/assignments'
import Icon from '../../components/Icon'
import useInterval from '../../hooks/useInterval'

import '../../styles/pages/assignments.less'

const Assignments = ({
  groupId,
  referrer,
  pathName,
  search,
  appContext,
}) => {
  const { setBannerContent, clientJsLoading } = appContext
  const { accessToken } = useContext(UserContext)

  const [assignmentNotes, setAssignmentNotes] = useState(null)
  const router = useRouter()

  const getAssignmentNotes = async () => {
    try {
      const result = await api.get('/notes', { invitation: `${groupId}/-/Assignment_Configuration` }, { accessToken })
      // eslint-disable-next-line arrow-body-style
      setAssignmentNotes(result.notes.map((note) => {
        // eslint-disable-next-line no-param-reassign
        note.scoresSpecParams = note.content.scores_specification ? Object.keys(note.content.scores_specification).join(',') : []
        return note
      }))
      // eslint-disable-next-line arrow-body-style
      setLegacyAssignmentNotes(result.notes.map((note) => {
        // eslint-disable-next-line no-param-reassign
        note.scoresSpecParams = note.content.scores_specification ? Object.keys(note.content.scores_specification).join(',') : []
        return note
      }))
    } catch (error) {
      promptError(error.message)
    }
  }

  const getConfigInvitation = async () => {
    try {
      const result = await api.get('/invitations', { id: `${groupId}/-/Assignment_Configuration` }, { accessToken })
      setLegacyConfigInvitation(result.invitations[0])
    } catch (error) {
      promptError(error.message)
      if (error.message === 'Forbidden') { // TODO: may need to update when error format is confirmed
        router.push(`/login?redirect=/assignments?group=${groupId}`)
      }
    }
  }

  const handleNewConfigurationButtonClick = () => {
    editNewConfig()
  }

  const handleEditConfigurationButtonClick = (id) => {
    editExistingConfig(id)
  }

  const handleCloneConfigurationButtonClick = (id) => {
    editClonedConfig(id)
  }

  const handleRunMatcherClick = async (id) => {
    try {
      const result = await api.post('/match', { configNoteId: id }, { accessToken })
    } catch (error) {
      promptError(error.message)
    }
  }

  const getReferrerStr = () => encodeURIComponent(
    `[all assignments for '${prettyId(groupId)}](${pathName}${search} + ${window.location.hash})`,
  )

  useInterval(() => {
    getAssignmentNotes()
  }, 500000)

  useEffect(() => {
    setUpdateAssignment(getAssignmentNotes)
  }, [])

  useEffect(() => {
    if (!clientJsLoading && accessToken) {
      if (referrer) {
        setBannerContent(referrerLink(referrer))
      } else {
        setBannerContent(venueHomepageLink(groupId, 'edit'))
      }
    }
    getAssignmentNotes()
    getConfigInvitation()
  }, [clientJsLoading, accessToken])

  useEffect(() => {
    $('[data-toggle="tooltip"]').tooltip()
  }, [assignmentNotes])

  const ConfigurationNoteStatus = ({ content }) => {
    switch (content.status) {
      case 'Error':
        return <span className="assignment-status" data-toggle="tooltip" data-placement="top" title={content.error_message}>{content.status}</span>
      case 'No Solution':
        return <span className="assignment-status" data-toggle="tooltip" data-placement="top" title={content.error_message}>{content.status}</span>
      default:
        return <span className="assignment-status">{content.status}</span>
    }
  }

  // eslint-disable-next-line no-shadow
  const ConfigurationNoteActions = ({ content, referrer, id }) => {
    const edgeBrowserUrlResult = getEdgeBrowserUrl(id, content)
    switch (content.status) {
      case 'Initialized':
        // eslint-disable-next-line react/jsx-one-expression-per-line
        return <a className="run-matcher" href="#" onClick={() => handleRunMatcherClick(id)}><Icon name="cog" />Run Matcher</a>
      case 'Complete':
        return (
          <>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <a href={edgeBrowserUrlResult.edgeBrowserUrl} {...edgeBrowserUrlResult.disabled ? { className: 'disabled' } : {}}><Icon name="eye-open" />Browse Assignments</a>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <a href={`/assignments/stats?id=${id}${referrer ? `&referrer=${referrer}` : ''}`}><Icon name="stats" />View Statistics</a><br />
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <a href="#"><Icon name="share" />Deploy Assignment</a>
          </>
        )
      case 'Error':
      case 'No Solution':
        // eslint-disable-next-line react/jsx-one-expression-per-line
        return <a className="run-matcher" href="#"><Icon name="cog" />Run Matcher</a>
      case 'Deployed':
        return (
          <>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <a href={edgeBrowserUrlResult.edgeBrowserUrl} {...edgeBrowserUrlResult.disabled ? { className: 'disabled' } : {}}><Icon name="eye-open" />Browse Assignments</a>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <a href={`/assignments/stats?id=${id}${referrer ? `&referrer=${referrer}` : ''}`}><Icon name="stats" />View Statistics</a>
          </>
        )
      default:
        return null
    }
  }

  // eslint-disable-next-line arrow-body-style
  const ConfigurationNote = ({
    id, number, content, tcdate, tmdate,
  }) => {
    const { edgeBrowserUrl, disabled } = getEdgeBrowserUrl(id, content)
    return (
      <tr data-id={id}>
        <td>{number}</td>
        <td className="assignment-label" style={{ overflow: 'hidden' }}>
          <a href={edgeBrowserUrl} className={`${disabled ? 'disabled' : ''}`}>{content.title ? content.title : content.label}</a>
        </td>
        <td>{formatDateTime(tcdate)}</td>
        <td>{tcdate !== tmdate ? formatDateTime(tmdate) : null}</td>
        <td>
          <ConfigurationNoteStatus content={content} />
        </td>
        <td>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <a className={`${content.status === 'Running' ? 'edit-params-link-disabled disabled' : 'edit-params-link'}`} {...content.status === 'Running' ? {} : { href: '#' }} onClick={() => { handleEditConfigurationButtonClick(id) }}>
            <Icon name="pencil" />
            Edit
          </a>
          <br />
          <a className="clone-config" href="#" onClick={() => { handleCloneConfigurationButtonClick(id) }}>
            <Icon name="duplicate" />
            Copy
          </a>
        </td>
        <td className="assignment-actions">
          <ConfigurationNoteActions content={content} referrer={() => getReferrerStr()} id={id} />
        </td>
      </tr>
    )
  }

  return (
    <>
      <div className="row">
        <div className="col-xs-12 col-md-9">
          <h1>{`${prettyId(groupId)} Assignments`}</h1>
        </div>
        <div className="col-xs-12 col-md-3 text-right">
          <button type="button" id="new-configuration-button" className="btn" onClick={handleNewConfigurationButtonClick}>New Assignment Configuration</button>
        </div>
      </div>
      <div className="row">
        <div className="col-xs-12">
          {assignmentNotes ? (
            <>
              <table className="table table-hover assignments-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Title</th>
                    <th style={{ width: '200px' }}>Created On</th>
                    <th style={{ width: '200px' }}>Last Modified</th>
                    <th style={{ width: '115px' }}>Status</th>
                    <th style={{ width: '115px' }}>Parameters</th>
                    <th style={{ width: '175px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody id="configuration-table">
                  {assignmentNotes.map(assignmentNote => (
                    <ConfigurationNote
                      id={assignmentNote.id}
                      number={assignmentNote.number}
                      content={assignmentNote.content}
                      tcdate={assignmentNote.tcdate}
                      tmdate={assignmentNote.tmdate}
                      key={assignmentNote.id}
                    />
                  ))}
                </tbody>
              </table>
              {assignmentNotes.length === 0 && <p className="empty-message">No assignments have been generated for this venue. Click the button above to get started.</p>}
            </>
          )
            : <p className="empty-message">No assignments have been generated for this venue. Click the button above to get started.</p>}
        </div>
      </div>
    </>
  )
}

Assignments.getInitialProps = async (context) => {
  if (!context.query.group) {
    return { statusCode: 404, message: 'Could not list generated assignments. Missing parameter group.' }
  }

  return {
    groupId: context.query.group,
    referrer: context.query.referrer,
    pathName: context.pathName,
    search: `?${context.asPath.split('?')[1]}`,
  }
}

Assignments.bodyClass = 'assignments-list'

export default withError(Assignments)
