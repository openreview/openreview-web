/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import api from '../../../lib/api-client'
import WebFieldContext from '../../WebFieldContext'
import {
  getIndentifierFromGroup,
  getNumberFromGroup,
  getProfileName,
} from '../../../lib/utils'
import LoadingSpinner from '../../LoadingSpinner'

import Table from '../../Table'
import PaginationLinks from '../../PaginationLinks'
import NoteSummary from '../NoteSummary'
import { EthicsReviewStatus } from '../NoteReviewStatus'
import EthicsChairMenuBar from './EthicsChairMenuBar'

const EthicsSubmissionRow = ({ rowData }) => {
  const {
    venueId,
    ethicsReviewersName,
    ethicsReviewName,
    shortPhrase,
    submissionName,
    ethicsChairsName,
    preferredEmailInvitationId,
  } = useContext(WebFieldContext)

  const referrerUrl = encodeURIComponent(
    `[Ethics Chair Console](/group?id=${venueId}/${ethicsChairsName}#${submissionName.toLowerCase()}-status)`
  )

  return (
    <tr>
      <td>
        <strong className="note-number">{rowData.note.number}</strong>
      </td>
      <td>
        <NoteSummary
          note={rowData.note}
          referrerUrl={referrerUrl}
          showReaders={true}
          isV2Note={true}
        />
      </td>
      <td>
        <EthicsReviewStatus
          rowData={rowData}
          venueId={venueId}
          ethicsReviewersName={ethicsReviewersName}
          ethicsReviewName={ethicsReviewName}
          ethicsChairsName={ethicsChairsName}
          referrerUrl={referrerUrl}
          shortPhrase={shortPhrase}
          submissionName={submissionName}
          preferredEmailInvitationId={preferredEmailInvitationId}
        />
      </td>
    </tr>
  )
}

