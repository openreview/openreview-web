/* eslint-disable arrow-body-style */
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
} from '../../lib/utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import { editNewConfig } from '../../client/assignments'
import '../../styles/pages/assignments.less'

const Assignments = ({
  title,
  groupId,
  referrer,
  appContext,
}) => {
  const { setBannerContent, clientJsLoading } = appContext
  const { accessToken } = useContext(UserContext)

  const [assignmentNotes, setAssignmentNotes] = useState(null)
  const [configInvitation, setConfigInvitation] = useState(null)

  const getAssignmentNotes = async () => {
    try {
      const result = await api.get('/notes', { invitation: `${groupId}/-/Assignment_Configuration` }, { accessToken })
      setAssignmentNotes(result.notes.map((note) => {
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
    editNewConfig(getAssignmentNotes, configInvitation)
  }

  useInterval(() => {
    getAssignmentNotes()
  }, 50000)

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
    $('#configuration-table').html(
      Handlebars.templates['partials/configurationNotes']({
        assignmentNotes,
        referrer: 'referrerStr',
      }),
    )
    $('[data-toggle="tooltip"]').tooltip()
  }, [assignmentNotes])

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
                <tbody id="configuration-table" />
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
  }
}

Assignments.bodyClass = 'assignments-list'

export default withError(Assignments)
