import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { groupBy } from 'lodash'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import { prettyId, getGroupIdfromInvitation } from '../../lib/utils'
import { getEdgeBrowserUrl } from '../../lib/edge-utils'
import { referrerLink } from '../../lib/banner-links'
import Dropdown from '../../components/Dropdown'
import ScalarStat from '../../components/assignments/ScalarStat'

const AssignmentStats = ({ appContext }) => {
  const { accessToken } = useLoginRedirect()
  const [assignmentConfigNote, setAssignmentConfigNote] = useState(null)
  const [matchLists, setMatchLists] = useState(null)
  const [values, setValues] = useState({})
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

  const loadMatchingDataFromEdges = async () => {
    const noteContent = assignmentConfigNote.content
    const paperInvitationElements = noteContent.paper_invitation.split('&')
    // #region get Papers
    let papers = []
    if (paperInvitationElements[0].includes('/-/')) {
      const getNotesArgs = {
        invitation: paperInvitationElements[0],
      }
      paperInvitationElements.slice(1).forEach((filter) => {
        const filterElements = filter.split('=')
        getNotesArgs[filterElements[0]] = filterElements[1]
      })
      papers = await api.getAll('/notes', getNotesArgs, { accessToken, resultsKey: 'notes' })
    } else {
      const result = await api.get('/groups', { id: paperInvitationElements[0] }, { accessToken })
      papers = result?.groups?.[0]?.members.map(p => ({ id: p }))
    }
    // #endregion

    // #region get Users
    const result = await api.get('/groups', { id: noteContent.match_group }, { accessToken })
    const users = result?.groups?.[0]?.members
    // #endregion

    // #region get Assignments
    const queryParams = noteContent.status === 'Deployed' && noteContent.deployed_assignment_invitation
      ? {
        invitation: noteContent.deployed_assignment_invitation,
        groupBy: 'head',
        select: 'tail,weight',
      }
      : {
        invitation: noteContent.assignment_invitation,
        label: noteContent.title,
        groupBy: 'head',
        select: 'tail,weight',
      }
    const assignments = await api.getAll('/edges', queryParams, { accessToken, resultsKey: 'groupedEdges' })
    // #endregion

    // #region get Bids
    const bidInvitation = Object.keys(noteContent.scores_specification ?? {}).find(p => p.endsWith('Bid'))
    const bids = bidInvitation
      ? await api.getAll('/edges', { invitation: bidInvitation, groupBy: 'head', select: 'tail,weight' }, { accessToken, resultsKey: 'groupedEdges' })
      : []
    // #endregion

    // #region get Recommendations
    const recommendationInvitation = Object.keys(noteContent.scores_specification ?? {}).find(p => p.endsWith('Recommendation'))
    const recommendations = recommendationInvitation
      ? await api.getAll('/edges', { invitation: recommendationInvitation, groupBy: 'head', select: 'tail,weight' }, { accessToken, resultsKey: 'groupedEdges' })
      : []
    // #endregion

    // #region compute data
    const paperIds = {}
    const userIds = {}
    const bidDict = {}
    papers.forEach((note) => {
      paperIds[note.id] = note
    })
    users.forEach((member) => {
      userIds[member] = member
    })
    bids.forEach((groupedEdge) => {
      const paperId = groupedEdge.id.head
      bidDict[paperId] = {}
      groupedEdge.values.forEach((value) => {
        if (paperId in paperIds) {
          bidDict[paperId][value.tail] = value.label
        }
      })
    })

    const recommendationDict = {}
    recommendations.forEach((groupedEdge) => {
      const paperId = groupedEdge.id.head
      recommendationDict[paperId] = {}
      groupedEdge.values.forEach((value) => {
        if (paperId in paperIds) {
          recommendationDict[paperId][value.tail] = value.weight
        }
      })
    })

    const usersWithAssignments = new Set()
    const papersWithAssignments = new Set()
    const assignmentMap = assignments.flatMap((groupedEdge) => {
      const paperId = groupedEdge.id.head
      const paperBids = bidDict[paperId] || {}
      const paperRecommendations = recommendationDict[paperId] || {}
      const validGroupEdges = groupedEdge.values.filter(value => (paperId in paperIds) && (value.tail in userIds))
      return validGroupEdges.map((value) => {
        const otherScores = { bid: 'No Bid' }
        if (value.tail in paperBids) {
          otherScores.bid = paperBids[value.tail]
        }
        if (value.tail in paperRecommendations) {
          otherScores.recommendation = paperRecommendations[value.tail]
        } else {
          otherScores.recommendation = 0
        }
        papersWithAssignments.add(paperId)
        usersWithAssignments.add(value.tail)
        return {
          groupId: value.tail,
          paperId,
          score: value.weight,
          otherScores,
        }
      })
    })

    const unassignedPapersList = []
    Object.keys(paperIds).forEach((paperId) => {
      if (!papersWithAssignments.has(paperId)) {
        unassignedPapersList.push(paperId)
      }
    })

    const unassignedUsersList = []
    Object.keys(userIds).forEach((user) => {
      if (!usersWithAssignments.has(user)) {
        unassignedUsersList.push(user)
      }
    })
    // #endregion

    setMatchLists([assignmentMap, unassignedPapersList, unassignedUsersList])
  }

  const loadMatchingDataFromNotes = async () => {
    const noteContent = assignmentConfigNote.content
    const notes = await api.getAll('/notes', {
      invitation: noteContent.assignment_invitation,
      'content.title': noteContent.title,
    }, { accessToken, resultsKey: 'notes' })

    const assignmentMap = notes.flatMap(note => note.content.assignedGroups.map((group) => {
      const otherScores = group.scores.map((v, k) => [k, Number.isNaN(Number(v)) ? 0 : Number(v)]).reduce(
        (acc, [k, v]) => ({ ...acc, [k]: v }), {},
      )

      return {
        groupId: group.userId,
        paperId: note.forum,
        score: Number.isNaN(Number(group.finalScore)) ? 0 : Number(group.finalScore),
        otherScores,
      }
    }))

    setMatchLists([assignmentMap, [], []])
  }

  useEffect(() => {
    if (!assignmentConfigNote) return
    const useEdges = !!assignmentConfigNote.content.scores_specification
    if (useEdges) {
      loadMatchingDataFromEdges()
      return
    }
    loadMatchingDataFromNotes()
  }, [assignmentConfigNote])

  useEffect(() => {
    if (!matchLists) return
    const paperMap = groupBy(matchLists[0], match => match.paperId)
    const papersWithoutAssignments = matchLists?.[1] ?? []
    const paperCount = `${Object.keys(paperMap ?? {}).length + papersWithoutAssignments.length} / ${Object.keys(paperMap ?? {}).length}`

    const groupMap = groupBy(matchLists[0], match => match.groupId)
    const usersWithoutAssignments = matchLists?.[2] ?? []
    const userCount = `${Object.keys(groupMap ?? {}).length + usersWithoutAssignments.length} / ${Object.keys(groupMap ?? {}).length}`

    const meanFinalScore = matchLists[0].length === 0
      ? '-'
      : (
        Math.round(
          (matchLists[0].map(p => p.score ?? 0).reduce((a, b) => a + b, 0) * 100)
          / matchLists[0].length,
        ) / 100
      ).toFixed(2)

    const meanGroupCountPerPaper = Object.values(paperMap ?? {}).length === 0
      ? '-'
      : (
        Math.round(
          (Object.values(paperMap ?? {})
            .map(p => p.length)
            .reduce((a, b) => a + b, 0)
              * 100)
            / Object.values(paperMap ?? {}).length,
        ) / 100
      ).toFixed(2)

    const meanPaperCountPerGroup = Object.values(groupMap ?? {}).length === 0
      ? '-'
      : (
        Math.round(
          (Object.values(groupMap ?? {})
            .map(p => p.length)
            .reduce((a, b) => a + b, 0)
            * 100)
          / Object.values(groupMap ?? {}).length,
        ) / 100
      ).toFixed(2)

    setValues({
      paperCount,
      userCount,
      meanFinalScore,
      meanGroupCountPerPaper,
      meanPaperCountPerGroup,
    })
  }, [matchLists])

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
        <ScalarStat value={values.paperCount} name="Number of papers / Number of papers with assignments" />
        <ScalarStat value={values.userCount} name="Number of users / Number of users with assignments" />
        <ScalarStat value={values.meanFinalScore} name="Mean Final Score" />
        <ScalarStat value={values.meanGroupCountPerPaper} name="Mean Number of Users per Paper" />
        <ScalarStat value={values.meanPaperCountPerGroup} name="Mean Number of Papers per User" />
        {
          assignmentConfigNote?.content?.randomized_fraction_of_opt && (
            <ScalarStat
              value={Math.round(assignmentConfigNote.content.randomized_fraction_of_opt * 100) / 100}
              name="Ratio of mean score to hypothetical optimal assignment score (Randomized solver only)"
            />
          )
        }
      </div>
    </>
  )
}

AssignmentStats.bodyClass = 'assignment-stats'

export default AssignmentStats
