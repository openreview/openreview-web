import {
  useContext, useEffect,
} from 'react'
import withError from '../../components/withError'
import UserContext from '../../components/UserContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { auth } from '../../lib/auth'
import api from '../../lib/api-client'
import {
  prettyId,
  getEdgeBrowserUrl,
} from '../../lib/utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

import '../../styles/pages/matching-stats.less'

// eslint-disable-next-line arrow-body-style
const AssignmentsStats = ({
  // eslint-disable-next-line max-len
  title, groupId, configNoteId, configNoteContent, note, referrer, appContext,
}) => {
  const { accessToken } = useContext(UserContext)
  const { setBannerContent, clientJsLoading } = appContext

  useEffect(() => {
    if (!clientJsLoading) {
      if (referrer) {
        setBannerContent(referrerLink(referrer))
      } else {
        setBannerContent(venueHomepageLink(groupId, 'edit'))
      }
      // eslint-disable-next-line global-require
      const { setWindowAssignmentConfigNote, runAssignmentsStats } = require('../../client/assignmentsStats')
      // eslint-disable-next-line global-require
      window.d3 = require('d3')
      window.localStorage.setItem('token', accessToken) // TODO: this is a temporary solution to avoid failure in webfield calls
      setWindowAssignmentConfigNote(note)
      runAssignmentsStats(note.content)
    }
  }, [clientJsLoading])

  return (
    <>
      <LoadingSpinner />
      <div className="row" id="stats-header">
        <div className="col-xs-10">
          <h1>{`${prettyId(groupId)} Assignment Statistics-${note.content.title}`}</h1>
        </div>

        <div className="col-xs-2 text-right">
          <div className="btn-group">
            <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Actions
              {' '}
              <span className="caret" />
            </button>
            <ul className="dropdown-menu dropdown-align-right">
              <li>
                <a href={getEdgeBrowserUrl(configNoteId, configNoteContent).edgeBrowserUrl}>Browse Assignments</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="row" id="stats-container-basic" />
      <div className="row" id="stats-container-assignment-dist">
        <div className="col-xs-12">
          <h3 className="hidden">Assignment Distributions</h3>
        </div>
      </div>
      <div className="row" id="stats-container-recommendation-dist">
        <div className="col-xs-12">
          <h3 className="hidden">Recommendation Distributions</h3>
        </div>
      </div>
      <div className="row" id="stats-container-bid-dist">
        <div className="col-xs-12">
          <h3 className="hidden">Bid Distributions</h3>
        </div>
      </div>
    </>
  )
}

AssignmentsStats.getInitialProps = async (context) => {
  const { token, user } = auth(context)
  const assignmentConfigurationId = context.query.id
  if (!assignmentConfigurationId) {
    return { statusCode: 404, message: 'Could not load assignments browser. Missing parameter assignmentId.' }
  }
  try {
    const result = await api.get('/notes', { id: assignmentConfigurationId }, { accessToken: token })
    const { notes } = result
    if (!notes.length) {
      return { statusCode: 404, message: `No assignment note with id "${assignmentConfigurationId}" found` }
    }
    const configData = notes[0]
    // eslint-disable-next-line no-use-before-define
    const groupId = getGroupIdfromInvitation(configData.invitation)
    // const bannerHtml = getAssignmentsPageLink(groupId)
    return {
      groupId,
      configNoteId: assignmentConfigurationId,
      configNoteContent: configData.content,
      // invitationId: configData.invitation,
      note: configData,
      // user: user.profile,
      // bannerContent: bannerHtml,
      referrer: context.query.referrer,
    }
  } catch (error) {
    return { statusCode: 404, message: error.message }
  }
}

AssignmentsStats.bodyClass = 'assignments-stats'

const getGroupIdfromInvitation = (invitationId) => {
  // By convention all invitations should have the form group_id/-/invitation_name
  const parts = invitationId.split('/-/')
  if (parts.length === 1) {
    return null // Invalid invitation, missing /-/
  }
  return parts[0]
}

export default withError(AssignmentsStats)
