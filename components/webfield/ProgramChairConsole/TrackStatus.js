/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import groupBy from 'lodash/groupBy'
import LoadingSpinner from '../../LoadingSpinner'
import Table from '../../Table'
import WebFieldContext from '../../WebFieldContext'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import { getProfileName, prettyId } from '../../../lib/utils'
import { isSuperUser } from '../../../lib/clientAuth'

const TrackStatus = () => {
  const {
    venueId,
    reviewersId,
    areaChairsId,
    seniorAreaChairsId,
    submissionId,
    trackStatusConfig,
    withdrawnVenueId,
    deskRejectedVenueId,
    customMaxPapersName,
    submissionName,
  } = useContext(WebFieldContext)
  const { user, isRefreshing } = useUser()
  const [trackStatusData, setTrackStatusData] = useState({})

  const loadTrackStatusData = async () => {
    if (trackStatusData.allProfiles) return // check if data already loaded
    try {
      // #region getInvitationMap
      const conferenceInvitationsP = api.get('/invitations', {
        id: submissionId,
      })
      const invitationResultsP = Promise.all([conferenceInvitationsP])
      // #endregion

      // #region get Reviewer, AC, SAC members
      const committeeMemberResultsP = Promise.all(
        [reviewersId, areaChairsId, seniorAreaChairsId].map((id) =>
          id ? api.getGroupById(id, undefined, { select: 'members' }) : Promise.resolve([])
        )
      )
      // #endregion

      // #region getSubmissions
      const notesP = api.getAll('/notes', {
        invitation: submissionId,
        details: 'replies',
        select: 'id,number,forum,content,details,invitations,readers',
        sort: 'number:asc',
        domain: venueId,
      })
      // #endregion

      // #region get Reviewer, AC, SAC custom max papers
      const customMaxPapersP = Promise.all(
        [reviewersId, areaChairsId, seniorAreaChairsId].map((id) => {
          if (!id) return Promise.resolve([]) // change to cmpName
          return api.getAll(
            '/edges',
            {
              invitation: `${id}/-/${customMaxPapersName}`, // change to cmpName
              groupBy: 'tail',
              select: 'weight',
              domain: venueId,
            },
            { resultsKey: 'groupedEdges' }
          )
        })
      )
      // #endregion

      // #region getRegistrationForms
      const prefixes = [reviewersId, areaChairsId, seniorAreaChairsId].filter(Boolean)
      const getRegistrationFormResultsP = Promise.all(
        prefixes.map((prefix) =>
          api
            .getAll('/notes', {
              invitation: `${prefix}/-/.*`,
              signature: venueId,
              select: 'id,invitation,invitations,content.title',
              domain: venueId,
            })
            .then((notes) =>
              notes.filter((note) => note.invitations.some((p) => p.endsWith('_Form')))
            )
        )
      )
      // #endregion

      const results = await Promise.all([
        getRegistrationFormResultsP,
        committeeMemberResultsP,
        notesP,
        customMaxPapersP,
        invitationResultsP,
      ])
      const registrationForms = results[0].flatMap((p) => p ?? [])
      const committeeMemberResults = results[1]
      const notes = results[2].flatMap((note) => {
        if ([withdrawnVenueId, deskRejectedVenueId].includes(note.content?.venueid?.value))
          return []
        return note
      })
      const customMaxPapersResults = results[3]
      const invitationResult = results[4]?.[0]?.invitations[0]

      const reviewers = committeeMemberResults[0]?.members ?? []
      const areaChairs = committeeMemberResults[1]?.members ?? []
      const seniorAreaChairs = committeeMemberResults[2]?.members ?? []
      const allGroupMembers = reviewers.concat(areaChairs, seniorAreaChairs)

      // Get registration notes from all registration forms
      const registrationNotes = await Promise.all(
        registrationForms.map((regForm) =>
          api.getAll('/notes', {
            forum: regForm.id,
            select: 'id,signatures,invitations,content',
            domain: venueId,
          })
        )
      )
      const registrationNoteMap = groupBy(registrationNotes.flat(), 'signatures[0]')

      // #region get all profiles
      const allIds = [...new Set(allGroupMembers)]
      const ids = allIds.filter((p) => p.startsWith('~'))
      const getProfilesByIdsP = ids.length
        ? api.post('/profiles/search', {
            ids,
          })
        : Promise.resolve([])
      const profileResults = await getProfilesByIdsP
      const allProfiles = (profileResults.profiles ?? []).map((profile) => ({
        ...profile,
        preferredName: getProfileName(profile),
        preferredEmail: profile.content.preferredEmail ?? profile.content.emails[0],
      }))
      // #endregion

      allProfiles.forEach((profile) => {
        const usernames = profile.content.names.flatMap((p) => p.username ?? [])

        let userRegNotes = []
        usernames.forEach((username) => {
          if (registrationNoteMap[username]) {
            userRegNotes = userRegNotes.concat(registrationNoteMap[username])
          }
        })
        // eslint-disable-next-line no-param-reassign
        profile.registrationNotes = userRegNotes
      })
      setTrackStatusData({
        submissionInvitation: invitationResult,
        notes,
        customMaxPapers: {
          reviewers: customMaxPapersResults[0],
          areaChairs: customMaxPapersResults[1],
          seniorAreaChairs: customMaxPapersResults[2],
        },
        allProfiles,
      })
    } catch (error) {
      promptError(`loading track status: ${error.message}`)
    }
  }

  const convertToTableRows = (data) => {
    const result = {}
    Object.entries(data).forEach(([track, roles]) => {
      const rows = []
      Object.entries(roles).forEach(([role, { averageLoad, maximumLoad }]) => {
        rows.push({
          Track: track,
          Role: role,
          averageLoad,
          maximumLoad,
        })
      })
      result[track] = rows
    })
    return result
  }

  useEffect(() => {
    if (isRefreshing || !user || !venueId || !reviewersId || !submissionId) return
    loadTrackStatusData()
  }, [user, isRefreshing])

  if (!trackStatusData || Object.keys(trackStatusData).length === 0) return <LoadingSpinner />

  // #region setupVariablesAndParseData
  const submissionTrackName = trackStatusConfig?.submissionTrackname ?? 'research_area'
  const registrationTrackName = trackStatusConfig?.registrationTrackName ?? 'research_area'
  const registrationFormName = trackStatusConfig?.registrationFormName ?? 'Registration'
  const roles = trackStatusConfig?.roles ?? ['Reviewers', 'Area_Chairs', 'Senior_Area_Chairs']

  const rolesToCheck = [
    { id: reviewersId, role: 'reviewers' },
    { id: areaChairsId, role: 'areaChairs' },
    { id: seniorAreaChairsId, role: 'seniorAreaChairs' },
  ]
  const jsRoles = rolesToCheck.filter((item) => item.id).map((item) => item.role)
  const zippedRoles = roles.map((role, index) => [role, jsRoles[index]])

  const tracks =
    trackStatusData.submissionInvitation.edit.note.content[submissionTrackName].value.param
      .enum

  const submissionCounts = tracks.reduce((acc, track) => {
    acc[track] = trackStatusData.notes.filter(
      (note) => (note.content[submissionTrackName].value ?? '') === track
    ).length
    return acc
  }, {})

  const parsedCmp = Object.keys(trackStatusData.customMaxPapers).reduce((cmp, key) => {
    const edges = trackStatusData.customMaxPapers[key] ?? []
    const edgeGroupRes = edges.reduce((acc, edgeGroup) => {
      acc[edgeGroup.id.tail] = edgeGroup.values[0].weight
      return acc
    }, {})
    return { ...cmp, [key]: edgeGroupRes }
  }, {})

  const reviewLoadData = tracks.reduce((acc, track) => {
    acc[track] = roles.reduce((roleAcc, role) => {
      const defaultValues = {
        averageLoad: 0,
        maximumLoad: 0,
      }
      return { ...roleAcc, [role]: defaultValues }
    }, {})
    return acc
  }, {})
  // #endregion

  trackStatusData.allProfiles.forEach((profile) => {
    // #region fetchReviewerVariables
    const registrationNotes = profile?.registrationNotes ?? []

    const registrations = roles.reduce((acc, role) => {
      acc[role] = registrationNotes.filter((note) =>
        note.invitations.some((inv) => inv.includes(`${role}/-/${registrationFormName}`))
      )
      return acc
    }, {})

    const loads = zippedRoles.reduce((acc, [role, jsRole]) => {
      acc[role] = parsedCmp?.[jsRole]?.[profile.id] ?? 0
      return acc
    }, {})

    // #endregion

    // #region loadDataIntoObject
    Object.entries(registrations).forEach(([role, roleRegistrations]) => {
      if (roleRegistrations.length > 0) {
        const profileTracks = roleRegistrations[0].content[registrationTrackName].value
        const profileAverageLoad = loads[role] / profileTracks.length
        profileTracks.forEach((track) => {
          if (tracks.includes(track)) {
            reviewLoadData[track][role].averageLoad += profileAverageLoad
            reviewLoadData[track][role].maximumLoad += loads[role]
          }
        })
      }
    })
    // #endregion
  })

  const rows = convertToTableRows(reviewLoadData)

  const LoadRow = ({ index, track, loadObj, rowSpan }) => (
    <tr key={index}>
      {index === 0 && (
        <>
          <td rowSpan={rowSpan}>{track}</td>
          <td rowSpan={rowSpan}>{submissionCounts[track]}</td>
        </>
      )}
      {loadObj.averageLoad < submissionCounts[track] ? (
        <>
          <td>
            <strong>{prettyId(loadObj.Role)}</strong>
          </td>
          <td>
            <strong>{loadObj.averageLoad.toFixed(1)}</strong>
          </td>
        </>
      ) : (
        <>
          <td>{prettyId(loadObj.Role)}</td>
          <td>{loadObj.averageLoad.toFixed(1)}</td>
        </>
      )}
      <td>{loadObj.maximumLoad}</td>
    </tr>
  )

  const TracksTable = ({ loadData }) => (
    <>
      {Object.keys(loadData).map((track) =>
        loadData[track].map((row, index) => (
          <LoadRow
            key={track.concat(index)}
            index={index}
            track={track}
            loadObj={row}
            rowSpan={loadData[track].length}
          />
        ))
      )}
    </>
  )

  return (
    <div className="table-container">
      <Table
        className="console-table table-striped pc-console-paper-status"
        headings={[
          { id: 'track', content: 'Track Name', width: '30%' },
          { id: 'count', content: 'Submission Count', width: '10%' },
          { id: 'role', content: 'Role Name', width: '20%' },
          { id: 'avgLoad', content: 'Average Load', width: '10%' },
          { id: 'maxLoad', content: 'Maximum Load', width: '10%' },
        ]}
      >
        <TracksTable loadData={rows} />
      </Table>
    </div>
  )
}

export default TrackStatus
