/* globals $,promptMessage,promptError,typesetMathJax: false */

import { useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import debounce from 'lodash/debounce'
import orderBy from 'lodash/orderBy'
import uniqBy from 'lodash/uniqBy'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import Table from '../Table'
import ErrorDisplay from '../ErrorDisplay'
import Dropdown from '../Dropdown'
import Icon from '../Icon'
import NoteSummary from './NoteSummary'
import { AreaChairConsoleNoteReviewStatus } from './NoteReviewStatus'
import { AreaChairConsoleNoteMetaReviewStatus } from './NoteMetaReviewStatus'
import TaskList from '../TaskList'
import BasicModal from '../BasicModal'
import ExportCSV from '../ExportCSV'
import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import {
  formatTasksData,
  getNumberFromGroup,
  getIndentifierFromGroup,
  prettyId,
} from '../../lib/utils'
import { filterCollections } from '../../lib/webfield-utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

const SelectAllCheckBox = ({ selectedNoteIds, setSelectedNoteIds, allNoteIds }) => {
  const allNotesSelected = selectedNoteIds.length === allNoteIds?.length

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedNoteIds(allNoteIds)
      return
    }
    setSelectedNoteIds([])
  }
  return (
    <input
      type="checkbox"
      id="select-all-papers"
      checked={allNotesSelected}
      onChange={handleSelectAll}
    />
  )
}

