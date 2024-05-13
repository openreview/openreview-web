import { useEffect, useState, useContext } from 'react'
import { getProfileLink } from '../../../lib/webfield-utils'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import SeniorAreaChairStatusMenuBar from './SeniorAreaChairStatusMenuBar'
import WebFieldContext from '../../WebFieldContext'

const BasicProfileSummary = ({ profile, profileId }) => {
  const { id, preferredName, preferredEmail } = profile ?? {}
  return (
    <div className="note">
      {preferredName ? (
        <>
          <h4>
            <a href={getProfileLink(id ?? profileId)} target="_blank" rel="noreferrer">
              {preferredName}
            </a>
          </h4>
          <p className="text-muted">({preferredEmail})</p>
        </>
      ) : (
        <h4>{profileId}</h4>
      )}
    </div>
  )
}

const SeniorAreaChairStatusRow = ({ rowData, pcConsoleData, tabular }) => {
  if (!tabular){
      return <tr>
      <td>
        <strong className="note-number">{rowData.number}</strong>
      </td>
      <td>
        <BasicProfileSummary
          profile={rowData.sacProfile ?? {}}
          profileId={rowData.sacProfileId}
        />
      </td>
      <td>
        {rowData.acs.map((ac) => (
          <BasicProfileSummary key={ac.id} profile={ac.profile ?? {}} profileId={ac.id} />
        ))}
      </td>
    </tr>
  }

  const notes = pcConsoleData.notes.filter(note =>
    (pcConsoleData.sacAcInfo.papersBySacMap.get(rowData.sacProfileId) ?? [])
    .includes(note.id)
  )
  const papersByAcMap = new Map()

  notes.forEach(note => {
    const acs = pcConsoleData.paperGroups.areaChairGroups
    .filter(group => group.id.includes(`Submission${note.number}`))
    .flatMap(group => group.members)
    .map(member => member.areaChairProfileId)
    acs.forEach(ac => {
      if (!papersByAcMap.get(ac)) papersByAcMap.set(ac, [])
      papersByAcMap.get(ac).push(note)
    })
  })

  const acRows = Array.from(papersByAcMap).map(e => {
    const rowData = {
      ac: e[0],
      papers: e[1],
    }
    rowData.officialReviews = new Map()
    rowData.metaReviews = new Map()
    rowData.reviewers = new Map()
    rowData.areaChairs = new Map()

    rowData.papers.forEach(note => {
      rowData.officialReviews.set(
        note.number,
        pcConsoleData.officialReviewsByPaperNumberMap.get(note.number)
      )
      rowData.metaReviews.set(
        note.number,
        pcConsoleData.metaReviewsByPaperNumberMap.get(note.number)
      )
      rowData.reviewers.set(
        note.number,
        pcConsoleData.paperGroups.reviewerGroups.filter(group => group.noteNumber === note.number)
      )
      rowData.areaChairs.set(
        note.number,
        pcConsoleData.paperGroups.areaChairGroups.filter(group => group.noteNumber === note.number)
      )
    })
    return rowData
  })

  const reviewCount = acRows.map(row =>
    Array.from(row.officialReviews.values()).map(reviews => reviews.length)
      .reduce((curr, prev) => curr + prev, 0)
  ).reduce((curr, prev) => curr + prev, 0)
  const reviewerCount = acRows.map(row =>
    Array.from(row.reviewers.values()).flat().map(group => group.members.length)
      .reduce((curr, prev) => curr + prev, 0)
  ).reduce((curr, prev) => curr + prev, 0)
  const metaReviewCount = acRows.map(row =>
    Array.from(row.metaReviews.values()).map(metaReviews => metaReviews.length)
      .reduce((curr, prev) => curr + prev, 0)
  ).reduce((curr, prev) => curr + prev, 0)

  console.log(acRows)

  const PaperRow = ({ row, index, note, reviews, metaReviews }) => {
    const profileLink = `/profile?id=${row.ac}`;
    const noteLink = `/forum?id=${note.id}`;
    console.log(row)
    return (
      <tr key={note.id}>
        {index === 0 && (
          <td rowSpan={row.papers.length}>
            <a href={profileLink}>{row.ac}</a>
          </td>
        )}
        <td><strong><a href={noteLink}>{note.number}</a></strong></td>
        <td>{reviews.get(note.number).length}/{(row.reviewers.get(note.number) ?? []).length}</td>
        <td>{metaReviews.get(note.number).length}/{(row.areaChairs.get(note.number) ?? []).length}</td>
      </tr>
    );
  }

  const PapersTable = ({ acRows }) => {
    return (
      <>
        {acRows.map((row, index) =>
          row.papers.map((note, noteIndex) => (
              <PaperRow row={row} index={noteIndex} note={note} reviews={row.officialReviews} metaReviews={row.metaReviews} />
          ))
        )}
      </>
    );
  }

  return <tr>
      <td>
        <strong className="note-number">{rowData.number}</strong>
      </td>
      <td>
        <BasicProfileSummary
          profile={rowData.sacProfile ?? {}}
          profileId={rowData.sacProfileId}
        />
      </td>
      <td>
        <div>
          <table className="table table-condensed">
            <tbody>
              <tr>
                <th>Review Count/Reviewer Count</th>
                <th>Meta-Review Count/Paper Count</th>
              </tr>
              <tr>
                <td>{reviewCount}/{reviewerCount}</td>
                <td>{metaReviewCount}/{notes.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="reviewer-progress">
          <table className="table table-condensed">
            <tbody>
              <tr>
                <th>Area Chair</th>
                <th>Paper Number</th>
                <th>Review Count</th>
                <th>Meta-Review Count</th>
              </tr>
              <PapersTable acRows={acRows}/>
            </tbody>
          </table>
        </div>
      </td>
    </tr>
}

const SeniorAreaChairStatus = ({ pcConsoleData, loadSacAcInfo }) => {
  const [seniorAreaChairStatusTabData, setSeniorAreaChairStatusTabData] = useState({})
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.areaChairs?.length ?? 0)
  const pageSize = 25
  const { enableSacPaperTable } = useContext(WebFieldContext)

  const loadSacStatusTabData = async () => {
    if (!pcConsoleData.sacAcInfo) {
      loadSacAcInfo()
    } else {
      const tableRows = pcConsoleData.seniorAreaChairs.map((sacProfileId, index) => {
        const acs =
          pcConsoleData.sacAcInfo.acBySacMap.get(sacProfileId)?.map((acProfileId) => {
            const acProfile = pcConsoleData.sacAcInfo.areaChairWithoutAssignmentIds.includes(
              acProfileId
            )
              ? pcConsoleData.sacAcInfo.acSacProfileWithoutAssignmentMap.get(acProfileId)
              : pcConsoleData.allProfilesMap.get(acProfileId)
            return {
              id: acProfileId,
              profile: acProfile,
            }
          }) ?? []
        const sacProfile =
          pcConsoleData.sacAcInfo.seniorAreaChairWithoutAssignmentIds.includes(sacProfileId)
            ? pcConsoleData.sacAcInfo.acSacProfileWithoutAssignmentMap.get(sacProfileId)
            : pcConsoleData.allProfilesMap.get(sacProfileId)
        return {
          number: index + 1,
          sacProfileId,
          sacProfile,
          acs,
        }
      })

      setSeniorAreaChairStatusTabData({
        tableRowsAll: tableRows,
        tableRows: [...tableRows],
      })
    }
  }

  useEffect(() => {
    if (!pcConsoleData?.paperGroups?.seniorAreaChairGroups) return
    loadSacStatusTabData()
  }, [pcConsoleData?.paperGroups?.seniorAreaChairGroups, pcConsoleData.sacAcInfo])

  useEffect(() => {
    setSeniorAreaChairStatusTabData((data) => ({
      ...data,
      tableRowsDisplayed: data.tableRows?.slice(
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
    setTotalCount(seniorAreaChairStatusTabData.tableRows?.length ?? 0)
  }, [
    pageNumber,
    pcConsoleData.paperGroups?.areaChairGroups,
    seniorAreaChairStatusTabData.tableRows,
  ])

  if (!seniorAreaChairStatusTabData.tableRowsAll) return <LoadingSpinner />

  if (seniorAreaChairStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        There are no senior area chairs.Check back later or contact info@openreview.net if you
        believe this to be an error.
      </p>
    )
  if (seniorAreaChairStatusTabData.tableRows?.length === 0)
    return (
      <div className="table-container empty-table-container">
        <SeniorAreaChairStatusMenuBar
          tableRowsAll={seniorAreaChairStatusTabData.tableRowsAll}
          tableRows={seniorAreaChairStatusTabData.tableRows}
          setSeniorAreaChairStatusTabData={setSeniorAreaChairStatusTabData}
        />
        <p className="empty-message">No senior area chair matching search criteria.</p>
      </div>
    )
  return (
    <div className="table-container">
      <SeniorAreaChairStatusMenuBar
        tableRowsAll={seniorAreaChairStatusTabData.tableRowsAll}
        tableRows={seniorAreaChairStatusTabData.tableRows}
        setSeniorAreaChairStatusTabData={setSeniorAreaChairStatusTabData}
      />
      <Table
        className="console-table table-striped pc-console-ac-status"
        headings={[
          { id: 'number', content: '#', width: '55px' },
          { id: 'seniorAreaChair', content: 'Senior Area Chair' },
          { id: 'areachair', content: 'Area Chair' },
        ]}
      >
        {seniorAreaChairStatusTabData.tableRowsDisplayed?.map((row) => (
          <SeniorAreaChairStatusRow key={row.sacProfileId} rowData={row} pcConsoleData={pcConsoleData} tabular={enableSacPaperTable}/>
        ))}
      </Table>
      <PaginationLinks
        currentPage={pageNumber}
        itemsPerPage={pageSize}
        totalCount={totalCount}
        setCurrentPage={setPageNumber}
        options={{ noScroll: true, showCount: true }}
      />
    </div>
  )
}

export default SeniorAreaChairStatus
