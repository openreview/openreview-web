/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import WebFieldContext from '../WebFieldContext'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import BasicHeader from './BasicHeader'
import AreaChairStatus from './SeniorAreaChairConsole/AreaChairStatus'
import PaperStatus from './SeniorAreaChairConsole/PaperStatus'
import SeniorAreaChairTasks from './SeniorAreaChairConsole/SeniorAreaChairTasks'
import ErrorDisplay from '../ErrorDisplay'
import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import {
  getIndentifierFromGroup,
  getNumberFromGroup,
  getProfileName,
  prettyId,
  parseNumberField,
} from '../../lib/utils'

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
    preliminaryDecisionName,
    recommendationName,
    edgeBrowserDeployedUrl,
    customStageInvitations,
    withdrawnVenueId,
    deskRejectedVenueId,
    filterFunction,
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
              '/groups',
              {
                member: user.id,
                prefix: `${venueId}/${submissionName}.*`,
                select: 'id',
                domain: group.domain,
              },
              { accessToken, version: 2 }
            )
            .then((groups) => {
              const noteNumbers = groups.flatMap((p) =>
                p.id.endsWith(`/${seniorAreaChairName}`)
                  ? getNumberFromGroup(p.id, submissionName)
                  : []
              )
              if (!noteNumbers.length) return []
              return api
                .getAll(
                  '/notes',
                  {
                    invitation: submissionId,
                    details: 'replies',
                    select: 'id,number,forum,content,details,invitations,readers',
                    sort: 'number:asc',
                    domain: group.domain,
                  },
                  { accessToken, version: 2 }
                )
                .then((notes) =>
                  notes.filter((note) => {
                    const noteVenueId = note.content?.venueid?.value
                    return (
                      noteVenueId !== withdrawnVenueId &&
                      venueId !== deskRejectedVenueId &&
                      ((filterFunction && Function('note', filterFunction)(note)) ?? true) && // eslint-disable-line no-new-func
                      noteNumbers.includes(note.number)
                    )
                  })
                )
            })
        : Promise.resolve([])
      // #endregion

      // #region getGroups (per paper groups)
      const perPaperGroupResultsP = api.get(
        '/groups',
        {
          prefix: `${venueId}/${submissionName}.*`,
          stream: true,
          select: 'id,members',
          domain: group.domain,
        },
        { accessToken, version: 2 }
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
              domain: group.domain,
            },
            { accessToken, version: 2 }
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
        const number = getNumberFromGroup(p.id, submissionName)
        if (p.id.endsWith(`/${reviewerName}`)) {
          reviewerGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          p.members.forEach((member) => {
            if (!(number in anonReviewerGroups)) anonReviewerGroups[number] = {}
            if (!(member in anonReviewerGroups[number]) && member.includes(anonReviewerName)) {
              anonReviewerGroups[number][member] = member
            }
          })
        } else if (p.id.includes(anonReviewerName)) {
          if (!(number in anonReviewerGroups)) anonReviewerGroups[number] = {}
          if (p.members.length) anonReviewerGroups[number][p.id] = p.members[0]
          allGroupMembers = allGroupMembers.concat(p.members)
        } else if (p.id.endsWith(`/${areaChairName}`)) {
          areaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          p.members.forEach((member) => {
            if (!(number in anonAreaChairGroups)) anonAreaChairGroups[number] = {}
            if (
              !(member in anonAreaChairGroups[number]) &&
              member.includes(anonAreaChairName)
            ) {
              anonAreaChairGroups[number][member] = member
            }
          })
        } else if (p.id.includes(anonAreaChairName)) {
          if (!(number in anonAreaChairGroups)) anonAreaChairGroups[number] = {}
          if (p.members.length) anonAreaChairGroups[number][p.id] = p.members[0]
          allGroupMembers = allGroupMembers.concat(p.members)
        } else if (p.id.endsWith(seniorAreaChairName)) {
          seniorAreaChairGroups.push(p)
        }
      })

      reviewerGroups = reviewerGroups.map((reviewerGroup) => {
        const paperAnonReviewerGroups = anonReviewerGroups[reviewerGroup.noteNumber] || {}
        return {
          ...reviewerGroup,
          members: reviewerGroup.members.flatMap((member) => {
            let deanonymizedGroup = paperAnonReviewerGroups[member]
            let anonymizedGroup = member
            if (!deanonymizedGroup) {
              deanonymizedGroup = member
              anonymizedGroup = Object.keys(paperAnonReviewerGroups).find(
                (key) => paperAnonReviewerGroups[key] === member
              )
            }
            if (!anonymizedGroup) return []
            return {
              reviewerProfileId: deanonymizedGroup,
              anonymizedGroup,
              anonymousId: getIndentifierFromGroup(anonymizedGroup, anonReviewerName),
            }
          }),
        }
      })

      areaChairGroups = areaChairGroups.map((areaChairGroup) => {
        const paperAnonAreaChairGroups = anonAreaChairGroups[areaChairGroup.noteNumber]
        return {
          ...areaChairGroup,
          members: areaChairGroup.members.map((member) => {
            let deanonymizedGroup = paperAnonAreaChairGroups?.[member]
            let anonymizedGroup = member
            if (!deanonymizedGroup) {
              deanonymizedGroup = member
              anonymizedGroup = Object.keys(paperAnonAreaChairGroups).find(
                (key) => paperAnonAreaChairGroups[key] === member
              )
            }
            return {
              areaChairProfileId: deanonymizedGroup,
              anonymizedGroup,
              anonymousId: anonymizedGroup
                ? getIndentifierFromGroup(anonymizedGroup, anonAreaChairName)
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
            { accessToken, version: 2 }
          )
        : Promise.resolve([])
      const getProfilesByEmailsP = emails.length
        ? api.post(
            '/profiles/search',
            {
              emails,
            },
            { accessToken, version: 2 }
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
                const reviewValue = review.content.review?.value
                return {
                  ...review,
                  anonymousId: getIndentifierFromGroup(review.signatures[0], anonReviewerName),
                  confidence: parseNumberField(review.content[reviewConfidenceName]?.value),
                  ...Object.fromEntries(
                    (Array.isArray(reviewRatingName)
                      ? reviewRatingName
                      : [reviewRatingName]
                    ).map((ratingName) => [
                      [ratingName],
                      parseNumberField(review.content[ratingName]?.value),
                    ])
                  ),
                  reviewLength: reviewValue?.length,
                  forum: review.forum,
                  id: review.id,
                }
              }) ?? []

          const ratings = Object.fromEntries(
            (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
              (ratingName) => {
                const ratingValues = officialReviews.map((p) => p[ratingName])
                const validRatingValues = ratingValues.filter((p) => p !== null)
                const ratingAvg = validRatingValues.length
                  ? (
                      validRatingValues.reduce((sum, curr) => sum + curr, 0) /
                      validRatingValues.length
                    ).toFixed(2)
                  : 'N/A'
                const ratingMin = validRatingValues.length
                  ? Math.min(...validRatingValues)
                  : 'N/A'
                const ratingMax = validRatingValues.length
                  ? Math.max(...validRatingValues)
                  : 'N/A'
                return [ratingName, { ratingAvg, ratingMin, ratingMax }]
              }
            )
          )

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
            .map((metaReview) => ({
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
          const decisionNote = note.details.replies.find((p) =>
            p.invitations.includes(decisionInvitationId)
          )
          const decision = decisionNote?.content?.decision
            ? decisionNote.content.decision?.value
            : 'No Decision'

          let preliminaryDecision = null
          if (preliminaryDecisionName) {
            const prelimDecisionId = `${venueId}/${submissionName}${note.number}/-/${preliminaryDecisionName}`
            const prelimDecisionNote = note.details.replies.find((p) =>
              p.invitations.includes(prelimDecisionId)
            )
            if (prelimDecisionNote) {
              preliminaryDecision = {
                id: prelimDecisionNote.id,
                recommendation: prelimDecisionNote.content.recommendation?.value,
                confidence: prelimDecisionNote.content.confidence?.value,
                discussionNeeded: prelimDecisionNote.content.discussion_with_SAC_needed?.value,
              }
            }
          }

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
              ratings,
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
            preliminaryDecision,
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
    if (!userLoading && !user) {
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