const EthicsChairPaperStatus = () => {
  const {
    venueId,
    submissionId,
    submissionName,
    ethicsReviewName,
    ethicsReviewersName,
    anonEthicsReviewerName,
    ethicsMetaReviewName,
  } = useContext(WebFieldContext)
  const [paperStatusTabData, setPaperStatusTabData] = useState({})
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCount] = useState(paperStatusTabData.tableRows?.length ?? 0)
  const pageSize = 25

  const loadSubmissions = async () => {
    try {
      const notesP = api
        .getAll('/notes', {
          invitation: submissionId,
          details: 'replies',
          select: 'id,number,forum,content,details,invitations,readers',
          sort: 'number:asc',
          domain: venueId,
        })
        .then((notes) =>
          notes.filter((note) => note.content?.flagged_for_ethics_review?.value)
        )

      const perPaperGroupResultsP = api
        .get('/groups', {
          prefix: `${venueId}/${submissionName}.*`,
          select: 'id,members',
          stream: true,
          domain: venueId,
        })
        .then((result) => result.groups ?? [])

      const [notes, perPaperGroupResults] = await Promise.all([notesP, perPaperGroupResultsP])

      let ethicsReviewerGroups = []
      const anonEthicsReviewerGroups = {}
      let allGroupMembers = []

      perPaperGroupResults.forEach((p) => {
        const number = getNumberFromGroup(p.id, submissionName)
        if (p.id.endsWith(`/${ethicsReviewersName}`)) {
          ethicsReviewerGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          p.members.forEach((member) => {
            if (!(number in anonEthicsReviewerGroups)) anonEthicsReviewerGroups[number] = {}
            if (
              !(member in anonEthicsReviewerGroups[number]) &&
              member.includes(anonEthicsReviewerName)
            ) {
              anonEthicsReviewerGroups[number][member] = member
            }
          })
        } else if (p.id.includes(anonEthicsReviewerName)) {
          if (!(number in anonEthicsReviewerGroups)) anonEthicsReviewerGroups[number] = {}
          if (p.members.length) anonEthicsReviewerGroups[number][p.id] = p.members[0]
          allGroupMembers = allGroupMembers.concat(p.members)
        }
      })

      ethicsReviewerGroups = ethicsReviewerGroups.map((ethicsReviewerGroup) => {
        const paperAnonEthicsReviewerGroups =
          anonEthicsReviewerGroups[ethicsReviewerGroup.noteNumber]
        return {
          ...ethicsReviewerGroup,
          members: ethicsReviewerGroup.members.flatMap((member) => {
            let deanonymizedGroup = paperAnonEthicsReviewerGroups[member]
            let anonymizedGroup = member
            if (!deanonymizedGroup) {
              deanonymizedGroup = member
              anonymizedGroup = Object.keys(paperAnonEthicsReviewerGroups).find(
                (key) => paperAnonEthicsReviewerGroups[key] === member
              )
            }
            return {
              reviewerProfileId: deanonymizedGroup,
              anonymizedGroup,
              anonymousId: getIndentifierFromGroup(anonymizedGroup, anonEthicsReviewerName),
            }
          }),
        }
      })

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
      }))

      const allProfilesMap = new Map()
      allProfiles.forEach((profile) => {
        const usernames = profile.content.names.flatMap((p) => p.username ?? [])
        usernames.concat(profile.email ?? []).forEach((key) => {
          allProfilesMap.set(key, profile)
        })
      })

      const ethicsReviewsByPaperNumberMap = new Map()

      notes.forEach((note) => {
        const replies = note.details.replies // eslint-disable-line prefer-destructuring
        const ethicsReviews = replies
          .filter((p) => {
            const ethicsReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${ethicsReviewName}`
            return p.invitations.includes(ethicsReviewInvitationId)
          })
          ?.map((review) => ({
            ...review,
            anonymousId: getIndentifierFromGroup(review.signatures[0], anonEthicsReviewerName),
          }))
        ethicsReviewsByPaperNumberMap.set(note.number, ethicsReviews)
      })

      const notesWithReviewsInfo = notes.map((note) => {
        const assignedEthicsReviewers =
          ethicsReviewerGroups?.find((p) => p.noteNumber === note.number)?.members ?? []
        const ethicsReviews = ethicsReviewsByPaperNumberMap?.get(note.number) ?? []
        const ethicsMetaReview = ethicsMetaReviewName
          ? note.details.replies.find((p) => {
              const ethicsMetaReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${ethicsMetaReviewName}`
              return p.invitations.includes(ethicsMetaReviewInvitationId)
            })
          : null
        if (typeof note.content?.authors?.value === 'object') {
          // eslint-disable-next-line no-param-reassign
          note.authorSearchValue = note.content.authors.value.map((p) => ({
            ...p,
            type: 'authorObj',
          }))
        }
        return {
          note,
          ethicsReviews,
          ethicsReviewers: assignedEthicsReviewers?.map((reviewer) => {
            const profile = allProfilesMap.get(reviewer.reviewerProfileId)
            return {
              anonymousId: reviewer.anonymousId,
              reviewerProfileId: reviewer.reviewerProfileId,
              preferredName: profile ? getProfileName(profile) : reviewer.reviewerProfileId,
              type: 'profile',
            }
          }),
          numReviewsDone: ethicsReviews.length,
          numReviewersAssigned: assignedEthicsReviewers.length,
          replyCount: note.details.replies?.length ?? 0,
          ethicsMetaReview,
          hasEthicsMetaReview: ethicsMetaReview ? true : false, // eslint-disable-line no-unneeded-ternary
        }
      })

      setPaperStatusTabData({
        tableRowsAll: notesWithReviewsInfo,
        tableRows: [...notesWithReviewsInfo],
      })
      setTotalCount(notesWithReviewsInfo?.length ?? 0)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    setPaperStatusTabData((data) => ({
      ...data,
      tableRowsDisplayed: data.tableRows?.slice(
        pageSize * (pageNumber - 1),
        pageSize * (pageNumber - 1) + pageSize
      ),
    }))
  }, [pageNumber, paperStatusTabData.tableRows])

  useEffect(() => {
    if (!paperStatusTabData.tableRows?.length) return
    setTotalCount(paperStatusTabData.tableRows.length)
    setPageNumber(1)
  }, [paperStatusTabData.tableRows])

  useEffect(() => {
    loadSubmissions()
  }, [])

  if (!paperStatusTabData.tableRowsAll) return <LoadingSpinner />

  if (paperStatusTabData.tableRowsAll?.length === 0)
    return (
      <p className="empty-message">
        No papers have been submitted.Check back later or{' '}
        <Link href={`/contact`}>contact us</Link> if you believe this to be an error.
      </p>
    )

  if (paperStatusTabData.tableRows?.length === 0)
    return (
      <div className="table-container empty-table-container">
        <EthicsChairMenuBar
          tableRowsAll={paperStatusTabData.tableRowsAll}
          tableRows={paperStatusTabData.tableRows}
          setPaperStatusTabData={setPaperStatusTabData}
        />
        <p className="empty-message">No papers matching search criteria.</p>
      </div>
    )

  return (
    <div className="table-container">
      <EthicsChairMenuBar
        tableRowsAll={paperStatusTabData.tableRowsAll}
        tableRows={paperStatusTabData.tableRows}
        setPaperStatusTabData={setPaperStatusTabData}
      />
      <Table
        className="console-table table-striped ethics-chairs-console-paper-status"
        headings={[
          { id: 'number', content: '#', width: '10%' },
          { id: 'summary', content: `${submissionName} Summary`, width: '45%' },
          { id: 'ethicsReviewProgress', content: 'Ethics Review Progress', width: '45%' },
        ]}
      >
        {paperStatusTabData.tableRowsDisplayed?.map((row) => (
          <EthicsSubmissionRow key={row.note.id} rowData={row} />
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

export default EthicsChairPaperStatus