const MessageReviewersModal = ({
  tableRowsDisplayed,
  messageOption,
  shortPhrase,
  selectedNoteIds,
  venueId,
  officialReviewName,
  submissionName,
}) => {
  const { accessToken } = useUser()
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState(null)
  const [subject, setSubject] = useState(`${shortPhrase} Reminder`)
  const [message, setMessage] = useState(null)
  const primaryButtonText = currentStep === 1 ? 'Next' : 'Confirm & Send Messages'
  const [recipientsInfo, setRecipientsInfo] = useState([])
  const totalMessagesCount = uniqBy(recipientsInfo, (p) => p.reviewerProfileId).reduce(
    (prev, curr) => prev + curr.count,
    0
  )

  const handlePrimaryButtonClick = async () => {
    if (currentStep === 1) {
      setCurrentStep(2)
      return
    }
    // send emails
    try {
      const sendEmailPs = selectedNoteIds.map((noteId) => {
        const { note } = tableRowsDisplayed.find((row) => row.note.id === noteId)
        const reviewerIds = recipientsInfo
          .filter((p) => p.noteNumber == note.number) // eslint-disable-line eqeqeq
          .map((q) => q.reviewerProfileId)
        if (!reviewerIds.length) return Promise.resolve()
        const forumUrl = `https://openreview.net/forum?id=${note.forum}&noteId=${noteId}&invitationId=${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
        return api.post(
          '/messages',
          {
            groups: reviewerIds,
            subject,
            message: message.replaceAll('{{submit_review_link}}', forumUrl),
          },
          { accessToken }
        )
      })
      await Promise.all(sendEmailPs)
      $('#message-reviewers').modal('hide')
      promptMessage(`Successfully sent ${totalMessagesCount} emails`)
    } catch (apiError) {
      setError(apiError.message)
    }
  }

  const getRecipients = (selecteNoteIds) => {
    if (!selecteNoteIds.length) return []
    const selectedRows = tableRowsDisplayed.filter((row) =>
      selecteNoteIds.includes(row.note.id)
    )

    switch (messageOption.value) {
      case 'allReviewers':
        return selectedRows.flatMap((row) => row.reviewers)
      case 'withReviews':
        return selectedRows
          .flatMap((row) => row.reviewers)
          .filter((reviewer) => reviewer.hasReview)
      case 'missingReviews':
        return selectedRows
          .flatMap((row) => row.reviewers)
          .filter((reviewer) => !reviewer.hasReview)
      default:
        return []
    }
  }

  useEffect(() => {
    if (!messageOption) return
    setMessage(`${
      messageOption.value === 'missingReviews'
        ? `This is a reminder to please submit your review for ${shortPhrase}.\n\n`
        : ''
    }Click on the link below to go to the review page:\n\n{{submit_review_link}}
    \n\nThank you,\n${shortPhrase} Area Chair`)
    const recipients = getRecipients(selectedNoteIds)
    const recipientsWithCount = recipients.map((recipient) => {
      const count = recipients.filter(
        (p) => p.reviewerProfileId === recipient.reviewerProfileId
      ).length
      return {
        ...recipient,
        count,
      }
    })
    setRecipientsInfo(recipientsWithCount)
  }, [messageOption, selectedNoteIds])

  return (
    <BasicModal
      id="message-reviewers"
      title={messageOption?.label}
      primaryButtonText={primaryButtonText}
      onPrimaryButtonClick={handlePrimaryButtonClick}
      primaryButtonDisabled={!totalMessagesCount}
      onClose={() => {
        setCurrentStep(1)
      }}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {currentStep === 1 ? (
        <>
          <p>
            {`You may customize the message that will be sent to the reviewers. In the email
            body, the text {{ submit_review_link }} will be replaced with a hyperlink to the
            form where the reviewer can fill out his or her review.`}
          </p>
          <div className="form-group">
            <label htmlFor="subject">Email Subject</label>
            <input
              type="text"
              name="subject"
              className="form-control"
              value={subject}
              required
              onChange={(e) => setSubject(e.target.value)}
            />
            <label htmlFor="message">Email Body</label>
            <textarea
              name="message"
              className="form-control message-body"
              rows="6"
              value={message ?? ''}
              required
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <p>
            A total of <span className="num-reviewers">{totalMessagesCount}</span> reminder
            emails will be sent to the following reviewers:
          </p>
          <div className="well reviewer-list">
            {uniqBy(recipientsInfo, (p) => p.reviewerProfileId).map((recipientInfo) => (
              <li key={recipientInfo.preferredEmail}>{`${recipientInfo.preferredName} <${
                recipientInfo.preferredEmail
              }>${recipientInfo.count > 1 ? ` --- (×${recipientInfo.count})` : ''}`}</li>
            ))}
          </div>
        </>
      )}
    </BasicModal>
  )
}

const QuerySearchInfoModal = ({ filterOperators, propertiesAllowed }) => (
  <BasicModal
    id="query-search-info"
    title="Query Search"
    primaryButtonText={null}
    cancelButtonText="OK"
  >
    <strong className="tooltip-title">Some tips to use query search</strong>
    <p>
      In Query mode, you can enter an expression and hit ENTER to search. An expression
      consists of a property and a value you would like to search for.
    </p>
    <p>
      e.g. <code>+number=5</code> will return paper number 5
    </p>
    <p>
      Expressions may also be combined with AND/OR.
      <br />
      e.g. <code>+number=5 OR number=6 OR number=7</code> will return paper 5, 6, and 7.
    </p>
    <p>
      If the value has multiple words, it should be enclosed in double quotes.
      <br />
      e.g. <code>+title=&quot;some title to search&quot;</code>
    </p>
    <p>
      Braces can be used to organize expressions.
      <br />
      e.g. <code>+number=1 OR ((number=5 AND number=7) OR number=8)</code> will return paper 1
      and 8.
    </p>
    <p>
      <strong>Operators available:</strong> {filterOperators.join(', ')}
    </p>
    <p>
      <strong>Properties available:</strong>
    </p>
    <ul className="list-unstyled">
      {Object.keys(propertiesAllowed).map((key) => (
        <li key={key}>{key}</li>
      ))}
    </ul>
  </BasicModal>
)

const MenuBar = ({
  tableRows,
  tableRowsDisplayed,
  selectedNoteIds,
  shortPhrase,
  venueId,
  officialReviewName,
  setAcConsoleData,
  filterOperators,
  propertiesAllowed,
  enableQuerySearch,
  submissionName,
}) => {
  const disabledMessageButton = selectedNoteIds.length === 0
  const messageReviewerOptions = [
    { label: 'All Reviewers of selected papers', value: 'allReviewers' },
    { label: 'Reviewers of selected papers with submitted reviews', value: 'withReviews' },
    {
      label: 'Reviewers of selected papers with unsubmitted reviews',
      value: 'missingReviews',
    },
  ]
  const sortDropdownOptions = [
    { label: 'Paper Number', value: 'Paper Number', getValue: (p) => p.note?.number },
    {
      label: 'Paper Title',
      value: 'Paper Title',
      getValue: (p) =>
        p.note?.version === 2 ? p.note?.content?.title?.value : p.note?.content?.title,
    },
    {
      label: 'Number of Forum Replies',
      value: 'Number of Forum Replies',
      getValue: (p) => p.reviewProgressData?.replyCount,
    },
    {
      label: 'Number of Reviews Submitted',
      value: 'Number of Reviews Submitted',
      getValue: (p) => p.reviewProgressData?.numReviewsDone,
    },
    {
      label: 'Number of Reviews Missing',
      value: 'Number of Reviews Missing',
      getValue: (p) =>
        (p.reviewProgressData?.numReviewersAssigned ?? 0) -
        (p.reviewProgressData?.numReviewsDone ?? 0),
    },
    {
      label: 'Average Rating',
      value: 'Average Rating',
      getValue: (p) =>
        p.reviewProgressData?.ratingAvg === 'N/A' ? 0 : p.reviewProgressData?.ratingAvg,
    },
    {
      label: 'Max Rating',
      value: 'Max Rating',
      getValue: (p) =>
        p.reviewProgressData?.ratingMax === 'N/A' ? 0 : p.reviewProgressData?.ratingMax,
    },
    {
      label: 'Min Rating',
      value: 'Min Rating',
      getValue: (p) =>
        p.reviewProgressData?.ratingMin === 'N/A' ? 0 : p.reviewProgressData?.ratingMin,
    },
    {
      label: 'Average Confidence',
      value: 'Average Confidence',
      getValue: (p) =>
        p.reviewProgressData?.confidenceAvg === 'N/A'
          ? 0
          : p.reviewProgressData?.confidenceAvg,
    },
    {
      label: 'Max Confidence',
      value: 'Max Confidenc',
      getValue: (p) =>
        p.reviewProgressData?.confidenceMax === 'N/A'
          ? 0
          : p.reviewProgressData?.confidenceMax,
    },
    {
      label: 'Min Confidence',
      value: 'Min Confidence',
      getValue: (p) =>
        p.reviewProgressData?.confidenceMin === 'N/A'
          ? 0
          : p.reviewProgressData?.confidenceMin,
    },
    {
      label: 'Meta Review Recommendation',
      value: 'Meta Review Recommendation',
      getValue: (p) => p.metaReviewData?.recommendation,
    },
  ]
  const [messageOption, setMessageOption] = useState(null)
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [queryIsInvalidStatus, setQueryIsInvalidStatus] = useState(false)
  const [isQuerySearch, setIsQuerySearch] = useState(false)
  const [sortOption, setSortOption] = useState(sortDropdownOptions[0])

  const shouldEnableQuerySearch = enableQuerySearch && filterOperators && propertiesAllowed

  const exportFileName = `${shortPhrase}${
    tableRows?.length === tableRowsDisplayed?.length
      ? ' AC paper status'
      : 'AC paper status(Filtered)'
  }`

  const handleMessageDropdownChange = (option) => {
    setMessageOption(option)
    $('#message-reviewers').modal('show')
  }

  const delaySearch = useCallback(
    debounce((term) => setSearchTerm(term), 300),
    []
  )

  const keyDownHandler = (e) => {
    if (e.key !== 'Enter' || !shouldEnableQuerySearch) return
    const cleanImmediateSearchTerm = immediateSearchTerm.trim()
    if (!cleanImmediateSearchTerm.startsWith('+')) return
    // query search
    const { filteredRows, queryIsInvalid } = filterCollections(
      tableRows,
      cleanImmediateSearchTerm.slice(1),
      filterOperators,
      propertiesAllowed,
      'note.id'
    )
    if (queryIsInvalid) {
      setQueryIsInvalidStatus(true)
      return
    }
    setAcConsoleData((acConsoleData) => ({
      ...acConsoleData,
      tableRowsDisplayed: filteredRows,
    }))
  }

  const handleQuerySearchInfoClick = () => {
    $('#query-search-info').modal('show')
  }

  const handleReverseSort = () => {
    setAcConsoleData((data) => ({
      ...data,
      tableRowsDisplayed: [...data.tableRowsDisplayed].reverse(),
    }))
  }

  useEffect(() => {
    if (!searchTerm) {
      setAcConsoleData((acConsoleData) => ({
        ...acConsoleData,
        tableRowsDisplayed: acConsoleData.tableRows,
      }))
      return
    }
    const cleanSearchTerm = searchTerm.trim().toLowerCase()
    if (shouldEnableQuerySearch && cleanSearchTerm.startsWith('+')) return // handled in keyDownHandler
    setAcConsoleData((acConsoleData) => ({
      ...acConsoleData,
      tableRowsDisplayed: acConsoleData.tableRows.filter((row) => {
        const noteTitle =
          row.note.version === 2 ? row.note.content?.title?.value : row.note.content?.title
        return (
          row.note.number == cleanSearchTerm || // eslint-disable-line eqeqeq
          noteTitle.toLowerCase().includes(cleanSearchTerm)
        )
      }),
    }))
  }, [searchTerm])

  useEffect(() => {
    setAcConsoleData((data) => ({
      ...data,
      tableRowsDisplayed: orderBy(data.tableRowsDisplayed, sortOption.getValue),
    }))
  }, [sortOption])

  return (
    <div className="menu-bar">
      <div className="message-button-container btn-group" role="group">
        <button
          type="button"
          className="message-button btn btn-icon dropdown-toggle"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
          title="Select papers to message corresponding reviewers"
          disabled={disabledMessageButton}
        >
          <Icon name="envelope" extraClasses="pr-1" /> Message <span className="caret" />
        </button>
        <ul
          className="dropdown-menu message-button-dropdown"
          aria-labelledby="grp-msg-reviewers-btn"
        >
          {messageReviewerOptions.map((option) => (
            <li key={option.value}>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a id={option.value} onClick={() => handleMessageDropdownChange(option)}>
                {option.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <ExportCSV records={tableRowsDisplayed} fileName={exportFileName} />

      <span className="search-label">Search:</span>
      {isQuerySearch && shouldEnableQuerySearch && (
        <div role="button" onClick={handleQuerySearchInfoClick}>
          <Icon name="info-sign" extraClasses="pr-1" />
        </div>
      )}
      <input
        className={`form-control search-input${queryIsInvalidStatus ? ' invalid-value' : ''}`}
        placeholder={`Enter search term${
          shouldEnableQuerySearch ? ', or type + to start a query and press enter' : ''
        }`}
        value={immediateSearchTerm}
        onChange={(e) => {
          setImmediateSearchTerm(e.target.value)
          setQueryIsInvalidStatus(false)
          setIsQuerySearch(e.target.value.trim().startsWith('+'))
          delaySearch(e.target.value)
        }}
        onKeyDown={(e) => keyDownHandler(e)}
      />

      <span className="sort-label">Sort by:</span>
      <Dropdown
        className="sort-dropdown"
        value={sortOption}
        options={sortDropdownOptions}
        onChange={(e) => setSortOption(e)}
      />
      <button className="btn btn-icon sort-button" onClick={handleReverseSort}>
        <Icon name="sort" />
      </button>

      <MessageReviewersModal
        tableRowsDisplayed={tableRowsDisplayed}
        messageOption={messageOption}
        shortPhrase={shortPhrase}
        selectedNoteIds={selectedNoteIds}
        venueId={venueId}
        officialReviewName={officialReviewName}
        submissionName={submissionName}
      />
      {shouldEnableQuerySearch && (
        <QuerySearchInfoModal
          filterOperators={filterOperators}
          propertiesAllowed={propertiesAllowed}
        />
      )}
    </div>
  )
}

const AssignedPaperRow = ({
  rowData,
  venueId,
  areaChairName,
  officialReviewName,
  submissionName,
  metaReviewContentField,
  selectedNoteIds,
  setSelectedNoteIds,
  shortPhrase,
}) => {
  const { note, metaReviewData } = rowData
  const referrerUrl = encodeURIComponent(
    `[Area Chair Console](/group?id=${venueId}/${areaChairName}#assigned-papers)`
  )
  return (
    <tr>
      <td>
        <input
          type="checkbox"
          checked={selectedNoteIds.includes(note.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedNoteIds((noteIds) => [...noteIds, note.id])
              return
            }
            setSelectedNoteIds((noteIds) => noteIds.filter((p) => p !== note.id))
          }}
        />
      </td>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={note.version === 2} />
      </td>
      <td>
        <AreaChairConsoleNoteReviewStatus
          rowData={rowData}
          venueId={venueId}
          officialReviewName={officialReviewName}
          referrerUrl={referrerUrl}
          shortPhrase={shortPhrase}
          submissionName={submissionName}
        />
      </td>
      <td>
        <AreaChairConsoleNoteMetaReviewStatus
          note={note}
          metaReviewData={metaReviewData}
          metaReviewContentField={metaReviewContentField}
          referrerUrl={referrerUrl}
        />
      </td>
    </tr>
  )
}

const AreaChairConsoleTasks = ({ venueId, areaChairName, apiVersion }) => {
  const { accessToken } = useUser()
  const [invitations, setInvitations] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const addInvitaitonTypeAndVersion = (invitation) => {
    let invitaitonType = 'tagInvitation'
    if (apiVersion === 2 && invitation.edit?.note) invitaitonType = 'noteInvitation'
    if (apiVersion === 1 && !invitation.reply.content?.tag && !invitation.reply.content?.head)
      invitaitonType = 'noteInvitation'
    return { ...invitation, [invitaitonType]: true, apiVersion }
  }

  // for note invitations only
  const filterHasReplyTo = (invitation) => {
    if (!invitation.noteInvitation) return true
    if (apiVersion === 2) {
      const result = invitation.edit?.note?.replyto?.const || invitation.edit?.note?.id?.const
      return result
    }
    const result = invitation.reply.replyto || invitation.reply.referent
    return result
  }
  const loadInvitations = async () => {
    try {
      let allInvitations = await api.getAll(
        '/invitations',
        {
          ...(apiVersion !== 2 && { regex: `${venueId}/.*` }),
          ...(apiVersion === 2 && { prefix: `${venueId}/.*` }),
          invitee: true,
          duedate: true,
          type: 'all',
        },
        { accessToken, version: apiVersion }
      )

      allInvitations = allInvitations
        .map((p) => addInvitaitonTypeAndVersion(p))
        .filter((p) => filterHasReplyTo(p))
        .filter((p) => p.invitees.some((q) => q.includes(areaChairName)))

      if (allInvitations.length) {
        // add details
        const validInvitationDetails = await api.getAll('/invitations', {
          ids: allInvitations.map((p) => p.id),
          details: 'all',
          select: 'id,details',
        })

        allInvitations.forEach((p) => {
          // eslint-disable-next-line no-param-reassign
          p.details = validInvitationDetails.find((q) => q.id === p.id)?.details
        })
      }

      setInvitations(formatTasksData([allInvitations, [], []], true))
    } catch (error) {
      promptError(error.message)
    }
    setIsLoading(false)
  }
  useEffect(() => {
    loadInvitations()
  }, [])

  return (
    <TaskList
      invitations={invitations}
      emptyMessage={isLoading ? 'Loading...' : 'No outstanding tasks for this conference'}
      referrer={encodeURIComponent(
        `[Area Chair Console](/group?id=${venueId}/${areaChairName}#areachair-tasks)`
      )}
    />
  )
}

const AreaChairConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    apiVersion,
    reviewerAssignment,
    submissionInvitationId,
    seniorAreaChairsId,
    areaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    reviewConfidenceName,
    officialMetaReviewName,
    metaReviewContentField,
    shortPhrase,
    filterOperators: filterOperatorsConfig, // for query search only
    propertiesAllowed: propertiesAllowedConfig, // for query search only
    enableQuerySearch, // for query search only
  } = useContext(WebFieldContext)
  const {
    showEdgeBrowserUrl,
    proposedAssignmentTitle,
    edgeBrowserProposedUrl,
    edgeBrowserDeployedUrl,
  } = reviewerAssignment ?? {}
  const { user, accessToken, userLoading } = useUser()
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent } = appContext
  const [acConsoleData, setAcConsoleData] = useState({})
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [selectedNoteIds, setSelectedNoteIds] = useState([])

  let filterOperators = ['!=', '>=', '<=', '>', '<', '='] // sequence matters
  let propertiesAllowed = {
    number: ['note.number'],
    id: ['note.id'],
    title: ['note.content.title', 'note.content.title.value'],
    author: [
      'note.content.authors',
      'note.content.authorids',
      'note.content.authors.value',
      'note.content.authorids.value',
    ],
    keywords: ['note.content.keywords', 'note.content.keywords.value'],
    reviewer: ['reviewers'],
    numReviewersAssigned: ['reviewProgressData.numReviewersAssigned'],
    numReviewsDone: ['reviewProgressData.numReviewsDone'],
    ratingAvg: ['reviewProgressData.ratingAvg'],
    ratingMax: ['reviewProgressData.ratingMax'],
    ratingMin: ['reviewProgressData.ratingMin'],
    confidenceAvg: ['reviewProgressData.confidenceAvg'],
    confidenceMax: ['reviewProgressData.confidenceMax'],
    confidenceMin: ['reviewProgressData.confidenceMin'],
    replyCount: ['reviewProgressData.replyCount'],
    recommendation: ['metaReviewData.recommendation'],
  }
  if (filterOperatorsConfig) filterOperators = filterOperatorsConfig
  if (propertiesAllowedConfig) propertiesAllowed = propertiesAllowedConfig

  const edgeBrowserUrl = proposedAssignmentTitle
    ? edgeBrowserProposedUrl
    : edgeBrowserDeployedUrl
  const headerInstructions = showEdgeBrowserUrl
    ? `${header.instructions}<p><strong>Reviewer Assignment Browser: </strong><a id="edge_browser_url" href="${edgeBrowserUrl}"" target="_blank" rel="nofollow">Modify Reviewer Assignments</a></p>`
    : header.instructions

  const getReviewerName = (reviewerProfile) => {
    const name =
      reviewerProfile.content.names.find((t) => t.preferred) ||
      reviewerProfile.content.names[0]
    return name ? prettyId(reviewerProfile.id) : `${name.first} ${name.last}`
  }

  const loadData = async () => {
    try {
      const allGroups = await api.getAll(
        '/groups',
        {
          member: user.id,
          regex: `${venueId}/${submissionName}.*`,
          select: 'id',
        },
        { accessToken }
      )
      const areaChairGroups = allGroups.filter((p) => p.id.endsWith(areaChairName))
      const anonymousAreaChairGroups = allGroups.filter((p) => p.id.includes('/Area_Chair_'))
      const areaChairPaperNums = areaChairGroups.flatMap((p) => {
        const num = getNumberFromGroup(p.id, submissionName)
        const anonymousAreaChairGroup = anonymousAreaChairGroups.find((q) =>
          q.id.startsWith(`${venueId}/${submissionName}${num}/Area_Chair_`)
        )
        if (anonymousAreaChairGroup) return num
        return []
      })

      const noteNumbers = [...new Set(areaChairPaperNums)]
      const blindedNotesP = noteNumbers.length
        ? api.getAll(
            '/notes',
            {
              invitation: submissionInvitationId,
              number: noteNumbers.join(','),
              select: 'id,number,forum,content,details,invitation,version',
              details: 'invitation,replyCount,directReplies',
              sort: 'number:asc',
            },
            { accessToken, version: apiVersion }
          )
        : Promise.resolve([])

      // #region getReviewerGroups(noteNumbers)
      const reviewerGroupsP = api
        .getAll(
          '/groups',
          {
            regex: `${venueId}/${submissionName}.*`,
            select: 'id,members',
          },
          { accessToken }
        )
        .then((reviewerGroupsResult) => {
          const anonymousReviewerGroups = reviewerGroupsResult.filter((p) =>
            p.id.includes('/Reviewer_')
          )
          const reviewerGroups = reviewerGroupsResult.filter((p) =>
            p.id.includes('/Reviewers')
          )
          return noteNumbers.map((p) => {
            const reviewers = reviewerGroups
              .find((q) => getNumberFromGroup(q.id, submissionName) === p)
              ?.members.flatMap((r) => {
                const anonymousReviewerGroup = anonymousReviewerGroups.find(
                  (t) =>
                    t.id.startsWith(`${venueId}/${submissionName}${p}/Reviewer_`) &&
                    t.members[0] === r
                )
                if (anonymousReviewerGroup) {
                  const anonymousReviewerId = getIndentifierFromGroup(
                    anonymousReviewerGroup.id,
                    'Reviewer_'
                  )
                  return {
                    anonymousId: anonymousReviewerId,
                    reviewerProfileId: r,
                  }
                }
                return []
              })
            return {
              number: p,
              reviewers,
            }
          })
        })

      // #endregion

      // #region assigned SAC
      const assignedSACP = seniorAreaChairsId
        ? api
            .get(
              '/edges',
              { invitation: `${seniorAreaChairsId}/-/Assignment`, head: user.profile.id },
              { accessToken }
            )
            .then((result) => {
              if (result?.edges?.length) return result.edges[0].tail
              return null
            })
        : Promise.resolve()
      // #endregion

      const result = await Promise.all([blindedNotesP, reviewerGroupsP, assignedSACP])

      // #region get assigned reviewer , sac and all reviewer group members profiles
      const allIds = [
        ...new Set([
          ...result[1].flatMap((p) => p.reviewers).map((p) => p.reviewerProfileId),
          ...(result[2] ? [result[2]] : []),
        ]),
      ]
      const ids = allIds.filter((p) => p.startsWith('~'))
      const emails = allIds.filter((p) => p.match(/.+@.+/))
      const getProfilesByIdsP = ids.length
        ? api.post(
            '/profiles/search',
            {
              ids,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const getProfilesByEmailsP = emails.length
        ? api.post(
            '/profiles/search',
            {
              emails,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const profileResults = await Promise.all([getProfilesByIdsP, getProfilesByEmailsP])
      // #endregion

      // #region calculate reviewProgressData and metaReviewData
      const notes = result[0]
      const allProfiles = (profileResults[0].profiles ?? []).concat(
        profileResults[1].profiles ?? []
      )
      const tableRows = notes.map((note) => {
        const assignedReviewers =
          result[1].find((p) => p.number === note.number)?.reviewers ?? []
        const assignedReviewerProfiles = assignedReviewers.map((reviewer) =>
          allProfiles.find(
            (p) =>
              p.content.names.some((q) => q.username === reviewer.reviewerProfileId) ||
              p.content.emails.includes(reviewer.reviewerProfileId)
          )
        )
        const officialReviews = (note.details.directReplies ?? [])
          .filter((p) => {
            const officalReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
            return p.version === 2
              ? p.invitations.includes(officalReviewInvitationId)
              : p.invitation === officalReviewInvitationId
          })
          ?.map((q) => {
            const isV2Note = q.version === 2
            const anonymousId = getIndentifierFromGroup(q.signatures[0], 'Reviewer_')
            const reviewRatingValue = isV2Note
              ? q.content[reviewRatingName]?.value
              : q.content[reviewRatingName]
            const ratingNumber = reviewRatingValue
              ? reviewRatingValue.substring(0, reviewRatingValue.indexOf(':'))
              : null
            const confidenceValue = isV2Note
              ? q.content[reviewConfidenceName]?.value
              : q.content[reviewConfidenceName]
            const confidenceMatch = confidenceValue && confidenceValue.match(/^(\d+): .*/)
            const reviewValue = isV2Note ? q.content.review?.value : q.content.review
            return {
              anonymousId,
              confidence: confidenceMatch ? parseInt(confidenceMatch[1], 10) : null,
              rating: ratingNumber ? parseInt(ratingNumber, 10) : null,
              reviewLength: reviewValue?.length,
              id: q.id,
            }
          })
        const ratings = officialReviews.map((p) => p.rating)
        const validRatings = ratings.filter((p) => p !== null)
        const ratingAvg = validRatings.length
          ? (validRatings.reduce((sum, curr) => sum + curr, 0) / validRatings.length).toFixed(
              2
            )
          : 'N/A'
        const ratingMin = validRatings.length ? Math.min(...validRatings) : 'N/A'
        const ratingMax = validRatings.length ? Math.max(...validRatings) : 'N/A'

        const confidences = officialReviews.map((p) => p.confidence)
        const validConfidences = confidences.filter((p) => p !== null)
        const confidenceAvg = validConfidences.length
          ? (
              validConfidences.reduce((sum, curr) => sum + curr, 0) / validConfidences.length
            ).toFixed(2)
          : 'N/A'
        const confidenceMin = validConfidences.length ? Math.min(...validConfidences) : 'N/A'
        const confidenceMax = validConfidences.length ? Math.max(...validConfidences) : 'N/A'

        const metaReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`
        const metaReview = note.details.directReplies.find((p) =>
          p.version === 2
            ? p.invitations.includes(metaReviewInvitationId)
            : p.invitation === metaReviewInvitationId
        )
        return {
          note,
          reviewers: result[1]
            .find((p) => p.number === note.number)
            ?.reviewers?.map((reviewer) => {
              const profile = allProfiles.find(
                (p) =>
                  p.content.names.some((q) => q.username === reviewer.reviewerProfileId) ||
                  p.content.emails.includes(reviewer.reviewerProfileId)
              )
              return {
                ...reviewer,
                type: 'reviewer',
                profile,
                hasReview: officialReviews.some((p) => p.anonymousId === reviewer.anonymousId),
                noteNumber: note.number,
                preferredName: profile ? getReviewerName(profile) : reviewer.reviewerProfileId,
                preferredEmail: profile
                  ? profile.content.preferredEmail ?? profile.content.emails[0]
                  : reviewer.reviewerProfileId,
              }
            }),
          reviewerProfiles: assignedReviewerProfiles,
          officialReviews,
          reviewProgressData: {
            reviewers: assignedReviewerProfiles,
            numReviewersAssigned: assignedReviewers.length,
            numReviewsDone: officialReviews.length,
            ratingAvg,
            ratingMax,
            ratingMin,
            confidenceAvg,
            confidenceMax,
            confidenceMin,
            replyCount: note.details.replyCount,
          },
          metaReviewData: {
            [metaReviewContentField]:
              metaReview?.version === 2
                ? metaReview?.content[metaReviewContentField]?.value
                : metaReview?.content[metaReviewContentField],
            metaReviewInvitationId: `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`,
            metaReview,
          },
        }
      })

      const sacProfile = allProfiles.find(
        (p) =>
          p.content.names.some((q) => q.username === result[2]) ||
          p.content.emails.includes(result[2])
      )
      // #endregion
      setAcConsoleData({
        tableRows,
        tableRowsDisplayed: tableRows,
        reviewersInfo: result[1],
        allProfiles,
        sacProfile: sacProfile
          ? {
              id: sacProfile.id,
              email: sacProfile.content.preferredEmail ?? sacProfile.content.emails[0],
            }
          : null,
      })
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
  }

  const renderTable = () => {
    if (acConsoleData.tableRows?.length === 0)
      return (
        <p className="empty-message">
          No assigned papers.Check back later or contact info@openreview.net if you believe
          this to be an error.
        </p>
      )
    if (acConsoleData.tableRowsDisplayed?.length === 0)
      return (
        <div className="table-container empty-table-container">
          <MenuBar
            tableRows={acConsoleData.tableRows}
            tableRowsDisplayed={acConsoleData.tableRowsDisplayed}
            selectedNoteIds={selectedNoteIds}
            shortPhrase={shortPhrase}
            venueId={venueId}
            officialReviewName={officialReviewName}
            setAcConsoleData={setAcConsoleData}
            filterOperators={filterOperators}
            propertiesAllowed={propertiesAllowed}
            enableQuerySearch={enableQuerySearch}
            submissionName={submissionName}
          />
          <p className="empty-message">No assigned papers matching search criteria.</p>
        </div>
      )
    return (
      <div className="table-container">
        <MenuBar
          tableRows={acConsoleData.tableRows}
          tableRowsDisplayed={acConsoleData.tableRowsDisplayed}
          selectedNoteIds={selectedNoteIds}
          shortPhrase={shortPhrase}
          venueId={venueId}
          officialReviewName={officialReviewName}
          setAcConsoleData={setAcConsoleData}
          filterOperators={filterOperators}
          propertiesAllowed={propertiesAllowed}
          enableQuerySearch={enableQuerySearch}
          submissionName={submissionName}
        />
        <Table
          className="console-table table-striped areachair-console-table"
          headings={[
            {
              id: 'select-all',
              content: (
                <SelectAllCheckBox
                  selectedNoteIds={selectedNoteIds}
                  setSelectedNoteIds={setSelectedNoteIds}
                  allNoteIds={acConsoleData.tableRowsDisplayed?.map((row) => row.note.id)}
                />
              ),
            },
            { id: 'number', content: '#' },
            { id: 'summary', content: 'Paper Summary' },
            { id: 'reviewProgress', content: 'Review Progress', width: '30%' },
            { id: 'metaReviewStatus', content: 'Meta Review Status' },
          ]}
        >
          {acConsoleData.tableRowsDisplayed?.map((row) => (
            <AssignedPaperRow
              key={row.note.id}
              rowData={row}
              venueId={venueId}
              areaChairName={areaChairName}
              officialReviewName={officialReviewName}
              officialMetaReviewName={officialMetaReviewName}
              submissionName={submissionName}
              metaReviewContentField={metaReviewContentField}
              selectedNoteIds={selectedNoteIds}
              setSelectedNoteIds={setSelectedNoteIds}
              shortPhrase={shortPhrase}
            />
          ))}
        </Table>
      </div>
    )
  }

  useEffect(() => {
    if (!query) return

    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      setBannerContent(venueHomepageLink(venueId))
    }
  }, [query, venueId])

  useEffect(() => {
    if (!userLoading && (!user || !user.profile || user.profile.id === 'guest')) {
      router.replace(
        `/login?redirect=${encodeURIComponent(
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        )}`
      )
    }
  }, [user, userLoading])

  useEffect(() => {
    if (
      userLoading ||
      !user ||
      !group ||
      !venueId ||
      !submissionName ||
      !officialReviewName ||
      !submissionInvitationId
    )
      return
    loadData()
  }, [user, userLoading, group])

  useEffect(() => {
    if (acConsoleData.notes) {
      typesetMathJax()
    }
  }, [acConsoleData.notes])

  const missingConfig = Object.entries({
    header,
    group,
    venueId,
    apiVersion,
    reviewerAssignment,
    submissionInvitationId,
    seniorAreaChairsId,
    areaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    reviewConfidenceName,
    officialMetaReviewName,
    metaReviewContentField,
    shortPhrase,
    enableQuerySearch,
  })
    .filter(([key, value]) => value === undefined)
    .map((p) => p[0])
  if (missingConfig.length > 0) {
    const errorMessage = `AC Console is missing required properties: ${missingConfig.join(
      ', '
    )}`
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }

  return (
    <>
      <BasicHeader
        title={header?.title}
        instructions={`${headerInstructions}${
          acConsoleData.sacProfile
            ? `<p class="dark">Your assigned Senior Area Chair is <a href="https://openreview.net/profile?id=${
                acConsoleData.sacProfile.id
              }" target="_blank">${prettyId(acConsoleData.sacProfile.id)}</a> (${
                acConsoleData.sacProfile.email
              })`
            : ''
        }`}
      />

      <Tabs>
        <TabList>
          <Tab id="assigned-papers" active>
            Assigned Papers
          </Tab>
          <Tab id="areachair-tasks" onClick={() => setActiveTabIndex(1)}>
            Area Chair Tasks
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="assigned-papers">{renderTable()}</TabPanel>
          <TabPanel id="areachair-tasks">
            {activeTabIndex === 1 && (
              <AreaChairConsoleTasks
                venueId={venueId}
                areaChairName={areaChairName}
                apiVersion={apiVersion}
              />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default AreaChairConsole
