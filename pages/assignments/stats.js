import { useEffect } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import withError from '../../components/withError'
import { auth } from '../../lib/auth'
import api from '../../lib/api-client'
import { getGroupIdfromInvitation } from '../../lib/utils'
import { getEdgeBrowserUrl } from '../../lib/edge-utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

import '../../styles/pages/assignment-stats.less'

const AssignmentStats = ({
  groupId, assignmentConfigNote, referrer, appContext,
}) => {
  const { setBannerContent, clientJsLoading } = appContext

  useEffect(() => {
    if (clientJsLoading) return

    if (referrer) {
      setBannerContent(referrerLink(referrer))
    } else {
      setBannerContent(venueHomepageLink(groupId, 'edit'))
    }

    // eslint-disable-next-line global-require
    window.d3 = require('d3')

    // eslint-disable-next-line global-require
    const runAssignmentStats = require('../../client/assignment-stats')

    runAssignmentStats(assignmentConfigNote)
  }, [clientJsLoading])

  return (
    <>
      <Head>
        <title key="title">{`${assignmentConfigNote.content.title} Stats | OpenReview`}</title>
      </Head>

      <header className="row">
        <div className="col-xs-10">
          <h1>
            {`Assignment Statistics – ${assignmentConfigNote.content.title}`}
          </h1>
        </div>

        <div className="col-xs-2 text-right">
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-default dropdown-toggle"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Actions
              {' '}
              <span className="caret" />
            </button>
            <ul className="dropdown-menu dropdown-align-right">
              <li>
                <a href={getEdgeBrowserUrl(assignmentConfigNote.content)}>Browse Assignments</a>
              </li>
            </ul>
          </div>
        </div>
      </header>

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

AssignmentStats.getInitialProps = async (ctx) => {
  const { token, user } = auth(ctx)
  if (!user) {
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` }).end()
    } else {
      Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
    }
  }

  const assignmentConfigId = ctx.query.id
  if (!assignmentConfigId) {
    return { statusCode: 404, message: 'Could not load assignment statistics. Missing parameter id.' }
  }

  const { notes } = await api.get('/notes', { id: assignmentConfigId }, { accessToken: token })
  if (!notes || notes.length === 0) {
    return { statusCode: 404, message: `No assignment note with the ID "${assignmentConfigId}" found` }
  }

  const assignmentConfigNote = notes[0]
  const groupId = getGroupIdfromInvitation(assignmentConfigNote.invitation)
  return {
    groupId,
    assignmentConfigNote,
    referrer: ctx.query.referrer,
  }
}

AssignmentStats.bodyClass = 'assignment-stats'

export default withError(AssignmentStats)
