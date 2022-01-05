import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import { prettyId, getGroupIdfromInvitation } from '../../lib/utils'
import { getEdgeBrowserUrl } from '../../lib/edge-utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import Dropdown from '../../components/Dropdown'
import ScalarStat from '../../components/assignments/ScalarStat'

const AssignmentStats = ({ appContext }) => {
  const { accessToken } = useLoginRedirect()
  const [assignmentConfigNote, setAssignmentConfigNote] = useState(null)
  const [groupId, setGroupId] = useState(null)
  const [error, setError] = useState(null)
  const query = useQuery()
  const router = useRouter()
  const { setBannerContent } = appContext

  const actionOptions = [
    { value: 'browserAssignments', label: 'Browse Assignments' },
  ]

  const handleActionChange = (option) => {
    switch (option.value) {
      case 'browserAssignments':
        router.push(getEdgeBrowserUrl(assignmentConfigNote.content))
        break
      default:
        break
    }
  }

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

      <div className='header'>
        <h1>{`Assignment Statistics – ${assignmentConfigNote.content.title}`}</h1>
        <Dropdown
          placeholder="Actions"
          className="action-dropdown"
          options={actionOptions}
          onChange={handleActionChange}
        />
      </div>

      <div className="basic-stats">
        <ScalarStat value={123} name="Number of papers / Number of papers with assignments" />
        <ScalarStat value={123} name="Number of users / Number of users with assignments" />
        <ScalarStat value={123} name="Mean Final Score" />
        <ScalarStat value={123} name="Mean Number of Users per Paper" />
        <ScalarStat value={123} name="Mean Number of Papers per User" />
        <ScalarStat value={123} name="Ratio of mean score to hypothetical optimal assignment score (Randomized solver only)" />
      </div>
    </>
  )
}

AssignmentStats.bodyClass = 'assignment-stats'

export default AssignmentStats
