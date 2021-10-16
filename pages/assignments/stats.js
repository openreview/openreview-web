import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import { prettyId, getGroupIdfromInvitation } from '../../lib/utils'
import { getEdgeBrowserUrl } from '../../lib/edge-utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

const AssignmentStats = ({ appContext }) => {
  const { accessToken } = useLoginRedirect()
  const [assignmentConfigNote, setAssignmentConfigNote] = useState(null)
  const [groupId, setGroupId] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent, clientJsLoading } = appContext

  const loadConfigNote = async (assignmentConfigId) => {
    try {
      const { notes } = await api.get('/notes', { id: assignmentConfigId }, { accessToken })
      if (notes?.length > 0) {
        setAssignmentConfigNote(notes[0])
        setGroupId(getGroupIdfromInvitation(notes[0].invitation))
      } else {
        setError({ statusCode: 404, message: `No assignment note with the ID "${assignmentConfigId}" found` })
      }
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  useEffect(() => {
    if (!accessToken || !query) return

    if (!query.id) {
      setError({ statusCode: 400, message: 'Could not load assignment statistics. Missing parameter id.' })
    } else {
      loadConfigNote(query.id)
    }
  }, [accessToken, query])

  useEffect(() => {
    if (clientJsLoading || !assignmentConfigNote) return

    // eslint-disable-next-line global-require
    window.d3 = require('d3')

    // eslint-disable-next-line global-require
    const runAssignmentStats = require('../../client/assignment-stats')

    runAssignmentStats(assignmentConfigNote, router.push)
  }, [clientJsLoading, assignmentConfigNote])

  useEffect(() => {
    if (!query || !groupId) return

    setBannerContent(referrerLink(query.referrer || `[all assignments for ${prettyId(groupId)}](/assignments?group=${groupId})`))
  }, [query, groupId])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  if (!assignmentConfigNote) return <LoadingSpinner />

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
                <Link href={getEdgeBrowserUrl(assignmentConfigNote.content)}>
                  <a>Browse Assignments</a>
                </Link>
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

AssignmentStats.bodyClass = 'assignment-stats'

export default AssignmentStats
