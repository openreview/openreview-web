import {
  useContext,
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

import '../../styles/pages/matching-stats.less'

// eslint-disable-next-line arrow-body-style
const AssignmentsStats = ({
  title, groupId, configNoteId, configNoteContent, invitationId, note, user, bannerContent, pageScripts,
}) => {
  const { accessToken } = useContext(UserContext)
  return (
    <>
      <div className="row" id="stats-header">
        <div className="col-xs-10">
          <h1>{title}</h1>
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
    // eslint-disable-next-line no-use-before-define
    const bannerHtml = getAssignmentsPageLink(groupId)

    return {
      title: `${prettyId(groupId)} Assignment Statistics-${configData.content.title}`,
      groupId,
      configNoteId: assignmentConfigurationId,
      configNoteContent: configData.content,
      invitationId: configData.invitation,
      note: JSON.stringify(configData),
      user: user.profile,
      bannerContent: bannerHtml,
      pageScripts: ['/static/js/vendor/d3-5.9.1.min.js'],
    }
  } catch (error) {
    return { statusCode: 404, message: error.message }
  }
}

AssignmentsStats.bodyClass = 'assignments-stats'

// eslint-disable-next-line arrow-body-style
const getAssignmentsPageLink = (groupId) => {
  return `<a href="/assignments?group=${groupId}" title="All Assignments">
      <img class="icon" src="/static/images/arrow_left.svg">
    View all <strong>${prettyId(groupId)}</strong> assignments</a>`
}

const getGroupIdfromInvitation = (invitationId) => {
  // By convention all invitations should have the form group_id/-/invitation_name
  const parts = invitationId.split('/-/')
  if (parts.length === 1) {
    return null // Invalid invitation, missing /-/
  }
  return parts[0]
}

export default withError(AssignmentsStats)
