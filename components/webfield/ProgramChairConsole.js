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
import {
  getIndentifierFromGroup,
  getNumberFromGroup,
  getProfileName,
  prettyId,
  parseNumberField,
} from '../../lib/utils'
import Overview from './ProgramChairConsole/Overview'
import AreaChairStatus from './ProgramChairConsole/AreaChairStatus'
import PaperStatus from './ProgramChairConsole/PaperStatus'
import SeniorAreaChairStatus from './ProgramChairConsole/SeniorAreaChairStatus'
import ReviewerStatusTab from './ProgramChairConsole/ReviewerStatus'
import ErrorDisplay from '../ErrorDisplay'
import RejectedWithdrawnPapers from './ProgramChairConsole/RejectedWithdrawnPapers'

const ProgramChairConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    areaChairsId,
    seniorAreaChairsId,
    reviewersId,
    programChairsId,
    authorsId,
    paperReviewsCompleteThreshold,
    bidName,
    recommendationName,
    requestFormId,
    submissionId,
    submissionVenueId,
    withdrawnVenueId,
    deskRejectedVenueId,
    officialReviewName,
    commentName,
    officialMetaReviewName,
    decisionName = 'Decision',
    anonReviewerName,
    anonAreaChairName,
    reviewerName = 'Reviewers',
    areaChairName = 'Area_Chairs',
    seniorAreaChairName = 'Senior_Area_Chairs',
    scoresName,
    shortPhrase,
    enableQuerySearch,
    reviewRatingName,
    reviewConfidenceName,
    submissionName,
    recruitmentName,
    paperStatusExportColumns,
    areaChairStatusExportColumns,
    customStageInvitations,
    assignmentUrls,
    emailReplyTo,
  } = useContext(WebFieldContext)
  const { setBannerContent } = appContext
  const { user, accessToken, userLoading } = useUser()
  const router = useRouter()
  const query = useQuery()
  const [activeTabId, setActiveTabId] = useState(
    window.location.hash || '#venue-configuration',
  )
  const [pcConsoleData, setPcConsoleData] = useState({})
  const [isLoadingData, setIsLoadingData] = useState(false)

  const loadData = async () => {
    if (isLoadingData) return
    setIsLoadingData(true)
    try {
      // #region getInvitationMap
      const conferenceInvitationsP = api.getAll(
        '/invitations',
        {
          prefix: `${venueId}/-/.*`,
          expired: true,
          type: 'all',
        },
        { accessToken, version: 2 },
      )
      const reviewerInvitationsP = api.getAll(
        '/invitations',
        {
          prefix: `${reviewersId}/-/.*`,
          expired: true,
          type: 'all',
        },
        { accessToken, version: 2 },
      )
      const acInvitationsP = areaChairsId
        ? api.getAll(
            '/invitations',
            {
              prefix: `${areaChairsId}/-/.*`,
              expired: true,
              type: 'all',
            },
            { accessToken, version: 2 },
          )
        : Promise.resolve([])
      const sacInvitationsP = seniorAreaChairsId
        ? api.getAll(
            '/invitations',
            {
              prefix: `${seniorAreaChairsId}/-/.*`,
              expired: true,
              type: 'all',
            },
            { accessToken, version: 2 },
          )
        : Promise.resolve([])

      const customStageInvitationsP = customStageInvitations
        ? api.getAll(
            '/invitations',
            {
              ids: customStageInvitations.map((p) => `${venueId}/-/${p.name}`),
              type: 'note',
            },
            { accessToken, version: 2 },
          )
        : Promise.resolve([])

      const invitationResultsP = Promise.all([
        conferenceInvitationsP,
        reviewerInvitationsP,
        acInvitationsP,
        sacInvitationsP,
        customStageInvitationsP,
      ])

      // #endregion

      // #region getRequestForm
      const getRequestFormResultP = requestFormId
        ? api
            .get(
              '/notes',
              {
                id: requestFormId,
                limit: 1,
                select: 'id,content',
              },
              { accessToken }, // request form is in v1
            )
            .then(
              (result) => result.notes?.[0],
              () => null,
            )
        : Promise.resolve(null)
      // #endregion

      // #region getRegistrationForms
      const prefixes = [reviewersId, areaChairsId, seniorAreaChairsId]
      const getRegistrationFormPs = prefixes.map((prefix) =>
        prefix
          ? api
              .getAll(
                '/notes',
                {
                  invitation: `${prefix}/-/.*`,
                  signature: venueId,
                  select: 'id,invitation,invitations,content.title',
                },
                { accessToken, version: 2 },
              )
              .then((notes) =>
                notes.filter((note) => note.invitations.some((p) => p.includes('Form'))),
              )
          : Promise.resolve(null),
      )
      const getRegistrationFormResultsP = Promise.all(getRegistrationFormPs)
      // #endregion

      // #region get Reviewer,AC,SAC Members
      const committeeMemberResultsP = Promise.all(
        [reviewersId, areaChairsId, seniorAreaChairsId].map((id) =>
          id ? api.getGroupById(id, accessToken, { select: 'members' }) : Promise.resolve([]),
        ),
      )
      // #endregion

      // #region getSubmissions
      const notesP = api.getAll(
        '/notes',
        {
          invitation: submissionId,
          details: 'replies',
          select: 'id,number,forum,content,details,invitations,readers',
          sort: 'number:asc',
        },
        { accessToken, version: 2 },
      )
      // #endregion

      // #region get ac recommendation count
      const getAcRecommendationsP =
        recommendationName && areaChairsId
          ? api
              .get(
                '/edges',
                {
                  invitation: `${reviewersId}/-/${recommendationName}`,
                  groupBy: 'id',
                  select: 'signatures',
                  stream: true,
                },
                { accessToken },
              )
              .then((result) =>
                result.groupedEdges.reduce((profileMap, edge) => {
                  const acId = edge.values[0].signatures[0]
                  if (!profileMap[acId]) {
                    profileMap[acId] = 0 // eslint-disable-line no-param-reassign
                  }
                  profileMap[acId] += 1 // eslint-disable-line no-param-reassign
                  return profileMap
                }, {}),
              )
          : Promise.resolve([])
      // #endregion

      // #region get Reviewer,AC,SAC bid
      const bidCountResultsP = Promise.all(
        [reviewersId, areaChairsId, seniorAreaChairsId].map((id) => {
          if (!id || !bidName) return Promise.resolve({})
          return api.getAll(
            '/edges',
            {
              invitation: `${id}/-/${bidName}`,
              groupBy: 'tail',
              select: 'count',
            },
            { accessToken, resultsKey: 'groupedEdges' },
          )
        }),
      )
      // #endregion

      // #region getGroups (per paper groups)
      const perPaperGroupResultsP = api.get(
        '/groups',
        {
          id: `${venueId}/${submissionName}.*`,
          stream: true,
          select: 'id,members',
        },
        { accessToken },
      )
      // #endregion

      const results = await Promise.all([
        invitationResultsP,
        getRequestFormResultP,
        getRegistrationFormResultsP,
        committeeMemberResultsP,
        notesP,
        getAcRecommendationsP,
        bidCountResultsP,
        perPaperGroupResultsP,
      ])
      const invitationResults = results[0]
      const requestForm = results[1]
      const registrationForms = results[2].flatMap((p) => p ?? [])
      const committeeMemberResults = results[3]
      const notes = results[4].flatMap((note) => {
        if ([withdrawnVenueId, deskRejectedVenueId].includes(note.content?.venueid?.value))
          return []
        return note
      })
      const acRecommendationsCount = results[5]
      const bidCountResults = results[6]
      const perPaperGroupResults = results[7]

      // #region categorize result of per paper groups
      const reviewerGroups = []
      const anonReviewerGroups = {}
      const areaChairGroups = []
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
          seniorAreaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          allGroupMembers = allGroupMembers.concat(p.members)
        }
      })
      // #endregion

      // #region get all profiles(with assignments)
      const allIds = [...new Set(allGroupMembers)]
      const ids = allIds.filter((p) => p.startsWith('~'))
      const emails = allIds.filter((p) => p.match(/.+@.+/))
      const getProfilesByIdsP = ids.length
        ? api.post(
            '/profiles/search',
            {
              ids,
            },
            { accessToken },
          )
        : Promise.resolve([])
      const getProfilesByEmailsP = emails.length
        ? api.post(
            '/profiles/search',
            {
              emails,
            },
            { accessToken },
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
      // #endregion

      const allProfilesMap = new Map()
      allProfiles.forEach((profile) => {
        const usernames = profile.content.names.flatMap((p) => p.username ?? [])
        const profileEmails = profile.content.emails.filter((p) => p)
        usernames.concat(profileEmails).forEach((key) => {
          allProfilesMap.set(key, profile)
        })
      })

      const officialReviewsByPaperNumberMap = new Map()
      const metaReviewsByPaperNumberMap = new Map()
      const decisionByPaperNumberMap = new Map()
      const customStageReviewsByPaperNumberMap = new Map()
      notes.forEach((note) => {
        const replies = note.details.replies // eslint-disable-line prefer-destructuring
        const officialReviews = replies
          .filter((p) => {
            const officialReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
            return p.invitations.includes(officialReviewInvitationId)
          })
          ?.map((review) => ({
            ...review,
            anonId: getIndentifierFromGroup(
              review.signatures[0].startsWith('~')
                ? anonReviewerGroups[note.number][review.signatures[0]] ?? ''
                : review.signatures[0],
              anonReviewerName,
            ),
          }))
        const metaReviews = replies
          .filter((p) => {
            const officialMetaReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`
            return p.invitations.includes(officialMetaReviewInvitationId)
          })
          ?.map((metaReview) => ({
            ...metaReview,
            anonId: getIndentifierFromGroup(metaReview.signatures[0], anonAreaChairName),
          }))
        const decisionInvitationId = `${venueId}/${submissionName}${note.number}/-/${decisionName}`
        const decision = replies.find((p) => p.invitations.includes(decisionInvitationId))
        const customStageInvitationIds = customStageInvitations
          ? customStageInvitations.map((p) => `/-/${p.name}`)
          : []
        const customStageReviews = replies.filter((p) =>
          p.invitations.some((q) => customStageInvitationIds.some((r) => q.includes(r))),
        )
        officialReviewsByPaperNumberMap.set(note.number, officialReviews)
        metaReviewsByPaperNumberMap.set(note.number, metaReviews)
        decisionByPaperNumberMap.set(note.number, decision)
        customStageReviewsByPaperNumberMap.set(note.number, customStageReviews)
      })

      setPcConsoleData({
        invitations: invitationResults.flat(),
        allProfiles,
        allProfilesMap,
        requestForm,
        registrationForms,
        reviewers: committeeMemberResults[0]?.members ?? [],
        areaChairs: committeeMemberResults[1]?.members ?? [],
        seniorAreaChairs: committeeMemberResults[2]?.members ?? [],
        notes,
        officialReviewsByPaperNumberMap,
        metaReviewsByPaperNumberMap,
        decisionByPaperNumberMap,
        customStageReviewsByPaperNumberMap,
        withdrawnNotes: results[4].flatMap((note) => {
          if (note.content?.venueid?.value === withdrawnVenueId) return note
          return []
        }),
        deskRejectedNotes: results[4].flatMap((note) => {
          if (note.content?.venueid?.value === deskRejectedVenueId) return note
          return []
        }),

        acRecommendationsCount,
        bidCounts: {
          reviewers: bidCountResults[0],
          areaChairs: bidCountResults[1],
          seniorAreaChairs: bidCountResults[2],
        },
        paperGroups: {
          anonReviewerGroups,
          reviewerGroups: reviewerGroups.map((reviewerGroup) => {
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
          }),
          anonAreaChairGroups,
          areaChairGroups: areaChairGroups.map((areaChairGroup) => {
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
          }),
          seniorAreaChairGroups,
        },
      })
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
    setIsLoadingData(false)
  }

  // eslint-disable-next-line consistent-return
  const calculateNotesReviewMetaReviewData = () => {
    if (!pcConsoleData) return new Map()
    const noteNumberReviewMetaReviewMap = new Map()
    pcConsoleData.notes.forEach((note) => {
      const assignedReviewers =
        pcConsoleData.paperGroups.reviewerGroups?.find((p) => p.noteNumber === note.number)
          ?.members ?? []

      const assignedReviewerProfiles = assignedReviewers.map((reviewer) => ({
        id: reviewer.reviewerProfileId,
        profile: pcConsoleData.allProfilesMap.get(reviewer.reviewerProfileId),
      }))

      const assignedAreaChairs =
        pcConsoleData.paperGroups.areaChairGroups?.find((p) => p.noteNumber === note.number)
          ?.members ?? []

      const assignedAreaChairProfiles = assignedAreaChairs.map((areaChair) => ({
        id: areaChair.areaChairProfileId,
        profile: pcConsoleData.allProfilesMap.get(areaChair.areaChairProfileId),
      }))

      const assignedSeniorAreaChairs =
        pcConsoleData.paperGroups.seniorAreaChairGroups?.find(
          (p) => p.noteNumber === note.number,
        )?.members ?? []

      const assignedSeniorAreaChairProfiles = assignedSeniorAreaChairs.map(
        (seniorAreaChairProfileId) => ({
          id: seniorAreaChairProfileId,
          profile: pcConsoleData.allProfilesMap.get(seniorAreaChairProfileId),
        }),
      )

      const officialReviews =
        pcConsoleData.officialReviewsByPaperNumberMap?.get(note.number)?.map((q) => {
          const reviewValue = q.content.review?.value
          return {
            anonymousId: q.anonId,
            confidence: parseNumberField(q.content[reviewConfidenceName]?.value),
            ...Object.fromEntries(
              (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
                (ratingName) => [[ratingName], parseNumberField(q.content[ratingName]?.value)],
              ),
            ),
            reviewLength: reviewValue?.length,
            forum: q.forum,
            id: q.id,
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
            const ratingMin = validRatingValues.length ? Math.min(...validRatingValues) : 'N/A'
            const ratingMax = validRatingValues.length ? Math.max(...validRatingValues) : 'N/A'
            return [ratingName, { ratingAvg, ratingMin, ratingMax }]
          },
        ),
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

      const customStageReviews =
        pcConsoleData.customStageReviewsByPaperNumberMap?.get(note.number) ?? []

      const metaReviews = (
        pcConsoleData.metaReviewsByPaperNumberMap?.get(note.number) ?? []
      ).map((metaReview) => {
        const metaReviewAgreement = customStageReviews.find((p) => p.replyto === metaReview.id)
        const metaReviewAgreementConfig = metaReviewAgreement
          ? customStageInvitations.find((p) =>
              metaReviewAgreement.invitations.some((q) => q.includes(`/-/${p.name}`)),
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
            : { searchValue: 'N/A' },
        }
      })

      let decision = 'No Decision'
      const decisionNote = pcConsoleData.decisionByPaperNumberMap.get(note.number)
      if (decisionNote?.content?.decision) decision = decisionNote.content.decision?.value

      noteNumberReviewMetaReviewMap.set(note.number, {
        note,
        reviewers: assignedReviewers?.map((reviewer) => {
          const profile = assignedReviewerProfiles.find(
            (p) => p.id === reviewer.reviewerProfileId,
          )?.profile
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
        reviewerProfiles: assignedReviewerProfiles,
        officialReviews,
        reviewProgressData: {
          reviewers: assignedReviewerProfiles,
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
            const profile = assignedAreaChairProfiles.find(
              (p) => p.id === areaChair.areaChairProfileId,
            )?.profile
            return {
              ...areaChair,
              preferredName: profile ? getProfileName(profile) : areaChair.areaChairProfileId,
              preferredEmail: profile
                ? profile.content.preferredEmail ?? profile.content.emails[0]
                : areaChair.areaChairProfileId,
            }
          }),
          seniorAreaChairs: assignedSeniorAreaChairs.map((seniorAreaChairProfileId) => {
            const profile = assignedSeniorAreaChairProfiles.find(
              (p) => p.id === seniorAreaChairProfileId,
            )?.profile
            return {
              preferredName: profile ? getProfileName(profile) : seniorAreaChairProfileId,
              preferredEmail: profile
                ? profile.content.preferredEmail ?? profile.content.emails[0]
                : seniorAreaChairProfileId,
            }
          }),
          numMetaReviewsDone: metaReviews.length,
          metaReviews,
          metaReviewsSearchValue: metaReviews?.length
            ? metaReviews.map((p) => p[recommendationName]).join(' ')
            : 'N/A',
          metaReviewAgreementSearchValue: metaReviews
            .map((p) => p.metaReviewAgreement.searchValue)
            .join(' '),
        },

        decision,
        venue: note?.content?.venue?.value,
      })
    })
    setPcConsoleData((data) => ({ ...data, noteNumberReviewMetaReviewMap }))
  }

  const loadSacAcInfo = async () => {
    // #region get sac edges to get sac of ac
    const sacEdgeResult = seniorAreaChairsId
      ? await api
          .get(
            '/edges',
            {
              invitation: `${seniorAreaChairsId}/-/Assignment`,
              groupBy: 'head,tail',
              select: 'head,tail',
            },
            { accessToken },
          )
          .then((result) => result.groupedEdges)
      : []

    const sacByAcMap = new Map()
    const acBySacMap = new Map()
    sacEdgeResult.forEach((edge) => {
      const ac = edge.values[0].head
      const sac = edge.values[0].tail
      sacByAcMap.set(ac, sac)
      if (!acBySacMap.get(sac)) acBySacMap.set(sac, [])
      acBySacMap.get(sac).push(ac)
    })
    // #endregion

    // #region get profile of acs/sacs without assignments
    const areaChairWithoutAssignmentIds = pcConsoleData.areaChairs.filter(
      (areaChairProfileId) => !pcConsoleData.allProfilesMap.get(areaChairProfileId),
    )
    const seniorAreaChairWithoutAssignmentIds = pcConsoleData.seniorAreaChairs.filter(
      (sacProfileId) => !pcConsoleData.allProfilesMap.get(sacProfileId),
    )
    const allIdsNoAssignment = areaChairWithoutAssignmentIds.concat(
      seniorAreaChairWithoutAssignmentIds,
    )
    const ids = allIdsNoAssignment.filter((p) => p.startsWith('~'))
    const emails = allIdsNoAssignment.filter((p) => p.match(/.+@.+/))
    const getProfilesByIdsP = ids.length
      ? api.post(
          '/profiles/search',
          {
            ids,
          },
          { accessToken },
        )
      : Promise.resolve([])
    const getProfilesByEmailsP = emails.length
      ? api.post(
          '/profiles/search',
          {
            emails,
          },
          { accessToken },
        )
      : Promise.resolve([])
    const profileResults = await Promise.all([getProfilesByIdsP, getProfilesByEmailsP])
    const acSacProfilesWithoutAssignment = (profileResults[0].profiles ?? [])
      .concat(profileResults[1].profiles ?? [])
      .map((profile) => ({
        ...profile,
        preferredName: getProfileName(profile),
        preferredEmail: profile.content.preferredEmail ?? profile.content.emails[0],
      }))

    const acSacProfileWithoutAssignmentMap = new Map()
    acSacProfilesWithoutAssignment.forEach((profile) => {
      const usernames = profile.content.names.flatMap((p) => p.username ?? [])
      const profileEmails = profile.content.emails.filter((p) => p)
      usernames.concat(profileEmails).forEach((key) => {
        acSacProfileWithoutAssignmentMap.set(key, profile)
      })
    })
    // #endregion
    setPcConsoleData((data) => ({
      ...data,
      sacAcInfo: {
        sacByAcMap,
        acBySacMap,
        acSacProfileWithoutAssignmentMap,
        areaChairWithoutAssignmentIds,
        seniorAreaChairWithoutAssignmentIds,
      },
    }))
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
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
        )}`,
      )
    }
  }, [user, userLoading])

  useEffect(() => {
    if (userLoading || !user || !group || !venueId || !reviewersId || !submissionId) return
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
    reviewersId,
    programChairsId,
    authorsId,
    paperReviewsCompleteThreshold,
    bidName,
    recommendationName,
    submissionId,
    officialReviewName,
    commentName,
    officialMetaReviewName,
    anonReviewerName,
    shortPhrase,
    enableQuerySearch,
    submissionName,
    submissionVenueId,
  })
    .filter(([key, value]) => value === undefined)
    .map((p) => p[0])
  if (missingConfig.length > 0) {
    const errorMessage = `PC Console is missing required properties: ${
      missingConfig.length ? missingConfig.join(', ') : 'submissionVenueId'
    }`
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }
  return (
    <>
      <BasicHeader title={header?.title} instructions={header.instructions} />
      <Tabs>
        <TabList>
          <Tab
            id="venue-configuration"
            active={activeTabId === '#venue-configuration' ? true : undefined}
            onClick={() => setActiveTabId('#venue-configuration')}
          >
            Overview
          </Tab>
          <Tab
            id="paper-status"
            active={activeTabId === '#paper-status' ? true : undefined}
            onClick={() => setActiveTabId('#paper-status')}
          >
            Paper Status
          </Tab>
          <Tab
            id="reviewer-status"
            active={activeTabId === '#reviewer-status' ? true : undefined}
            onClick={() => setActiveTabId('#reviewer-status')}
          >
            Reviewer Status
          </Tab>
          {areaChairsId && (
            <Tab
              id="areachair-status"
              active={activeTabId === '#areachair-status' ? true : undefined}
              onClick={() => setActiveTabId('#areachair-status')}
            >
              Area Chair Status
            </Tab>
          )}
          {seniorAreaChairsId && (
            <Tab
              id="seniorareachair-status"
              active={activeTabId === '#seniorareachair-status' ? true : undefined}
              onClick={() => setActiveTabId('#seniorareachair-status')}
            >
              Senior Area Chair Status
            </Tab>
          )}
          {(withdrawnVenueId || deskRejectedVenueId) && (
            <Tab
              id="deskrejectwithdrawn-status"
              active={activeTabId === '#deskrejectwithdrawn-status' ? true : undefined}
              onClick={() => setActiveTabId('#deskrejectwithdrawn-status')}
            >
              Desk Rejected/Withdrawn Papers
            </Tab>
          )}
        </TabList>

        <TabPanels>
          <TabPanel id="venue-configuration">
            <Overview pcConsoleData={pcConsoleData} />
          </TabPanel>
          <TabPanel id="paper-status">
            {activeTabId === '#paper-status' && (
              <PaperStatus
                pcConsoleData={pcConsoleData}
                loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
              />
            )}
          </TabPanel>
          <TabPanel id="reviewer-status">
            <ReviewerStatusTab
              pcConsoleData={pcConsoleData}
              loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
              showContent={activeTabId === '#reviewer-status'}
            />
          </TabPanel>
          {areaChairsId && activeTabId === '#areachair-status' && (
            <TabPanel id="areachair-status">
              <AreaChairStatus
                pcConsoleData={pcConsoleData}
                loadSacAcInfo={loadSacAcInfo}
                loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
              />
            </TabPanel>
          )}
          {seniorAreaChairsId && activeTabId === '#seniorareachair-status' && (
            <TabPanel id="seniorareachair-status">
              <SeniorAreaChairStatus
                pcConsoleData={pcConsoleData}
                loadSacAcInfo={loadSacAcInfo}
              />
            </TabPanel>
          )}
          <TabPanel id="deskrejectwithdrawn-status">
            {activeTabId === '#deskrejectwithdrawn-status' && (
              <RejectedWithdrawnPapers pcConsoleData={pcConsoleData} />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default ProgramChairConsole
