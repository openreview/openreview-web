/* globals $: false */
import { useContext, useEffect, useState } from 'react'
import LoadingSpinner from '../../LoadingSpinner'
import Table from '../../Table'
import { prettyId } from '../../../lib/utils'

const TrackStatus = ({ pcConsoleData }) => {

  const convertToTableRows = (data) => {
    const result = {};
    for (const track in data) {
      if (data.hasOwnProperty(track)) {
        const roles = data[track];
        const rows = [];
        for (const role in roles) {
          if (roles.hasOwnProperty(role)) {
            const { Average_Load, Maximum_Load } = roles[role];
            rows.push({
              Track: track,
              Role: role,
              Average_Load: Average_Load,
              Maximum_Load: Maximum_Load
            });
          }
        }
        result[track] = rows;
      }
    }
    return result;
  }

  if (!pcConsoleData || Object.keys(pcConsoleData).length === 0) return <LoadingSpinner />

  // #region setupVariablesAndParseData
  const tracks = pcConsoleData.invitations.filter(
    invitation => invitation.id.includes('/-/Submission')
  )
  .flat()[0].edit.note.content.research_area.value.param.enum

  const submissionCounts = tracks.reduce((acc, track) => {
    acc[track] = pcConsoleData.notes.filter(note =>
      (note.content?.research_area?.value ?? '') === track
    ).length
    return acc
  }, {})

  const parsedCmp = Object.keys(pcConsoleData.customMaxPapers).reduce((cmp, key) => {
    const edges = pcConsoleData.customMaxPapers[key] ?? []
    cmp[key] = edges.reduce((acc, edgeGroup) => {
      acc[edgeGroup.id.tail] = edgeGroup.values[0].weight
      return acc
    }, {});
    return cmp
  }, {})

  const roles = ['Reviewers', 'Area_Chairs', 'Senior_Area_Chairs']
  const reviewLoadData = tracks.reduce((acc, track) => {
    acc[track] = roles.reduce((roleAcc, role) => {
      roleAcc[role] = {
        'Average_Load': 0,
        'Maximum_Load': 0
      };
      return roleAcc;
    }, {});
    return acc;
  }, {});
  // #endregion

  pcConsoleData.allProfiles.forEach(profile => {

    // #region fetchReviewerVariables
    const registrationNotes = profile?.registrationNotes ?? []
    const reviewerRegistrations = registrationNotes.filter(note =>
      note.invitations.some(inv => inv.includes('Reviewers/-/Registration'))
    )
    const areaChairRegistrations = registrationNotes.filter(note =>
      note.invitations.some(inv => inv.includes('Area_Chairs/-/Registration'))
    )
    const seniorAreaChairRegistrations = registrationNotes.filter(note =>
      note.invitations.some(inv => inv.includes('Senior_Area_Chairs/-/Registration'))
    )
    const reviewerLoad = parsedCmp.reviewers[profile.id] ?? 0
    const areaChairLoad = parsedCmp.areaChairs[profile.id] ?? 0
    const seniorAreaChairLoad = parsedCmp.seniorAreaChairs[profile.id] ?? 0
    // #endregion

    // #region loadDataIntoObject
    if (reviewerRegistrations.length > 0) {
      const profileTracks = reviewerRegistrations[0].content.research_area.value
      const profileAverageLoad = reviewerLoad / profileTracks.length
      profileTracks.forEach(track => {
        if (tracks.includes(track)) {
          reviewLoadData[track]['Reviewers']['Average_Load'] += profileAverageLoad
          reviewLoadData[track]['Reviewers']['Maximum_Load'] += reviewerLoad
        }
      })
    }
    if (areaChairRegistrations.length > 0) {
      const profileTracks = areaChairRegistrations[0].content.research_area.value
      const profileAverageLoad = areaChairLoad / profileTracks.length
      profileTracks.forEach(track => {
        if (tracks.includes(track)) {
          reviewLoadData[track]['Area_Chairs']['Average_Load'] += profileAverageLoad
          reviewLoadData[track]['Area_Chairs']['Maximum_Load'] += areaChairLoad
        }
      })
    }
    if (seniorAreaChairRegistrations.length > 0) {
      const profileTracks = seniorAreaChairRegistrations[0].content.research_area.value
      const profileAverageLoad = seniorAreaChairLoad / profileTracks.length
      profileTracks.forEach(track => {
        if (tracks.includes(track)) {
          reviewLoadData[track]['Senior_Area_Chairs']['Average_Load'] += profileAverageLoad
          reviewLoadData[track]['Senior_Area_Chairs']['Maximum_Load'] += seniorAreaChairLoad
        }
      })
    }
    // #endregion
  })

  const rows = convertToTableRows(reviewLoadData)

  const LoadRow = ({ index, track, loadObj, rowSpan }) => {
    return (
      <tr key={index}>
        {index === 0 && (
          <>
            <td rowSpan={rowSpan}>
              {track}
            </td>
            <td rowSpan={rowSpan}>
              {submissionCounts[track]}
            </td>
          </>
        )}
        {
          loadObj['Average_Load'] < submissionCounts[track] ?
          <>
            <td><strong>{prettyId(loadObj['Role'])}</strong></td>
            <td><strong>{loadObj['Average_Load'].toFixed(1)}</strong></td>
          </> :
          <>
            <td>{prettyId(loadObj['Role'])}</td>
            <td>{loadObj['Average_Load'].toFixed(1)}</td>
          </>
        }
        <td>{loadObj['Maximum_Load']}</td>
      </tr>
    );
  }

  const TracksTable = ({ loadData }) => {
    console.log(loadData)
    return (
      <>
        {
          Object.keys(loadData).map(track => (
            loadData[track].map((row, index) => (
              <LoadRow index={index} track={track} loadObj={row} rowSpan={loadData[track].length}/>
            ))
          ))
        }
      </>
    );
  }

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
        <TracksTable loadData={rows}/>
      </Table>
    </div>
  )
}

export default TrackStatus
