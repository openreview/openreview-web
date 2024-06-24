/* globals promptError, promptMessage: false */
import { useContext, useEffect, useState } from 'react'
import copy from 'copy-to-clipboard'
import { getProfileLink } from '../../../lib/webfield-utils'
import LoadingSpinner from '../../LoadingSpinner'
import PaginationLinks from '../../PaginationLinks'
import Table from '../../Table'
import SeniorAreaChairStatusMenuBar from './SeniorAreaChairStatusMenuBar'
import api from '../../../lib/api-client'
import WebFieldContext from '../../WebFieldContext'

const BasicProfileSummary = ({ profile, profileId }) => {
  const { id, preferredName } = profile ?? {}
  const { preferredEmailInvitation } = useContext(WebFieldContext)
  const getEmail = async () => {
    if (!preferredEmailInvitation) {
      promptError('Email is not available.')
      return
    }
    try {
      const result = await api.get(`/edges`, {
        invitation: preferredEmailInvitation,
        head: id ?? profileId,
      })
      const email = result.edges?.[0]?.tail
      if (!email) throw new Error('Email is not available.')
      copy(`<${email}>`)
      promptMessage(`${email} copied to clipboard`)
    } catch (error) {
      promptError(error.message)
    }
  }
  return (
    <div className="note">
      {preferredName ? (
        <div className="copy-email-container">
          <h4>
            <a href={getProfileLink(id ?? profileId)} target="_blank" rel="noreferrer">
              {preferredName}
            </a>
          </h4>
          {preferredEmailInvitation && (
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
            <a
              href="#"
              className="text-muted copy-email-link"
              onClick={(e) => {
                e.preventDefault()
                getEmail()
              }}
            >
              Copy Email
            </a>
          )}
        </div>
      ) : (
        <h4>{profileId}</h4>
      )}
    </div>
  )
}

const SeniorAreaChairStatusRow = ({ rowData }) => (
  <tr>
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
)

const SeniorAreaChairStatus = ({ pcConsoleData, loadSacAcInfo }) => {
  const [seniorAreaChairStatusTabData, setSeniorAreaChairStatusTabData] = useState({})
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(pcConsoleData.areaChairs?.length ?? 0)
  const pageSize = 25

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
        className="console-table table-striped pc-console-ac-sac-status"
        headings={[
          { id: 'number', content: '#', width: '55px' },
          { id: 'seniorAreaChair', content: 'Senior Area Chair' },
          { id: 'areachair', content: 'Area Chair' },
        ]}
      >
        {seniorAreaChairStatusTabData.tableRowsDisplayed?.map((row) => (
          <SeniorAreaChairStatusRow key={row.sacProfileId} rowData={row} />
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
