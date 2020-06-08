/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable consistent-return */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* globals Handlebars: false */
/* globals $: false */
/* globals promptError: false */
/* globals view: false */
import {
  useContext, useEffect, useState, useRef,
} from 'react'
import set from 'lodash/set'
import keys from 'lodash/keys'
import withError from '../../components/withError'
import UserContext from '../../components/UserContext'
import api from '../../lib/api-client'
import {
  prettyId,
  formatDateTime,
} from '../../lib/utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import {
  editNewConfig, editExistingConfig, editClonedConfig, setLegacyAssignmentNotes, setLegacyConfigInvitation, runMatcher,
} from '../../client/assignments'

import '../../styles/pages/assignments.less'

const Assignments = ({
  title,
  groupId,
  referrer,
  pathName,
  search,
  appContext,
}) => {
  const { setBannerContent, clientJsLoading } = appContext
  const { accessToken } = useContext(UserContext)

  const [assignmentNotes, setAssignmentNotes] = useState(null)
  const [configInvitation, setConfigInvitation] = useState(null)

  const configurationTable = useRef(null)
  const referrerStrRef = useRef(null)

  const getAssignmentNotes = async () => {
    try {
      const result = await api.get('/notes', { invitation: `${groupId}/-/Assignment_Configuration` }, { accessToken })
      // eslint-disable-next-line arrow-body-style
      setAssignmentNotes(result.notes.map((note) => {
        return set(note, 'scoresSpecParams', keys(note.content.scores_specification).join(','))
      }))
      // eslint-disable-next-line arrow-body-style
      setLegacyAssignmentNotes(result.notes.map((note) => {
        return set(note, 'scoresSpecParams', keys(note.content.scores_specification).join(','))
      }))
    } catch (error) {
      promptError(error.message)
    }
  }

  const getConfigInvitation = async () => {
    try {
      const result = await api.get('/invitations', { id: `${groupId}/-/Assignment_Configuration` }, { accessToken })
      setConfigInvitation(result.invitations[0])
      setLegacyConfigInvitation(result.invitations[0])
    } catch (error) {
      promptError(error.message)
    }
  }

  const useInterval = (callback, delay) => {
    const savedCallback = useRef()

    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback
    }, [callback])

    // Set up the interval.
    // eslint-disable-next-line consistent-return
    useEffect(() => {
      function tick() {
        savedCallback.current()
      }
      if (delay !== null) {
        const id = setInterval(tick, delay)
        return () => clearInterval(id)
      }
    }, [delay])
  }

  const handleNewConfigurationButtonClick = () => {
    editNewConfig(getAssignmentNotes)
  }

  const handleEditConfigurationButtonClick = (id) => {
    editExistingConfig(id)
  }

  const handleCloneConfigurationButtonClick = (id) => {
    editClonedConfig(id)
  }

  const handleRunMatcherClick = () => {
    runMatcher()
  }

  useInterval(() => {
    getAssignmentNotes()
  }, 50000)

  useEffect(() => {
    referrerStrRef.current = encodeURIComponent(`[all assignments for '${prettyId(groupId)}](${pathName}${search} + ${window.location.hash})`)
  }, [])

  useEffect(() => {
    if (!clientJsLoading && accessToken) {
      if (referrer) {
        setBannerContent(referrerLink(referrer))
      } else {
        setBannerContent(venueHomepageLink(groupId, 'edit'))
      }
      getAssignmentNotes()
      getConfigInvitation()
    }
  }, [clientJsLoading, accessToken])

  useEffect(() => {
    $('[data-toggle="tooltip"]').tooltip()
  }, [assignmentNotes])

  const getEdgeBrowserUrl = (configNoteId, configNoteContent) => {
    // For old matches using metadata notes
    let edgeBrowserUrl = `/assignments/browse?id=${configNoteId}`
    let disabled = true
    // For matches utilizing the new edge system
    // eslint-disable-next-line no-prototype-builtins
    if (configNoteContent.hasOwnProperty('scores_specification')) {
      const browseInvitations = Object.keys(configNoteContent.scores_specification)
      const referrerText = `all assignments for ${prettyId(configNoteContent.match_group)}`
      const referrerUrl = `/assignments?group= ${configNoteContent.match_group}`

      edgeBrowserUrl = `/edge/browse?traverse=${configNoteContent.assignment_invitation},label:${configNoteContent.title}
              &edit=${configNoteContent.assignment_invitation},label:${configNoteContent.title}
                      &browse=${configNoteContent.aggregate_score_invitation},label:${configNoteContent.title}
                              ;${browseInvitations.join(';')}
        ;${configNoteContent.conflicts_invitation}
        (${configNoteContent.custom_max_papers_invitation ? `;${configNoteContent.custom_max_papers_invitation},head:ignore` : ''})
        (${configNoteContent.custom_load_invitation ? `;${configNoteContent.custom_load_invitation},head:ignore` : ''})
        &referrer=${encodeURIComponent(`[${referrerText}](${referrerUrl})`)}`
      disabled = false
    }
    return { edgeBrowserUrl, disabled }
  }

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
        return <a className="run-matcher" href="#"><span className="glyphicon glyphicon-cog" onClick={handleRunMatcherClick} />&nbsp; Run Matcher</a>
      case 'Complete':
        return (
          <>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <a href={edgeBrowserUrlResult.edgeBrowserUrl} {...edgeBrowserUrlResult.disabled ? { className: 'disabled' } : {}}><span className="glyphicon glyphicon-eye-open" />&nbsp; Browse Assignments</a><br />
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <a href={`/assignments/stats?id=${id}${referrer ? `&referrer=${referrer}` : ''}`}><span className="glyphicon glyphicon-stats" />&nbsp; View Statistics</a><br />
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <a href="#"><span className="glyphicon glyphicon-share" />&nbsp; Deploy Assignment</a>
          </>
        )
      case 'Error':
        // eslint-disable-next-line react/jsx-one-expression-per-line
        return <><a className="run-matcher" href="#"><span className="glyphicon glyphicon-cog" />&nbsp; Run Matcher</a><br /></>
      case 'No Solution':
        // eslint-disable-next-line react/jsx-one-expression-per-line
        return <><a className="run-matcher" href="#"><span className="glyphicon glyphicon-cog" />&nbsp; Run Matcher</a><br /></>
      case 'Deployed':
        return (
          <>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <a href={edgeBrowserUrlResult.edgeBrowserUrl} {...edgeBrowserUrlResult.disabled ? { className: 'disabled' } : {}}><span className="glyphicon glyphicon-eye-open" />&nbsp; Browse Assignments</a><br />
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            <a href={`/assignments/stats?id=${id}${referrer ? `&referrer=${referrer}` : ''}`}><span className="glyphicon glyphicon-stats" />&nbsp; View Statistics</a><br />
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
      <tr date-id={id}>
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
            <span className="glyphicon glyphicon-pencil" />
            &nbsp; Edit
          </a>
          <br />
          <a className="clone-config" href="#" onClick={() => { handleCloneConfigurationButtonClick(id) }}>
            <span className="glyphicon glyphicon-duplicate" />
            &nbsp; Copy
          </a>
        </td>
        <td className="assignment-actions">
          <ConfigurationNoteActions content={content} referrer={referrerStrRef.current} id={id} />
        </td>
      </tr>
    )
  }

  return (
    <>
      <div className="row">
        <div className="col-xs-12 col-md-9">
          <h1>{title}</h1>
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
                    <th style={{ width: '115' }}>Status</th>
                    <th style={{ width: '115' }}>Parameters</th>
                    <th style={{ width: '175' }}>Actions</th>
                  </tr>
                </thead>
                <tbody id="configuration-table" ref={configurationTable}>
                  {/* eslint-disable-next-line arrow-body-style */}
                  {assignmentNotes.map((assignmentNote) => {
                    return (
                      <ConfigurationNote
                        id={assignmentNote.id}
                        number={assignmentNote.number}
                        content={assignmentNote.content}
                        tcdate={assignmentNote.tcdate}
                        tmdate={assignmentNote.tmdate}
                        key={assignmentNote.id}
                      />
                    )
                  })}
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
  if (!context.query.group && !context.query.venue) {
    return { statusCode: 404, message: 'Could not list generated assignments. Missing parameter group.' }
  }
  if (!context.query.group && context.query.venue) {
    context.res.writeHead(301, { Location: `/assignments?group=${context.query.venue}` })
    context.res.end()
  }

  return {
    title: `${prettyId(context.query.group)} Assignments`,
    groupId: context.query.group,
    referrer: context.query.referrer,
    pathName: context.pathName,
    search: `?${context.asPath.split('?')[1]}`,
  }
}

Assignments.bodyClass = 'assignments-list'

export default withError(Assignments)
