import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import Table from '../Table'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import api from '../../lib/api-client'
import ErrorDisplay from '../ErrorDisplay'
import { formatTasksData, getNumberFromGroup, prettyId } from '../../lib/utils'
import Dropdown from '../Dropdown'
import Icon from '../Icon'
import NoteSummary from './NoteSummary'
import { AreaChairConsoleNoteReviewStatus } from './NoteReviewStatus'
import { AreaChairConsoleNoteMetaReviewStatus } from './NoteMetaReviewStatus'
import TaskList from '../TaskList'
import BasicModal from '../BasicModal'
import { debounce, uniqBy } from 'lodash'

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
  notes,
  messageOption,
  shortPhrase,
  selectedNoteIds,
  reviewersInfo,
  venueId,
  officialReviewName,
  allProfiles,
}) => {
  const { accessToken } = useUser()
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState(null)
  const [subject, setSubject] = useState(`${shortPhrase} Reminder`)
  const [message, setMessage] =
    useState(`Click on the link below to go to the review page:\n\n[[SUBMIT_REVIEW_LINK]]
  \n\nThank you,\n${shortPhrase} Area Chair`)
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
        const note = notes.find((p) => p.id === noteId)
        const reviewerIds = recipientsInfo
          .filter((p) => p.noteNumber === note.number)
          .map((q) => q.reviewerProfileId)
        if (!reviewerIds.length) return Promise.resolve()
        const forumUrl = `https://openreview.net/forum?id=${note.forum}&noteId=${noteId}&invitation=${venueId}/Paper${note.number}/-/${officialReviewName}`
        return api.post(
          '/messages',
          {
            groups: reviewerIds,
            subject: subject,
            message: message.replace('[[SUBMIT_REVIEW_LINK]]', forumUrl),
          },
          { accessToken }
        )
      })
      await Promise.all(sendEmailPs)
      $('#message-reviewers').modal('hide')
      promptMessage(`Successfully sent ${totalMessagesCount} emails`)
    } catch (error) {
      setError(error.message)
    }
  }

  const getRecipients = (messageOption, selecteNoteIds) => {
    if (!selecteNoteIds.length) return []
    const selectedNoteNumbers = notes
      ?.filter((p) => selectedNoteIds.includes(p.id))
      .map((q) => q.number)
    const selectedReviewerIds = reviewersInfo
      ?.filter((p) => selectedNoteNumbers.includes(p.number))
      .flatMap((q) => q.reviewers.map((r) => ({ ...r, noteNumber: q.number })))
    const officialReviewsOfSelectedNotes = notes
      ?.filter((p) => selectedNoteIds.includes(p.id))
      ?.flatMap((q) =>
        q.details.directReplies.filter(
          (r) => r.invitation === `${venueId}/Paper${q.number}/-/${officialReviewName}`
        )
      )
    const anonymousIdsOfOfficialReviews = officialReviewsOfSelectedNotes.map((p) => {
      return getNumberFromGroup(p.signatures[0], 'Reviewer_', false)
    })
    switch (messageOption.value) {
      case 'allReviewers':
        return selectedReviewerIds
      case 'withReviews':
        return selectedReviewerIds.filter((p) =>
          anonymousIdsOfOfficialReviews.includes(p.anonymousId)
        )
      case 'missingReviews':
        return selectedReviewerIds.filter(
          (p) => !anonymousIdsOfOfficialReviews.includes(p.anonymousId)
        )
      default:
        return []
    }
  }
  const getReviewerName = (reviewerProfile) => {
    const name =
      reviewerProfile.content.names.find((t) => t.preferred) ||
      reviewerProfile.content.names[0]
    return name ? prettyId(reviewerProfile.id) : `${name.first} ${name.last}`
  }
  useEffect(() => {
    if (!messageOption) return
    const recipients = getRecipients(messageOption, selectedNoteIds)
    const recipientsInfo = recipients.map((recipient) => {
      const reviewerProfile = allProfiles.find(
        (p) =>
          p.content.names.some((q) => q.username === recipient.reviewerProfileId) ||
          p.content.emails.includes(recipient.reviewerProfileId)
      )
      const count = recipients.filter(
        (p) => p.reviewerProfileId === recipient.reviewerProfileId
      ).length
      const preferredName = reviewerProfile
        ? getReviewerName(reviewerProfile)
        : reviewer.reviewerProfileId
      const preferredEmail = reviewerProfile
        ? reviewerProfile.content.preferredEmail ?? reviewerProfile.content.emails[0]
        : reviewer.reviewerProfileId
      return {
        noteNumber: recipient.noteNumber,
        reviewerProfileId: recipient.reviewerProfileId,
        preferredName,
        preferredEmail,
        count,
      }
    })
    setRecipientsInfo(recipientsInfo)
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
            You may customize the message that will be sent to the reviewers. In the email
            body, the text [[SUBMIT_REVIEW_LINK]] will be replaced with a hyperlink to the form
            where the reviewer can fill out his or her review.
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
              value={message}
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

const MenuBar = ({
  notes,
  selectedNoteIds,
  shortPhrase,
  reviewersInfo,
  venueId,
  officialReviewName,
  allProfiles,
  setAcConsoleData,
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
  const [messageOption, setMessageOption] = useState(null)
  const [immediateSearchTerm, setImmediateSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const handleMessageDropdownChange = (option) => {
    setMessageOption(option)
    $('#message-reviewers').modal('show')
  }

  const delaySearch = useCallback(
    debounce((term) => setSearchTerm(term), 300),
    []
  )

  useEffect(() => {
    if (!searchTerm) {
      setAcConsoleData((acConsoleData) => ({
        ...acConsoleData,
        notesDisplayed: notes,
      }))
      return
    }
    const cleanSearchTerm = searchTerm.trim().toLowerCase()
    setAcConsoleData((acConsoleData) => ({
      ...acConsoleData,
      notesDisplayed: notes.filter(
        (note) =>
          note.number == cleanSearchTerm ||
          note.content.title.toLowerCase().includes(cleanSearchTerm)
      ),
    }))
  }, [searchTerm])

  return (
    <div className="menu-bar">
      <div className="message-button-container">
        <button className={`btn message-button${disabledMessageButton ? ' disabled' : ''}`}>
          <Icon name="envelope" />
          <Dropdown
            className={`dropdown-sm message-button-dropdown${
              disabledMessageButton ? ' dropdown-disabled' : ''
            }`}
            options={messageReviewerOptions}
            components={{
              IndicatorSeparator: () => null,
              DropdownIndicator: () => null,
            }}
            value={{ label: 'Message', value: '' }}
            onChange={handleMessageDropdownChange}
          />
        </button>
      </div>
      <div className="btn-group">
        <button className="btn btn-export-data">Export</button>
      </div>
      <span className="search-label">Search:</span>
      <input
        className="form-control search-input"
        placeholder="Enter search term or type + to start a query and press enter"
        value={immediateSearchTerm}
        onChange={(e) => {
          setImmediateSearchTerm(e.target.value)
          delaySearch(e.target.value)
        }}
      />
      <span className="sort-label">Sort by:</span>
      <Dropdown
        className="dropdown-sm sort-dropdown"
        value={{ label: 'Paper Number', value: '' }}
        options={[{ label: 'test123' }]}
      />
      <button className="btn btn-icon sort-button">
        <Icon name="sort" />
      </button>
      <MessageReviewersModal
        notes={notes}
        messageOption={messageOption}
        shortPhrase={shortPhrase}
        selectedNoteIds={selectedNoteIds}
        reviewersInfo={reviewersInfo}
        venueId={venueId}
        officialReviewName={officialReviewName}
        allProfiles={allProfiles}
      />
    </div>
  )
}

const AssignedPaperRow = ({
  note,
  venueId,
  areaChairName,
  reviewersInfo,
  officialReviewName,
  reviewRatingName,
  reviewConfidenceName,
  enableReviewerReassignment,
  reviewerRankingByPaper,
  reviewerGroupMembers,
  allProfiles,
  reviewerGroupWithConflict,
  officialMetaReviewName,
  submissionName,
  metaReviewContentField,
  selectedNoteIds,
  setSelectedNoteIds,
}) => {
  const referrerUrl = encodeURIComponent(
    `[Area Chair Console](/group?id=${venueId}/${areaChairName}#assigned-papers)`
  )
  const assignedReviewers =
    reviewersInfo.find((p) => p.number === note.number)?.reviewers ?? []
  const ratingExp = /^(\d+): .*/
  const officialReviews = (note.details.directReplies ?? [])
    .filter((p) => p.invitation === `${venueId}/Paper${note.number}/-/${officialReviewName}`)
    ?.map((q) => {
      const anonymousId = getNumberFromGroup(q.signatures[0], 'Reviewer_', false)
      const ratingNumber = q.content[reviewRatingName]
        ? q.content[reviewRatingName].substring(0, q.content[reviewRatingName].indexOf(':'))
        : null
      const confidenceMatch =
        q.content[reviewConfidenceName] && q.content[reviewConfidenceName].match(ratingExp)
      return {
        anonymousId: anonymousId,
        confidence: confidenceMatch ? parseInt(confidenceMatch[1], 10) : null,
        rating: ratingNumber ? parseInt(ratingNumber, 10) : null,
        reviewLength: q.content.review?.length,
        id: q.id,
      }
    })
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
        <NoteSummary note={note} referrerUrl={referrerUrl} />
      </td>
      <td>
        <AreaChairConsoleNoteReviewStatus
          note={note}
          assignedReviewers={assignedReviewers}
          officialReviews={officialReviews}
          enableReviewerReassignment={enableReviewerReassignment}
          referrerUrl={referrerUrl}
          venueId={venueId}
          officialReviewName={officialReviewName}
          allProfiles={allProfiles}
          reviewerGroupMembers={reviewerGroupMembers}
          reviewerGroupWithConflict={reviewerGroupWithConflict}
        />
      </td>
      <td>
        <AreaChairConsoleNoteMetaReviewStatus
          note={note}
          venueId={venueId}
          submissionName={submissionName}
          officialMetaReviewName={officialMetaReviewName}
          metaReviewContentField={metaReviewContentField}
          referrerUrl={referrerUrl}
        />
      </td>
    </tr>
  )
}

const AreaChairConsoleTasks = ({ venueId, areaChairName, apiVersion }) => {
  const wildcardInvitation = `${venueId}/.*`

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
          regex: wildcardInvitation,
          invitee: true,
          duedate: true,
          type: 'all',
        },
        { accessToken, version: apiVersion }
      )

      allInvitations = allInvitations
        .map((p) => addInvitaitonTypeAndVersion(p))
        .filter((p) => filterHasReplyTo(p))
        .filter((p) => p.invitees.indexOf(areaChairName) !== -1)

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
        `[Area Chair Console](/group?id=${venueId}/${areaChairName}'#areachair-tasks)`
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
    enableEditReviewAssignments,
    reviewerAssignmentTitle,
    edgeBrowserProposedUrl,
    edgeBrowserDeployedUrl,
    blindSubmissionInvitationId,
    seniorAreaChairsId,
    areaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    reviewConfidenceName,
    enableReviewerReassignment,
    reviewerPaperRankingInvitationId,
    reviewerGroup,
    reviewerGroupWithConflict,
    officialMetaReviewName,
    metaReviewContentField,
    shortPhrase,
  } = useContext(WebFieldContext)
  const { user, accessToken, userLoading } = useUser()
  const router = useRouter()
  const query = useQuery()
  const { setBannerContent } = appContext
  const [acConsoleData, setAcConsoleData] = useState({})
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [selectedNoteIds, setSelectedNoteIds] = useState([])

  let edgeBrowserUrl = reviewerAssignmentTitle
    ? edgeBrowserProposedUrl
    : edgeBrowserDeployedUrl
  const headerInstructions = enableEditReviewAssignments
    ? `${header.instructions}<p><strong>Reviewer Assignment Browser: </strong><a id="edge_browser_url" href="${edgeBrowserUrl}"" target="_blank" rel="nofollow">Modify Reviewer Assignments</a></p>`
    : header.instructions

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
      const areaChairGroups = allGroups.filter((p) => p.id.endsWith('Area_Chairs'))
      const anonymousAreaChairGroups = allGroups.filter((p) => p.id.includes('/Area_Chair_'))
      const areaChairPaperNums = areaChairGroups.flatMap((p) => {
        const num = getNumberFromGroup(p.id, submissionName)
        const anonymousAreaChairGroup = anonymousAreaChairGroups.find((q) =>
          q.id.startsWith(`${venueId}/Paper${num}/Area_Chair_`)
        )
        if (anonymousAreaChairGroup) return num
        return []
      })

      const noteNumbers = [...new Set(areaChairPaperNums)]
      const blindedNotesP = noteNumbers.length
        ? api.getAll('/notes', {
            invitation: blindSubmissionInvitationId,
            number: noteNumbers.join(','),
            select: 'id,number,forum,content,details,invitation',
            details: 'invitation,replyCount,directReplies',
            sort: 'number:asc',
          })
        : Promise.resolve([])

      //#region getReviewerGroups(noteNumbers)
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
                  (t) => t.id.startsWith(`${venueId}/Paper${p}/Reviewer_`) && t.members[0] == r
                )
                if (anonymousReviewerGroup) {
                  const anonymousReviewerId = getNumberFromGroup(
                    anonymousReviewerGroup.id,
                    'Reviewer_',
                    false
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
              reviewers: reviewers,
            }
          })
        })

      //#endregion

      //#region assigned SAC
      const assignedSACP = seniorAreaChairsId
        ? api
            .get(
              '/edges',
              { invitation: `${seniorAreaChairsId}/-/Assignment`, head: user.profile.id },
              { accessToken }
            )
            .then((result) => {
              if (result?.edges?.length) return result.edges[0].tail
            })
        : Promise.resolve()
      //#endregion

      //#region reviewer paper ranking
      const reviewerPaperRankingsP = api
        .get(
          '/tags',
          {
            invitation: reviewerPaperRankingInvitationId,
          },
          { accessToken }
        )
        .then((result) => {
          return result.tags.reduce((rankingByForum, tag) => {
            if (!rankingByForum[tag.forum]) {
              rankingByForum[tag.forum] = {}
            }
            var index = getNumberFromGroup(tag.signatures[0], 'Reviewer_')
            rankingByForum[tag.forum][index] = tag
            return rankingByForum
          }, {})
        })
      //#endregion

      //#region  get all reviewers for reassignment dropdown
      const reviewerGroupMembersP = enableReviewerReassignment
        ? api
            .get('/groups', { id: reviewerGroup, select: 'members' }, { accessToken })
            .then((result) => {
              return result.groups[0].members
            })
        : Promise.resolve([])
      //#endregion

      const result = await Promise.all([
        blindedNotesP,
        reviewerGroupsP,
        assignedSACP,
        reviewerPaperRankingsP,
        reviewerGroupMembersP,
      ])

      //#region get assigned reviewer , sac and all reviewer group members profiles
      const allIds = [
        ...new Set([
          ...result[1].flatMap((p) => p.reviewers).map((p) => p.reviewerProfileId),
          ...(result[2] ?? []),
          ...result[4],
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
      //#endregion

      setAcConsoleData({
        notes: result[0],
        notesDisplayed: result[0],
        reviewersInfo: result[1],
        reviewerRankingByPaper: result[3],
        reviewerGroupMembers: result[4],
        allProfiles: profileResults[0].profiles.concat(profileResults[1].profiles),
      })
    } catch (error) {
      promptError(error.message)
    }
  }

  const renderTable = () => {
    if (acConsoleData.notes?.length === 0)
      return (
        <p className="empty-message">
          No assigned papers.Check back later or contact info@openreview.net if you believe
          this to be an error.
        </p>
      )
    if (acConsoleData.notesDisplayed?.length === 0)
      return (
        <div className="table-container">
          <MenuBar
            notes={acConsoleData.notes}
            selectedNoteIds={selectedNoteIds}
            shortPhrase={shortPhrase}
            reviewersInfo={acConsoleData.reviewersInfo}
            venueId={venueId}
            officialReviewName={officialReviewName}
            allProfiles={acConsoleData.allProfiles}
            setAcConsoleData={setAcConsoleData}
          />
          <p className="empty-message">No assigned papers matching search criteria.</p>
        </div>
      )
    return (
      <div className="table-container">
        <MenuBar
          notes={acConsoleData.notes}
          selectedNoteIds={selectedNoteIds}
          shortPhrase={shortPhrase}
          reviewersInfo={acConsoleData.reviewersInfo}
          venueId={venueId}
          officialReviewName={officialReviewName}
          allProfiles={acConsoleData.allProfiles}
          setAcConsoleData={setAcConsoleData}
        />
        <Table
          className="console-table table-striped"
          headings={[
            {
              id: 'select-all',
              content: (
                <SelectAllCheckBox
                  selectedNoteIds={selectedNoteIds}
                  setSelectedNoteIds={setSelectedNoteIds}
                  allNoteIds={acConsoleData.notesDisplayed?.map((p) => p.id)}
                />
              ),
              width: '8%',
            },
            { id: 'number', content: '#', width: '8%' },
            { id: 'summary', content: 'Paper Summary', width: '46%' },
            { id: 'reviewProgress', content: 'Review Progress', width: '46%' },
            { id: 'metaReviewStatus', content: 'Meta Review Status', width: '46%' },
          ]}
        >
          {acConsoleData.notesDisplayed?.map((note) => (
            <AssignedPaperRow
              key={note.id}
              note={note}
              venueId={venueId}
              areaChairName={areaChairName}
              reviewersInfo={acConsoleData.reviewersInfo}
              officialReviewName={officialReviewName}
              reviewRatingName={reviewRatingName}
              reviewConfidenceName={reviewConfidenceName}
              enableReviewerReassignment={enableReviewerReassignment}
              reviewerRankingByPaper={acConsoleData.reviewerRankingByPaper}
              reviewerGroupMembers={acConsoleData.reviewerGroupMembers}
              allProfiles={acConsoleData.allProfiles}
              reviewerGroupWithConflict={reviewerGroupWithConflict}
              officialMetaReviewName={officialMetaReviewName}
              submissionName={submissionName}
              metaReviewContentField={metaReviewContentField}
              selectedNoteIds={selectedNoteIds}
              setSelectedNoteIds={setSelectedNoteIds}
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
    if (userLoading || !user || !group || !venueId) return
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
    enableEditReviewAssignments,
    reviewerAssignmentTitle,
    edgeBrowserProposedUrl,
    edgeBrowserDeployedUrl,
    blindSubmissionInvitationId,
    seniorAreaChairsId,
    areaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    reviewConfidenceName,
    enableReviewerReassignment,
    reviewerPaperRankingInvitationId,
    reviewerGroup,
    reviewerGroupWithConflict,
    officialMetaReviewName,
    metaReviewContentField,
    shortPhrase,
  }).filter(([key, value]) => value === undefined)
  if (missingConfig?.length) {
    const errorMessage = `AC Console is missing required properties: ${
      missingConfig.length ? missingConfig.map((p) => p[0]).join(', ') : ''
    }`
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }

  return (
    <>
      <BasicHeader title={header?.title} instructions={headerInstructions} />
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
