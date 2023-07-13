/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import api from '../../lib/api-client'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import AreaChairStatus from './SeniorAreaChairConsole/AreaChairStatus'
import PaperStatus from './SeniorAreaChairConsole/PaperStatus'
import ErrorDisplay from '../ErrorDisplay'
import {
  getIndentifierFromGroup,
  getNumberFromGroup,
  getProfileName,
  prettyId,
} from '../../lib/utils'
import SeniorAreaChairTasks from './SeniorAreaChairConsole/SeniorAreaChairTasks'

const SeniorAreaChairConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    assignmentInvitation,
    assignmentLabel,
    submissionId,
    submissionName,
    reviewerName,
    anonReviewerName,
    areaChairName = 'Area_Chairs',
    anonAreaChairName,
    seniorAreaChairName = 'Senior_Area_Chairs',
    reviewRatingName,
    reviewConfidenceName,
    officialReviewName,
    officialMetaReviewName,
    decisionName = 'Decision',
    recommendationName,
    edgeBrowserDeployedUrl,
    customStageInvitations,
    withdrawnVenueId,
    deskRejectedVenueId,
  } = useContext(WebFieldContext)
  const { setBannerContent } = appContext
  const { user, accessToken, userLoading } = useUser()
  const [sacConsoleData, setSacConsoleData] = useState({})
  const [isLoadingData, setIsLoadingData] = useState(false)
  const router = useRouter()
  const query = useQuery()
  const [activeTabId, setActiveTabId] = useState(window.location.hash || '#paper-status')

  const loadData = async () => {
    if (isLoadingData) return
    setIsLoadingData(true)
    try {
      // #region getSubmissions
      const notesP = submissionId
        ? api
            .getAll(
              '/notes',
              {
                invitation: submissionId,
                details: 'replies',
                select: 'id,number,forum,content,details,invitations,readers',
                sort: 'number:asc',
              },
              { accessToken, version: 2 }
            )
            .then((notes) =>
              notes.filter(
                (note) =>
                  ![withdrawnVenueId, deskRejectedVenueId].includes(
                    note.content?.venueid?.value
                  )
              )
            )
        : Promise.resolve([])
      // #endregion

      // #region getGroups (per paper groups)
      const perPaperGroupResultsP = api.get(
        '/groups',
        {
          id: `${venueId}/${submissionName}.*`,
          stream: true,
          select: 'id,members',
        },
        { accessToken }
      )
      // #endregion

      // #region getAssignedACEdges
      const assignmentsP = assignmentInvitation
        ? api.getAll(
            '/edges',
            {
              invitation: assignmentInvitation,
              label: assignmentLabel,
              tail: user.profile.id,
            },
            { accessToken }
          )
        : Promise.resolve([])
      // #endregion

      const [notes, perPaperGroupResults, assignmentEdges] = await Promise.all([
        notesP,
        perPaperGroupResultsP,
        assignmentsP,
      ])
      const assignedAreaChairIds = assignmentEdges.map((p) => p.head)

      // #region categorize result of per paper groups
      let reviewerGroups = []
      const anonReviewerGroups = {}
      let areaChairGroups = []
      const anonAreaChairGroups = {}
      const seniorAreaChairGroups = []
      let allGroupMembers = []
      perPaperGroupResults.groups?.forEach((p) => {
        if (p.id.endsWith(`/${reviewerName}`)) {
          reviewerGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          allGroupMembers = allGroupMembers.concat(p.members)
        } else if (p.id.includes(anonReviewerName)) {
          const number = getNumberFromGroup(p.id, submissionName)
          if (!(number in anonReviewerGroups)) anonReviewerGroups[number] = {}
          if (p.members.length) anonReviewerGroups[number][p.members[0]] = p.id
        } else if (p.id.endsWith(`/${areaChairName}`)) {
          areaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          allGroupMembers = allGroupMembers.concat(p.members)
        } else if (p.id.includes(anonAreaChairName)) {
          const number = getNumberFromGroup(p.id, submissionName)
          if (!(number in anonAreaChairGroups)) anonAreaChairGroups[number] = {}
          if (p.members.length) anonAreaChairGroups[number][p.members[0]] = p.id
        } else if (p.id.endsWith(seniorAreaChairName)) {
          seniorAreaChairGroups.push(p)
        }
      })

      reviewerGroups = reviewerGroups.map((reviewerGroup) => {
        const paperAnonReviewerGroups = anonReviewerGroups[reviewerGroup.noteNumber]
        return {
          ...reviewerGroup,
          members: reviewerGroup.members.flatMap((member) => {
            const reviewerAnonGroup = paperAnonReviewerGroups[member]
            if (!reviewerAnonGroup) return []
            return {
              reviewerProfileId: member,
              reviewerAnonGroup,
              anonymousId: getIndentifierFromGroup(reviewerAnonGroup, anonReviewerName),
            }
          }),
        }
      })

      areaChairGroups = areaChairGroups.map((areaChairGroup) => {
        const paperAnonAreaChairGroups = anonAreaChairGroups[areaChairGroup.noteNumber]
        return {
          ...areaChairGroup,
          members: areaChairGroup.members.map((member) => {
            const areaChairAnonGroup = paperAnonAreaChairGroups?.[member]
            return {
              areaChairProfileId: member,
              areaChairAnonGroup,
              anonymousId: areaChairAnonGroup
                ? getIndentifierFromGroup(areaChairAnonGroup, anonAreaChairName)
                : null,
            }
          }),
        }
      })
      // #endregion

      // #region get all profiles
      const allIds = [...new Set(assignedAreaChairIds.concat(allGroupMembers))]
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
      const allProfiles = (profileResults[0].profiles ?? [])
        .concat(profileResults[1].profiles ?? [])
        .map((profile) => ({
          ...profile,
          preferredName: getProfileName(profile),
          preferredEmail: profile.content.preferredEmail ?? profile.content.emails[0],
        }))

      const allProfilesMap = new Map()
      allProfiles.forEach((profile) => {
        const usernames = profile.content.names.flatMap((p) => p.username ?? [])
        const profileEmails = profile.content.emails.filter((p) => p)
        usernames.concat(profileEmails).forEach((key) => {
          allProfilesMap.set(key, profile)
        })
      })
      // #endregion

      const assignedNoteNumbers = seniorAreaChairGroups.map((p) =>
        getNumberFromGroup(p.id, submissionName)
      )

      const assignedNotes = notes.flatMap((p) =>
        assignedNoteNumbers.includes(p.number) ? p : []
      )

      setSacConsoleData({
        isSacConsole: true,
        assignedAreaChairIds,
        areaChairGroups,
        allProfilesMap,
        notes: assignedNotes.map((note) => {
          const assignedReviewers =
            reviewerGroups?.find((p) => p.noteNumber === note.number)?.members ?? []
          const assignedAreaChairs =
            areaChairGroups?.find((p) => p.noteNumber === note.number)?.members ?? []
          const officialReviews =
            note.details.replies
              .filter((p) => {
                const officialReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
                return p.invitations.includes(officialReviewInvitationId)
              })
              ?.map((review) => {
                const reviewRatingValue = review.content[reviewRatingName]?.value
                const ratingNumber = reviewRatingValue
                  ? reviewRatingValue.substring(0, reviewRatingValue.indexOf(':'))
                  : null
                const confidenceValue = review.content[reviewConfidenceName]?.value

                const confidenceMatch = confidenceValue && confidenceValue.match(/^(\d+): .*/)
                const reviewValue = review.content.review?.value
                return {
                  ...review,
                  anonymousId: getIndentifierFromGroup(review.signatures[0], anonReviewerName),
                  confidence: confidenceMatch ? parseInt(confidenceMatch[1], 10) : null,
                  rating: ratingNumber ? parseInt(ratingNumber, 10) : null,
                  reviewLength: reviewValue?.length,
                  forum: review.forum,
                  id: review.id,
                }
              }) ?? []

          const ratings = officialReviews.map((p) => p.rating)
          const validRatings = ratings.filter((p) => p !== null)
          const ratingAvg = validRatings.length
            ? (
                validRatings.reduce((sum, curr) => sum + curr, 0) / validRatings.length
              ).toFixed(2)
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

          const customStageInvitationIds = customStageInvitations
            ? customStageInvitations.map((p) => `/-/${p.name}`)
            : []
          const customStageReviews = note.details.replies.filter((p) =>
            p.invitations.some((q) => customStageInvitationIds.some((r) => q.includes(r)))
          )

          const metaReviews = note.details.replies
            .filter((p) => {
              const officialMetaReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`
              return p.invitations.includes(officialMetaReviewInvitationId)
            })
            ?.map((metaReview) => ({
              ...metaReview,
              anonId: getIndentifierFromGroup(metaReview.signatures[0], anonAreaChairName),
            }))
            .map((metaReview) => {
              const metaReviewAgreement = customStageReviews.find(
                (p) => p.replyto === metaReview.id
              )
              const metaReviewAgreementConfig = metaReviewAgreement
                ? customStageInvitations.find((p) =>
                    metaReviewAgreement.invitations.some((q) => q.includes(`/-/${p.name}`))
                  )
                : null
              const metaReviewAgreementValue =
                metaReviewAgreement?.content?.[metaReviewAgreementConfig?.displayField]?.value
              return {
                [recommendationName]: metaReview?.content[recommendationName]?.value,
                ...metaReview,
                metaReviewAgreement: metaReviewAgreement
                  ? {
                      searchValue: metaReviewAgreementValue,
                      name: prettyId(metaReviewAgreementConfig.name),
                      value: metaReviewAgreementValue,
                      id: metaReviewAgreement.id,
                      forum: metaReviewAgreement.forum,
                    }
                  : {
                      searchValue: 'N/A',
                    },
              }
            })

          const decisionInvitationId = `${venueId}/${submissionName}${note.number}/-/${decisionName}`

          let decision = 'No Decision'

          const decisionNote = note.details.replies.find((p) =>
            p.invitations.includes(decisionInvitationId)
          )

          // eslint-disable-next-line prefer-destructuring
          if (decisionNote?.content?.decision) decision = decisionNote.content.decision?.value
          return {
            noteNumber: note.number,
            note,
            reviewers: assignedReviewers?.map((reviewer) => {
              const profile = allProfilesMap.get(reviewer.reviewerProfileId)
              return {
                ...reviewer,
                type: 'reviewer',
                profile,
                hasReview: officialReviews.some((p) => p.anonymousId === reviewer.anonymousId),
                noteNumber: note.number,
                preferredName: profile ? getProfileName(profile) : reviewer.reviewerProfileId,
                preferredEmail: profile
                  ? profile.content.preferredEmail ?? profile.content.emails[0]
                  : reviewer.reviewerProfileId,
              }
            }),
            officialReviews,
            reviewProgressData: {
              reviewers: assignedReviewers.map((reviewer) => ({
                id: reviewer.reviewerProfileId,
                profile: allProfilesMap.get(reviewer.reviewerProfileId),
              })),
              numReviewersAssigned: assignedReviewers.length,
              numReviewsDone: officialReviews.length,
              ratingAvg,
              ratingMax,
              ratingMin,
              confidenceAvg,
              confidenceMax,
              confidenceMin,
              replyCount: note.details.replies?.length ?? 0,
            },
            metaReviewData: {
              numAreaChairsAssigned: assignedAreaChairs.length,
              areaChairs: assignedAreaChairs.map((areaChair) => {
                const profile = allProfilesMap.get(areaChair.areaChairProfileId)
                return {
                  ...areaChair,
                  preferredName: profile
                    ? getProfileName(profile)
                    : areaChair.areaChairProfileId,
                  preferredEmail: profile
                    ? profile.content.preferredEmail ?? profile.content.emails[0]
                    : areaChair.areaChairProfileId,
                }
              }),
              numMetaReviewsDone: metaReviews.length,
              metaReviews,
              metaReviewsSearchValue: metaReviews?.length
                ? metaReviews.map((p) => p[recommendationName]).join(' ')
                : 'N/A',
              metaReviewAgreementSearchValue: metaReviews
                .map((p) => p.metaReviewAgreement?.searchValue)
                .join(' '),
            },
            decision,
          }
        }),
      })
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
    setIsLoadingData(false)
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
    if (!activeTabId) return
    router.replace(activeTabId)
  }, [activeTabId])

  const missingConfig = Object.entries({
    header,
    entity: group,
    venueId,
  })
    .filter(([key, value]) => value === undefined)
    .map((p) => p[0])
  if (missingConfig.length > 0) {
    const errorMessage = `SAC Console is missing required properties: ${missingConfig.join(
      ', '
    )}`
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }
  return (
    <>
      <BasicHeader title={header?.title} instructions={header.instructions} />
      <Tabs>
        <TabList>
          <Tab
            id="paper-status"
            active={activeTabId === '#paper-status' ? true : undefined}
            onClick={() => setActiveTabId('#paper-status')}
          >
            Paper Status
          </Tab>
          <Tab
            id="areachair-status"
            active={activeTabId === '#areachair-status' ? true : undefined}
            onClick={() => setActiveTabId('#areachair-status')}
          >
            Area Chair Status
          </Tab>
          <Tab
            id="seniorareachair-tasks"
            active={activeTabId === '#seniorareachair-tasks' ? true : undefined}
            onClick={() => setActiveTabId('#seniorareachair-tasks')}
          >
            Senior Area Chair Tasks
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="paper-status">
            {activeTabId === '#paper-status' && (
              <PaperStatus sacConsoleData={sacConsoleData} />
            )}
          </TabPanel>
          {activeTabId === '#areachair-status' && (
            <TabPanel id="areachair-status">
              <AreaChairStatus sacConsoleData={sacConsoleData} loadSacConsoleData={loadData} />
            </TabPanel>
          )}
          {activeTabId === '#seniorareachair-tasks' && (
            <TabPanel id="seniorareachair-tasks">
              <SeniorAreaChairTasks />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </>
  )
}

export default SeniorAreaChairConsole
