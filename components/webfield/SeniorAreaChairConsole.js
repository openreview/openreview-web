/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { camelCase, chunk, orderBy } from 'lodash'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import AreaChairStatus from './SeniorAreaChairConsole/AreaChairStatus'
import PaperStatus from './SeniorAreaChairConsole/PaperStatus'
import SeniorAreaChairTasks from './SeniorAreaChairConsole/SeniorAreaChairTasks'
import ErrorDisplay from '../ErrorDisplay'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import {
  getIndentifierFromGroup,
  getNumberFromGroup,
  getProfileName,
  prettyId,
  parseNumberField,
  prettyField,
  getSingularRoleName,
  getRoleHashFragment,
  pluralizeString,
} from '../../lib/utils'
import { formatProfileContent } from '../../lib/edge-utils'
import RejectedWithdrawnPapers from './ProgramChairConsole/RejectedWithdrawnPapers'
import ConsoleTabs from './ConsoleTabs'

const SeniorAreaChairConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    assignmentInvitation,
    assignmentLabel,
    submissionId,
    submissionName,
    reviewersId,
    reviewerName,
    reviewerAssignmentId = `${reviewersId}/-/Assignment`,
    anonReviewerName,
    areaChairsId,
    areaChairName = 'Area_Chairs',
    areaChairAssignmentId = `${areaChairsId}/-/Assignment`,
    anonAreaChairName,
    secondaryAreaChairName,
    secondaryAnonAreaChairName,
    seniorAreaChairName = 'Senior_Area_Chairs',
    reviewRatingName,
    reviewConfidenceName,
    officialReviewName,
    officialMetaReviewName = 'Meta_Review',
    decisionName = 'Decision',
    preliminaryDecisionName,
    metaReviewRecommendationName = 'recommendation',
    additionalMetaReviewFields = [],
    edgeBrowserDeployedUrl,
    customStageInvitations,
    withdrawnVenueId,
    deskRejectedVenueId,
    filterFunction,
    preferredEmailInvitationId,
    ithenticateInvitationId,
    displayReplyInvitations,
    metaReviewAgreementConfig,
  } = useContext(WebFieldContext)
  const { setBannerContent } = appContext ?? {}
  const { user, accessToken, isRefreshing } = useUser()
  const [sacConsoleData, setSacConsoleData] = useState({})
  const [isLoadingData, setIsLoadingData] = useState(false)
  const query = useSearchParams()

  const seniorAreaChairUrlFormat = getRoleHashFragment(seniorAreaChairName)
  const areaChairUrlFormat = getRoleHashFragment(areaChairName)

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
              { accessToken }
            )
            .then((groups) => {
              const noteNumbers = groups.flatMap((p) =>
                p.id.endsWith(`/${seniorAreaChairName}`)
                  ? getNumberFromGroup(p.id, submissionName)
                  : []
              )
              if (!noteNumbers.length) return []
              const noteNumberChunks = chunk(
                noteNumbers.sort((a, b) => a - b),
                50
              )
              return Promise.all(
                noteNumberChunks.map((noteNumbersInChunk) =>
                  api
                    .get(
                      '/notes',
                      {
                        invitation: submissionId,
                        number: noteNumbersInChunk.join(','),
                        details: 'replies',
                        select: 'id,number,forum,content,details,invitations,readers',
                        sort: 'number:asc',
                        domain: group.domain,
                      },
                      { accessToken }
                    )
                    .then((batchResult) => batchResult.notes)
                )
              ).then((allBatchResults) =>
                allBatchResults.flat()?.filter(
                  (note) =>
                    // eslint-disable-next-line no-new-func
                    (filterFunction && Function('note', filterFunction)(note)) ?? true
                )
              )
            })
        : Promise.resolve([])
      // #endregion

      // #region getInvitations

      const invitationsP = api.getAll(
        '/invitations',
        {
          ids: [reviewerAssignmentId, areaChairAssignmentId],
        },
        { accessToken }
      )

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
              domain: group.domain,
            },
            { accessToken }
          )
        : Promise.resolve([])
      // #endregion

      // #region get ithenticate edges
      const ithenticateEdgesP = ithenticateInvitationId
        ? api
            .getAll(
              '/edges',
              {
                invitation: ithenticateInvitationId,
                groupBy: 'id',
              },
              { accessToken, resultsKey: 'groupedEdges' }
            )
            .then((result) => result.map((p) => p.values[0]))
        : Promise.resolve([])
      // #endregion

      const [notes, invitations, perPaperGroupResults, assignmentEdges, ithenticateEdges] =
        await Promise.all([
          notesP,
          invitationsP,
          perPaperGroupResultsP,
          assignmentsP,
          ithenticateEdgesP,
        ])
      const assignedAreaChairIds = assignmentEdges.map((p) => p.head)

      // #region categorize result of per paper groups
      let reviewerGroups = []
      const anonReviewerGroups = {}
      let areaChairGroups = []
      const anonAreaChairGroups = {}
      const secondaryAreaChairGroups = []
      const secondaryAnonAreaChairGroups = {}
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
        } else if (p.id.includes(`/${anonReviewerName}`)) {
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
              member.includes(`/${anonAreaChairName}`)
            ) {
              anonAreaChairGroups[number][member] = member
            }
          })
        } else if (p.id.includes(`/${anonAreaChairName}`)) {
          if (!(number in anonAreaChairGroups)) anonAreaChairGroups[number] = {}
          if (p.members.length) anonAreaChairGroups[number][p.id] = p.members[0]
          allGroupMembers = allGroupMembers.concat(p.members)
        } else if (p.id.endsWith(seniorAreaChairName)) {
          seniorAreaChairGroups.push(p)
        } else if (secondaryAreaChairName && p.id.endsWith(`/${secondaryAreaChairName}`)) {
          secondaryAreaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          p.members.forEach((member) => {
            if (!(number in secondaryAnonAreaChairGroups))
              secondaryAnonAreaChairGroups[number] = {}
            if (
              !(member in secondaryAnonAreaChairGroups[number]) &&
              member.includes(`/${secondaryAnonAreaChairName}`)
            ) {
              secondaryAnonAreaChairGroups[number][member] = member
            }
          })
        } else if (secondaryAreaChairName && p.id.includes(`/${secondaryAnonAreaChairName}`)) {
          if (!(number in secondaryAnonAreaChairGroups))
            secondaryAnonAreaChairGroups[number] = {}
          if (p.members.length) secondaryAnonAreaChairGroups[number][p.id] = p.members[0]
          allGroupMembers = allGroupMembers.concat(p.members)
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
          members: areaChairGroup.members.flatMap((member) => {
            let deanonymizedGroup = paperAnonAreaChairGroups?.[member]
            let anonymizedGroup = member
            if (!deanonymizedGroup) {
              deanonymizedGroup = member
              anonymizedGroup = Object.keys(paperAnonAreaChairGroups).find(
                (key) => paperAnonAreaChairGroups[key] === member
              )
            }
            if (secondaryAreaChairName && member.endsWith(`/${secondaryAreaChairName}`)) {
              return []
            }
            return {
              areaChairProfileId: deanonymizedGroup,
              anonymizedGroup,
              anonymousId: anonymizedGroup
                ? getIndentifierFromGroup(anonymizedGroup, anonAreaChairName)
                : null,
            }
          }),
          secondaries: areaChairGroup.members.flatMap((member) => {
            if (!secondaryAreaChairName || !member.endsWith(`/${secondaryAreaChairName}`)) {
              return []
            }

            const acGroupNoteNum = areaChairGroup.noteNumber
            const secondaryAreaChairGroup = secondaryAreaChairGroups.find(
              (p) => p.noteNumber === acGroupNoteNum
            )
            if (!secondaryAreaChairGroup) return []

            return secondaryAreaChairGroup.members.map((secondaryMember) => ({
              areaChairProfileId:
                secondaryAnonAreaChairGroups[acGroupNoteNum]?.[secondaryMember] ??
                secondaryMember,
              anonymizedGroup: secondaryMember,
              anonymousId: getIndentifierFromGroup(
                secondaryMember,
                secondaryAnonAreaChairName
              ),
            }))
          }),
        }
      })
      // #endregion

      // #region get all profiles
      const allIds = [...new Set(assignedAreaChairIds.concat(allGroupMembers))]
      const ids = allIds.filter((p) => p.startsWith('~'))
      const getProfilesByIdsP = ids.length
        ? api.post(
            '/profiles/search',
            {
              ids,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const profileResults = await getProfilesByIdsP
      const allProfiles = (profileResults.profiles ?? []).map((profile) => ({
        ...profile,
        preferredName: getProfileName(profile),
        title: formatProfileContent(profile.content).title,
      }))

      const allProfilesMap = new Map()
      allProfiles.forEach((profile) => {
        const usernames = profile.content.names.flatMap((p) => p.username ?? [])
        usernames.concat(profile.email ?? []).forEach((key) => {
          allProfilesMap.set(key, profile)
        })
      })
      // #endregion

      const seniorAreaChairGroupByNumber = {}
      const assignedNoteNumbers = []
      seniorAreaChairGroups.forEach((p) => {
        const number = getNumberFromGroup(p.id, submissionName)
        assignedNoteNumbers.push(number)
        seniorAreaChairGroupByNumber[number] = p.id
      })

      const assignedNotes = notes.flatMap((p) =>
        assignedNoteNumbers.includes(p.number) ? p : []
      )

      setSacConsoleData({
        assignedAreaChairIds,
        areaChairGroups,
        allProfilesMap,
        assignmentInvitations: invitations,
        notes: assignedNotes.flatMap((note) => {
          if ([withdrawnVenueId, deskRejectedVenueId].includes(note.content?.venueid?.value))
            return []
          const assignedReviewers =
            reviewerGroups?.find((p) => p.noteNumber === note.number)?.members ?? []
          const assignedAreaChairs =
            areaChairGroups?.find((p) => p.noteNumber === note.number)?.members ?? []
          const secondaryAreaChairs =
            areaChairGroups?.find((p) => p.noteNumber === note.number)?.secondaries ?? []
          const officialReviews =
            note.details.replies
              .filter((p) => {
                const officialReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
                return p.invitations.includes(officialReviewInvitationId)
              })
              ?.map((review) => {
                const reviewValue = review.content?.review?.value
                return {
                  ...review,
                  anonymousId: getIndentifierFromGroup(review.signatures[0], anonReviewerName),
                  confidence: parseNumberField(review.content?.[reviewConfidenceName]?.value),
                  ...Object.fromEntries(
                    (Array.isArray(reviewRatingName)
                      ? reviewRatingName
                      : [reviewRatingName]
                    ).map((ratingName) => {
                      const displayRatingName =
                        typeof ratingName === 'object'
                          ? Object.keys(ratingName)[0]
                          : ratingName
                      const ratingValue =
                        typeof ratingName === 'object'
                          ? Object.values(ratingName)[0]
                              .map((r) => review.content?.[r]?.value)
                              .find((s) => s !== undefined)
                          : review.content?.[ratingName]?.value
                      return [[displayRatingName], parseNumberField(ratingValue)]
                    })
                  ),
                  reviewLength: reviewValue?.length,
                  forum: review.forum,
                  id: review.id,
                }
              }) ?? []

          const ratings = Object.fromEntries(
            (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
              (ratingName) => {
                const ratingDisplayName =
                  typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
                const ratingValues = officialReviews.map((p) => p[ratingDisplayName])
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
                return [ratingDisplayName, { ratingAvg, ratingMin, ratingMax }]
              }
            )
          )

          const confidences = officialReviews.map((p) => p?.confidence)
          const validConfidences = confidences.filter((p) => p !== null)
          const confidenceAvg = validConfidences.length
            ? (
                validConfidences.reduce((sum, curr) => sum + curr, 0) / validConfidences.length
              ).toFixed(2)
            : 'N/A'
          const confidenceMin = validConfidences.length ? Math.min(...validConfidences) : 'N/A'
          const confidenceMax = validConfidences.length ? Math.max(...validConfidences) : 'N/A'

          const metaReviewAgreements = metaReviewAgreementConfig
            ? note.details.replies.filter((p) =>
                p.invitations.some((q) => q.includes(`/-/${metaReviewAgreementConfig.name}`))
              )
            : []

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
              const metaReviewAgreement = metaReviewAgreementConfig
                ? metaReviewAgreements.find(
                    (p) => p.replyto === metaReview.id || p.forum === metaReview.forum
                  )
                : null
              const metaReviewAgreementValue =
                metaReviewAgreement?.content?.[metaReviewAgreementConfig?.displayField]?.value
              return {
                [metaReviewRecommendationName]:
                  metaReview?.content?.[metaReviewRecommendationName]?.value,
                ...metaReview,
                ...additionalMetaReviewFields?.reduce((prev, curr) => {
                  const additionalMetaReviewFieldValue = metaReview?.content?.[curr]?.value
                  return {
                    ...prev,
                    [curr]: {
                      value: additionalMetaReviewFieldValue,
                      searchValue: additionalMetaReviewFieldValue ?? 'N/A',
                    },
                  }
                }, {}),
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
                recommendation: prelimDecisionNote.content?.recommendation?.value,
                confidence: prelimDecisionNote.content?.confidence?.value,
                discussionNeeded:
                  prelimDecisionNote.content?.discussion_with_SAC_needed?.value,
              }
            }
          }

          const displayReplies = displayReplyInvitations?.map((p) => {
            const displayInvitaitonId = p.id.replaceAll('{number}', note.number)
            const latestReply = orderBy(
              note.details.replies.filter((q) => q.invitations.includes(displayInvitaitonId)),
              ['mdate'],
              'desc'
            )?.[0]
            return {
              id: latestReply?.id,
              date: latestReply?.mdate,
              invitationId: displayInvitaitonId,
              values: p.fields.map((field) => {
                const value = latestReply?.content?.[field]?.value?.toString()
                return {
                  field,
                  value,
                }
              }),
              signature: latestReply?.signatures?.[0],
            }
          })

          return {
            noteNumber: note.number,
            note: {
              ...note,
              ...(ithenticateInvitationId && {
                ithenticateWeight:
                  ithenticateEdges.find((p) => p.head === note.id)?.weight ?? 'N/A',
              }),
            },
            reviewers: assignedReviewers?.map((reviewer) => {
              const profile = allProfilesMap.get(reviewer.reviewerProfileId)
              return {
                ...reviewer,
                type: 'profile',
                profile,
                hasReview: officialReviews.some((p) => p.anonymousId === reviewer.anonymousId),
                noteNumber: note.number,
                preferredId: reviewer.reviewerProfileId,
                preferredName: profile ? getProfileName(profile) : reviewer.reviewerProfileId,
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
                  noteNumber: note.number,
                  preferredId: profile ? profile.id : areaChair.areaChairProfileId,
                  preferredName: profile
                    ? getProfileName(profile)
                    : areaChair.areaChairProfileId,
                  title: profile?.title,
                }
              }),
              secondaryAreaChairs: secondaryAreaChairs.map((areaChair) => {
                const profile = allProfilesMap.get(areaChair.areaChairProfileId)
                return {
                  ...areaChair,
                  noteNumber: note.number,
                  preferredId: profile ? profile.id : areaChair.areaChairProfileId,
                  preferredName: profile
                    ? getProfileName(profile)
                    : areaChair.areaChairProfileId,
                }
              }),
              numMetaReviewsDone: metaReviews.length,
              metaReviews,
              metaReviewsSearchValue: metaReviews?.length
                ? metaReviews.map((p) => p[metaReviewRecommendationName]).join(' ')
                : 'N/A',
              metaReviewAgreementSearchValue: metaReviews
                .map((p) => p.metaReviewAgreement?.searchValue)
                .join(' '),
              customStageReviews: customStageInvitations?.reduce((prev, curr) => {
                const customStageReview = customStageReviews.find((p) =>
                  p.invitations.some((q) => q.includes(`/-/${curr.name}`))
                )
                if (!customStageReview)
                  return {
                    ...prev,
                    [camelCase(curr.name)]: {
                      searchValue: 'N/A',
                    },
                  }
                const customStageValue = customStageReview?.content?.[curr.displayField]?.value
                const customStageExtraDisplayFields = curr.extraDisplayFields ?? []
                return {
                  ...prev,
                  [camelCase(curr.name)]: {
                    searchValue: customStageValue,
                    name: prettyId(curr.name),
                    role: curr.role,
                    value: customStageValue,
                    displayField: prettyField(curr.displayField),
                    extraDisplayFields: customStageExtraDisplayFields.map((field) => ({
                      field: prettyField(field),
                      value: customStageReview?.content?.[field]?.value,
                    })),
                    ...customStageReview,
                  },
                }
              }, {}),
              ...additionalMetaReviewFields?.reduce((prev, curr) => {
                const additionalMetaReviewValues = metaReviews.map((p) => p[curr]?.searchValue)
                return {
                  ...prev,
                  [`${curr}SearchValue`]: additionalMetaReviewValues.join(' '),
                }
              }, {}),
            },
            decision,
            preliminaryDecision,
            messageSignature: seniorAreaChairGroupByNumber[note.number],
            ithenticateEdge: ithenticateEdges.find((p) => p.head === note.id),
            venue: note.content?.venue?.value,
            displayReplies,
          }
        }),
        withdrawnNotes: assignedNotes.flatMap((note) => {
          if (note.content?.venueid?.value === withdrawnVenueId) return note
          return []
        }),
        deskRejectedNotes: assignedNotes.flatMap((note) => {
          if (note.content?.venueid?.value === deskRejectedVenueId) return note
          return []
        }),
      })
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
    setIsLoadingData(false)
  }

  useEffect(() => {
    if (!query) return

    if (query.get('referrer')) {
      setBannerContent({ type: 'referrerLink', value: query.get('referrer') })
    } else {
      setBannerContent({ type: 'venueHomepageLink', value: venueId })
    }
  }, [query, venueId])

  useEffect(() => {
    if (isRefreshing || !user || !group || !venueId) return
    loadData()
  }, [user, isRefreshing, group])

  const missingConfig = Object.entries({
    header,
    entity: group,
    venueId,
    submissionName,
    reviewerName,
    anonReviewerName,
    officialReviewName,
  })
    .filter(([key, value]) => value === undefined)
    .map((p) => p[0])
  if (missingConfig.length > 0) {
    const errorMessage = `${prettyField(
      seniorAreaChairName
    )} Console is missing required properties: ${missingConfig.join(', ')}`
    return <ErrorDisplay statusCode="" message={errorMessage} withLayout={false} />
  }

  return (
    <>
      <BasicHeader title={header?.title} instructions={header.instructions} />
      <ConsoleTabs
        defaultActiveTabId={`${(submissionName ?? '').toLowerCase()}-status`}
        tabs={[
          {
            id: `${submissionName.toLowerCase()}-status`,
            label: `${submissionName} Status`,
            content: <PaperStatus sacConsoleData={sacConsoleData} />,
            visible: true,
          },
          {
            id: `${areaChairUrlFormat}-status`,
            label: `${getSingularRoleName(prettyField(areaChairName))} Status`,
            content: (
              <AreaChairStatus
                sacConsoleData={sacConsoleData}
                loadSacConsoleData={loadData}
                user={user}
              />
            ),
            visible: assignmentInvitation,
          },
          {
            id: 'deskrejectwithdrawn-status',
            label: `Desk Rejected/Withdrawn ${pluralizeString(submissionName)}`,
            content: (
              <RejectedWithdrawnPapers consoleData={sacConsoleData} isSacConsole={true} />
            ),
            visible: withdrawnVenueId || deskRejectedVenueId,
          },
          {
            id: `${seniorAreaChairUrlFormat}-tasks`,
            label: `${getSingularRoleName(prettyField(seniorAreaChairName))} Tasks`,
            content: <SeniorAreaChairTasks />,
            visible: true,
          },
        ]}
      />
    </>
  )
}

export default SeniorAreaChairConsole
