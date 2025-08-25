/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import groupBy from 'lodash/groupBy'
import { orderBy } from 'lodash'
import dayjs from 'dayjs'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import {
  getIndentifierFromGroup,
  getNumberFromGroup,
  getProfileName,
  prettyId,
  prettyField,
  parseNumberField,
  isValidEmail,
  getSingularRoleName,
  pluralizeString,
  getRoleHashFragment,
  formatDateTime,
} from '../../lib/utils'
import Overview from './ProgramChairConsole/Overview'
import AreaChairStatus from './ProgramChairConsole/AreaChairStatus'
import PaperStatus from './ProgramChairConsole/PaperStatus'
import SeniorAreaChairStatus from './ProgramChairConsole/SeniorAreaChairStatus'
import ReviewerStatusTab from './ProgramChairConsole/ReviewerStatus'
import ErrorDisplay from '../ErrorDisplay'
import RejectedWithdrawnPapers from './ProgramChairConsole/RejectedWithdrawnPapers'
import { formatProfileContent } from '../../lib/edge-utils'
import ConsoleTabs from './ConsoleTabs'
import { clearCache, getCache, setCache } from '../../lib/console-cache'
import SpinnerButton from '../SpinnerButton'
import LoadingSpinner from '../LoadingSpinner'

const ProgramChairConsole = ({ appContext, extraTabs = [] }) => {
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
    recommendationName, // to get ac recommendation edges
    metaReviewRecommendationName = 'recommendation', // recommendation field in meta review
    additionalMetaReviewFields = [],
    requestFormId,
    submissionId,
    submissionVenueId,
    withdrawnVenueId,
    deskRejectedVenueId,
    officialReviewName,
    commentName,
    officialMetaReviewName = 'Meta_Review',
    decisionName = 'Decision',
    anonReviewerName,
    anonAreaChairName,
    reviewerName = 'Reviewers',
    areaChairName = 'Area_Chairs',
    seniorAreaChairName = 'Senior_Area_Chairs',
    secondaryAreaChairName,
    secondaryAnonAreaChairName,
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
    reviewerEmailFuncs,
    acEmailFuncs,
    sacEmailFuncs,
    submissionContentFields = [],
    sacDirectPaperAssignment,
    propertiesAllowed,
    areaChairStatusPropertiesAllowed,
    sacStatuspropertiesAllowed,
    messageAreaChairsInvitationId,
    messageSeniorAreaChairsInvitationId,
    preferredEmailInvitationId,
    ithenticateInvitationId,
    displayReplyInvitations,
    useCache = false,
  } = useContext(WebFieldContext)
  const { setBannerContent } = appContext ?? {}
  const { user, accessToken, isRefreshing } = useUser()
  const query = useSearchParams()
  const [pcConsoleData, setPcConsoleData] = useState({})
  const [timelineData, setTimelineData] = useState({})
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataLoadingStatusMessage, setDataLoadingStatusMessage] = useState('Data is loading')

  const seniorAreaChairUrlFormat = getRoleHashFragment(seniorAreaChairName)
  const areaChairUrlFormat = getRoleHashFragment(areaChairName)
  const reviewerUrlFormat = getRoleHashFragment(reviewerName)

  const loadData = async () => {
    if (isLoadingData) return
    setIsLoadingData(true)
    setDataLoadingStatusMessage('Data is loading')
    await clearCache(venueId)

    try {
      // #region getInvitationMap
      const conferenceInvitationsP = api.getAll(
        '/invitations',
        {
          prefix: `${venueId}/-/.*`,
          expired: true,
          type: 'all',
          domain: venueId,
        },
        { accessToken }
      )
      const reviewerInvitationsP = api.getAll(
        '/invitations',
        {
          prefix: `${reviewersId}/-/.*`,
          expired: true,
          type: 'all',
          domain: venueId,
        },
        { accessToken }
      )
      const acInvitationsP = areaChairsId
        ? api.getAll(
            '/invitations',
            {
              prefix: `${areaChairsId}/-/.*`,
              expired: true,
              type: 'all',
              domain: venueId,
            },
            { accessToken }
          )
        : Promise.resolve([])
      const sacInvitationsP = seniorAreaChairsId
        ? api.getAll(
            '/invitations',
            {
              prefix: `${seniorAreaChairsId}/-/.*`,
              expired: true,
              type: 'all',
              domain: venueId,
            },
            { accessToken }
          )
        : Promise.resolve([])

      const customStageInvitationsP = customStageInvitations
        ? api.getAll(
            '/invitations',
            {
              ids: customStageInvitations.map((p) => `${venueId}/-/${p.name}`),
              type: 'note',
              domain: venueId,
            },
            { accessToken }
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
        ? api.getNoteById(
            requestFormId,
            accessToken,
            {
              select: 'id,content',
            },
            undefined
          )
        : Promise.resolve(null)
      // #endregion

      // #region getRegistrationForms
      const prefixes = [reviewersId, areaChairsId, seniorAreaChairsId].filter(Boolean)
      const getRegistrationFormResultsP = Promise.all(
        prefixes.map((prefix) =>
          api
            .getAll(
              '/notes',
              {
                invitation: `${prefix}/-/.*`,
                signature: venueId,
                select: 'id,invitation,invitations,content.title',
                domain: venueId,
              },
              { accessToken }
            )
            .then((notes) =>
              notes.filter((note) => note.invitations.some((p) => p.endsWith('_Form')))
            )
        )
      )
      // #endregion

      setDataLoadingStatusMessage('Loading timeline data')
      const TimelineDataResult = await Promise.all([
        invitationResultsP,
        getRequestFormResultP,
        getRegistrationFormResultsP,
      ])

      const invitationResults = TimelineDataResult[0].flat()
      const requestForm = TimelineDataResult[1]
      const registrationForms = TimelineDataResult[2].flatMap((p) => p ?? [])

      setTimelineData({
        invitations: invitationResults,
        requestForm,
        registrationForms,
      })

      // #region get Reviewer, AC, SAC members
      const committeeMemberResultsP = Promise.all(
        [reviewersId, areaChairsId, seniorAreaChairsId].map((id) =>
          id ? api.getGroupById(id, accessToken, { select: 'members' }) : Promise.resolve([])
        )
      )
      // #endregion

      // #region getSubmissions
      const notesP = api.getAllWithAfter(
        '/notes',
        {
          invitation: submissionId,
          details: 'replies',
          select: 'id,number,forum,content,details,invitations,readers',
          sort: 'number:asc',
          domain: venueId,
        },
        {
          accessToken,
          statusUpdate: (loadedCount, totalCount) => {
            setDataLoadingStatusMessage(
              `Loading ${submissionName}s: ${loadedCount}/${totalCount}`
            )
          },
        }
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
                  domain: venueId,
                },
                { accessToken }
              )
              .then((result) =>
                result.groupedEdges.reduce((profileMap, edge) => {
                  const acId = edge.values[0].signatures[0]
                  if (!profileMap[acId]) {
                    profileMap[acId] = 0 // eslint-disable-line no-param-reassign
                  }
                  profileMap[acId] += 1 // eslint-disable-line no-param-reassign
                  return profileMap
                }, {})
              )
          : Promise.resolve([])
      // #endregion

      // #region get Reviewer, AC, SAC bids
      const bidCountResultsP = Promise.all(
        [reviewersId, areaChairsId, seniorAreaChairsId].map((id) => {
          if (!id || !bidName) return Promise.resolve([])
          return api.getAll(
            '/edges',
            {
              invitation: `${id}/-/${bidName}`,
              groupBy: 'tail',
              select: 'count',
              domain: venueId,
            },
            { accessToken, resultsKey: 'groupedEdges' }
          )
        })
      )
      // #endregion

      // #region getGroups (per paper groups)
      const perPaperGroupResultsP = api.get(
        '/groups',
        {
          prefix: `${venueId}/${submissionName}.*`,
          stream: true,
          select: 'id,members',
          domain: venueId,
        },
        { accessToken }
      )
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
      const results = await Promise.all([
        committeeMemberResultsP,
        notesP,
        getAcRecommendationsP,
        bidCountResultsP,
        perPaperGroupResultsP,
        ithenticateEdgesP,
      ])

      const committeeMemberResults = results[0]
      const ithenticateEdges = results[5]
      const notes = []
      const withdrawnNotes = []
      const deskRejectedNotes = []
      results[1].forEach((note) => {
        if (note.content?.venueid?.value === withdrawnVenueId) {
          withdrawnNotes.push(note)
          return
        }
        if (note.content?.venueid?.value === deskRejectedVenueId) {
          deskRejectedNotes.push(note)
          return
        }
        notes.push({
          ...note,
          ...(ithenticateInvitationId && {
            ithenticateWeight:
              ithenticateEdges.find((p) => p.head === note.id)?.weight ?? 'N/A',
          }),
        })
      })
      const acRecommendationsCount = results[2]
      const bidCountResults = results[3]
      const perPaperGroupResults = results[4]

      // #region categorize result of per paper groups
      const reviewerGroups = []
      const anonReviewerGroups = {}
      const areaChairGroups = []
      const anonAreaChairGroups = {}
      const secondaryAreaChairGroups = []
      const secondaryAnonAreaChairGroups = {}
      const seniorAreaChairGroups = []
      let allGroupMembers = []
      perPaperGroupResults.groups?.forEach((p) => {
        const number = getNumberFromGroup(p.id, submissionName)
        const noteVenueId = notes.find((q) => q.number === number)?.content?.venueid?.value
        if (
          !noteVenueId ||
          noteVenueId === withdrawnVenueId ||
          noteVenueId === deskRejectedVenueId
        )
          return
        if (p.id.endsWith(`/${reviewerName}`)) {
          reviewerGroups.push({
            noteNumber: number,
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
          seniorAreaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          allGroupMembers = allGroupMembers.concat(p.members)
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
      setDataLoadingStatusMessage('Loading profiles')
      const profileResults = await Promise.all([getProfilesByIdsP, getProfilesByEmailsP])
      const allProfiles = (profileResults[0].profiles ?? [])
        .concat(profileResults[1].profiles ?? [])
        .map((profile) => ({
          ...profile,
          preferredName: getProfileName(profile),
          title: formatProfileContent(profile.content).title,
        }))
      // #endregion

      const allProfilesMap = new Map()
      allProfiles.forEach((profile) => {
        const usernames = profile.content.names.flatMap((p) => p.username ?? [])
        usernames.concat(profile.email ?? []).forEach((key) => {
          allProfilesMap.set(key, profile)
        })
      })

      const officialReviewsByPaperNumberMap = new Map()
      const metaReviewsByPaperNumberMap = new Map()
      const decisionByPaperNumberMap = new Map()
      const customStageReviewsByPaperNumberMap = new Map()
      const displayReplyInvitationsByPaperNumberMap = new Map()
      notes.forEach((note) => {
        const replies = note.details.replies ?? []
        const officialReviews = replies
          .filter((p) => {
            const officialReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
            return p.invitations.includes(officialReviewInvitationId)
          })
          .map((review) => {
            let anonymousGroupId
            if (review.signatures[0].startsWith('~')) {
              const idToAnonIdMap = Object.keys(anonReviewerGroups[note.number] ?? {}).reduce(
                (prev, curr) => ({ ...prev, [anonReviewerGroups[note.number][curr]]: curr }),
                {}
              )

              Object.entries(idToAnonIdMap).forEach(
                ([anonReviewerId, anonReviewerGroupId]) => {
                  const profile = allProfilesMap.get(anonReviewerId)
                  if (!profile) return
                  const usernames = profile.content.names.flatMap((p) => p.username ?? [])
                  usernames.concat(profile.email ?? []).forEach((key) => {
                    idToAnonIdMap[key] = anonReviewerGroupId
                  })
                }
              )
              anonymousGroupId = idToAnonIdMap?.[review.signatures[0]] ?? ''
            } else {
              anonymousGroupId = review.signatures[0]
            }

            return {
              ...review,
              anonId: getIndentifierFromGroup(anonymousGroupId, anonReviewerName),
            }
          })
        const metaReviews = replies
          .filter((p) => {
            const officialMetaReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`
            return p.invitations.includes(officialMetaReviewInvitationId)
          })
          .map((metaReview) => ({
            ...metaReview,
            anonId: getIndentifierFromGroup(metaReview.signatures[0], anonAreaChairName),
          }))

        const decisionInvitationId = `${venueId}/${submissionName}${note.number}/-/${decisionName}`
        const decision = replies.find((p) => p.invitations.includes(decisionInvitationId))
        const customStageInvitationIds = customStageInvitations
          ? customStageInvitations.map((p) => `/-/${p.name}`)
          : []
        const customStageReviews = replies.filter((p) =>
          p.invitations.some((q) => customStageInvitationIds.some((r) => q.includes(r)))
        )
        const displayReplies = displayReplyInvitations?.map((p) => {
          const displayInvitaitonId = p.id.replaceAll('{number}', note.number)
          const latestReply = orderBy(
            replies.filter((q) => q.invitations.includes(displayInvitaitonId)),
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
        officialReviewsByPaperNumberMap.set(note.number, officialReviews)
        metaReviewsByPaperNumberMap.set(note.number, metaReviews)
        decisionByPaperNumberMap.set(note.number, decision)
        customStageReviewsByPaperNumberMap.set(note.number, customStageReviews)
        displayReplyInvitationsByPaperNumberMap.set(note.number, displayReplies)
      })

      const consoleData = {
        invitations: invitationResults,
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
        displayReplyInvitationsByPaperNumberMap,
        withdrawnNotes,
        deskRejectedNotes,

        acRecommendationsCount,
        bidCounts: {
          reviewers: bidCountResults[0],
          areaChairs: bidCountResults[1],
          seniorAreaChairs: bidCountResults[2],
        },
        paperGroups: {
          anonReviewerGroups,
          reviewerGroups: reviewerGroups.map((reviewerGroup) => {
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
          }),
          anonAreaChairGroups,
          areaChairGroups: areaChairGroups.map((areaChairGroup) => {
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
                if (!(isValidEmail(deanonymizedGroup) || deanonymizedGroup?.startsWith('~')))
                  return []
                return {
                  areaChairProfileId: deanonymizedGroup,
                  anonymizedGroup,
                  anonymousId: anonymizedGroup
                    ? getIndentifierFromGroup(anonymizedGroup, anonAreaChairName)
                    : null,
                }
              }),
              secondaries: areaChairGroup.members.flatMap((member) => {
                if (!secondaryAreaChairName || !member.endsWith(`/${secondaryAreaChairName}`))
                  return []

                const acGroupNoteNumber = areaChairGroup.noteNumber
                const secondaryAreaChairGroup = secondaryAreaChairGroups.find(
                  (p) => p.noteNumber === acGroupNoteNumber
                )
                if (!secondaryAreaChairGroup) return []

                return secondaryAreaChairGroup.members.map((secondaryMember) => ({
                  areaChairProfileId:
                    secondaryAnonAreaChairGroups[acGroupNoteNumber]?.[secondaryMember] ??
                    secondaryMember,
                  anonymizedGroup: secondaryMember,
                  anonymousId: getIndentifierFromGroup(
                    secondaryMember,
                    secondaryAnonAreaChairName
                  ),
                }))
              }),
            }
          }),
          seniorAreaChairGroups,
        },
        ithenticateEdges,
        timeStamp: dayjs().valueOf(),
      }
      setDataLoadingStatusMessage(null)
      setPcConsoleData(consoleData)
      if (useCache) await setCache(venueId, consoleData)
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
    setIsLoadingData(false)
  }

  const loadCache = async () => {
    try {
      const cachedPcConsoleData = await getCache(venueId)
      if (cachedPcConsoleData) {
        setTimelineData({
          invitations: cachedPcConsoleData.invitations,
          requestForm: cachedPcConsoleData.requestForm,
          registrationForms: cachedPcConsoleData.registrationForms,
        })
        setPcConsoleData(cachedPcConsoleData)
      } else {
        loadData()
      }
    } catch (error) {
      loadData()
    }
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

      const secondaryAreaChairs =
        pcConsoleData.paperGroups.areaChairGroups?.find((p) => p.noteNumber === note.number)
          ?.secondaries ?? []

      const secondaryAreaChairProfiles = secondaryAreaChairs.map((areaChair) => ({
        id: areaChair.areaChairProfileId,
        profile: pcConsoleData.allProfilesMap.get(areaChair.areaChairProfileId),
      }))

      const assignedSeniorAreaChairs =
        pcConsoleData.paperGroups.seniorAreaChairGroups?.find(
          (p) => p.noteNumber === note.number
        )?.members ?? []

      const assignedSeniorAreaChairProfiles = assignedSeniorAreaChairs.map(
        (seniorAreaChairProfileId) => ({
          id: seniorAreaChairProfileId,
          profile: pcConsoleData.allProfilesMap.get(seniorAreaChairProfileId),
        })
      )

      const officialReviews =
        pcConsoleData.officialReviewsByPaperNumberMap?.get(note.number)?.map((q) => {
          const reviewValue = q.content.review?.value
          return {
            anonymousId: q.anonId,
            confidence: parseNumberField(q.content[reviewConfidenceName]?.value),
            ...Object.fromEntries(
              (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
                (ratingName) => {
                  const displayRatingName =
                    typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
                  const ratingValue =
                    typeof ratingName === 'object'
                      ? Object.values(ratingName)[0]
                          .map((r) => q.content[r]?.value)
                          .find((s) => s !== undefined)
                      : q.content[ratingName]?.value
                  return [[displayRatingName], parseNumberField(ratingValue)]
                }
              )
            ),
            reviewLength: reviewValue?.length,
            forum: q.forum,
            id: q.id,
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
            const ratingMin = validRatingValues.length ? Math.min(...validRatingValues) : 'N/A'
            const ratingMax = validRatingValues.length ? Math.max(...validRatingValues) : 'N/A'
            return [ratingDisplayName, { ratingAvg, ratingMin, ratingMax }]
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

      const customStageReviews =
        pcConsoleData.customStageReviewsByPaperNumberMap?.get(note.number) ?? []

      const metaReviews = (
        pcConsoleData.metaReviewsByPaperNumberMap?.get(note.number) ?? []
      ).map((metaReview) => {
        const metaReviewAgreement = customStageReviews.find(
          (p) => p.replyto === metaReview.id || p.forum === metaReview.forum
        )
        const metaReviewAgreementConfig = metaReviewAgreement
          ? customStageInvitations.find((p) =>
              metaReviewAgreement.invitations.some((q) => q.includes(`/-/${p.name}`))
            )
          : null
        const metaReviewAgreementValue =
          metaReviewAgreement?.content?.[metaReviewAgreementConfig?.displayField]?.value
        return {
          [metaReviewRecommendationName]:
            metaReview?.content[metaReviewRecommendationName]?.value,
          ...additionalMetaReviewFields?.reduce((prev, curr) => {
            const additionalMetaReviewFieldValue = metaReview?.content[curr]?.value
            return {
              ...prev,
              [curr]: {
                value: additionalMetaReviewFieldValue,
                searchValue: additionalMetaReviewFieldValue ?? 'N/A',
              },
            }
          }, {}),
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
            (p) => p.id === reviewer.reviewerProfileId
          )?.profile
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
        authors: note.content?.authorids?.value?.map((authorId, index) => {
          const preferredName = note.content.authors?.value?.[index]
          return {
            preferredId: authorId,
            preferredName,
            noteNumber: note.number,
            anonymizedGroup: authorId,
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
              (p) => p.id === areaChair.areaChairProfileId
            )?.profile
            return {
              ...areaChair,
              noteNumber: note.number,
              preferredId: profile ? profile.id : areaChair.areaChairProfileId,
              preferredName: profile ? getProfileName(profile) : areaChair.areaChairProfileId,
              title: profile?.title,
            }
          }),
          secondaryAreaChairs: secondaryAreaChairs.map((areaChair) => {
            const profile = secondaryAreaChairProfiles.find(
              (p) => p.id === areaChair.areaChairProfileId
            )?.profile
            return {
              ...areaChair,
              noteNumber: note.number,
              preferredId: profile ? profile.id : areaChair.areaChairProfileId,
              preferredName: profile ? getProfileName(profile) : areaChair.areaChairProfileId,
              title: profile?.title,
            }
          }),
          seniorAreaChairs: assignedSeniorAreaChairs.map((seniorAreaChairProfileId) => {
            const profile = assignedSeniorAreaChairProfiles.find(
              (p) => p.id === seniorAreaChairProfileId
            )?.profile
            return {
              type: 'profile',
              preferredId: seniorAreaChairProfileId,
              preferredName: profile ? getProfileName(profile) : seniorAreaChairProfileId,
              title: profile?.title,
              noteNumber: note.number,
              anonymizedGroup: seniorAreaChairProfileId,
            }
          }),
          numMetaReviewsDone: metaReviews.length,
          metaReviews,
          metaReviewsSearchValue: metaReviews?.length
            ? metaReviews.map((p) => p[metaReviewRecommendationName]).join(' ')
            : 'N/A',
          metaReviewAgreementSearchValue: metaReviews
            .map((p) => p.metaReviewAgreement.searchValue)
            .join(' '),
          ...additionalMetaReviewFields?.reduce((prev, curr) => {
            const additionalMetaReviewValues = metaReviews.map((p) => p[curr]?.searchValue)
            return {
              ...prev,
              [`${curr}SearchValue`]: additionalMetaReviewValues.join(' '),
            }
          }, {}),
        },
        displayReplies: pcConsoleData.displayReplyInvitationsByPaperNumberMap.get(note.number),
        decision,
        venue: note?.content?.venue?.value,
        messageSignature: programChairsId,
        ithenticateEdge: pcConsoleData.ithenticateEdges.find((p) => p.head === note.id),
      })
    })

    // add profileRegistrationNote
    pcConsoleData.allProfilesMap.forEach((profile, id) => {
      const usernames = profile.content.names.flatMap((p) => p.username ?? [])

      let userRegNotes = []
      usernames.forEach((username) => {
        if (pcConsoleData.registrationNoteMap && pcConsoleData.registrationNoteMap[username]) {
          userRegNotes = userRegNotes.concat(pcConsoleData.registrationNoteMap[username])
        }
      })
      // eslint-disable-next-line no-param-reassign
      profile.registrationNotes = userRegNotes
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
              domain: venueId,
            },
            { accessToken }
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
      (areaChairProfileId) => !pcConsoleData.allProfilesMap.get(areaChairProfileId)
    )
    const seniorAreaChairWithoutAssignmentIds = pcConsoleData.seniorAreaChairs.filter(
      (sacProfileId) => !pcConsoleData.allProfilesMap.get(sacProfileId)
    )
    const allIdsNoAssignment = areaChairWithoutAssignmentIds.concat(
      seniorAreaChairWithoutAssignmentIds
    )
    const ids = allIdsNoAssignment.filter((p) => p.startsWith('~'))
    const emails = allIdsNoAssignment.filter((p) => p.match(/.+@.+/))
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
    const acSacProfilesWithoutAssignment = (profileResults[0].profiles ?? [])
      .concat(profileResults[1].profiles ?? [])
      .map((profile) => ({
        ...profile,
        preferredName: getProfileName(profile),
        title: formatProfileContent(profile.content).title,
      }))

    const acSacProfileWithoutAssignmentMap = new Map()
    acSacProfilesWithoutAssignment.forEach((profile) => {
      const usernames = profile.content.names.flatMap((p) => p.username ?? [])
      let userRegNotes = []
      usernames.forEach((username) => {
        if (pcConsoleData.registrationNoteMap && pcConsoleData.registrationNoteMap[username]) {
          userRegNotes = userRegNotes.concat(pcConsoleData.registrationNoteMap[username])
        }
      })

      // eslint-disable-next-line no-param-reassign
      profile.registrationNotes = userRegNotes

      usernames.concat(profile.email ?? []).forEach((key) => {
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

  const loadRegistrationNoteMap = async () => {
    if (!pcConsoleData.registrationForms?.length) {
      setPcConsoleData((data) => ({ ...data, registrationNoteMap: {} }))
      return
    }
    if (pcConsoleData.registrationNoteMap) return
    try {
      const registrationNoteResults = await Promise.all(
        pcConsoleData.registrationForms.map((regForm) =>
          api.get(
            '/notes',
            {
              forum: regForm.id,
              select: 'id,signatures,invitations,content',
              domain: venueId,
              stream: true,
            },
            { accessToken }
          )
        )
      )
      const registrationNoteMap = groupBy(
        registrationNoteResults.flatMap((result) => result.notes ?? []),
        'signatures[0]'
      )
      setPcConsoleData((data) => ({ ...data, registrationNoteMap }))
    } catch (error) {
      promptError(`Erro loading registration notes: ${error.message}`)
    }
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
    if (isRefreshing || !user || !group || !venueId || !reviewersId || !submissionId) return
    if (useCache) {
      loadCache()
    } else {
      loadData()
    }
  }, [user, isRefreshing, group])

  const missingConfig = Object.entries({
    header,
    entity: group,
    venueId,
    reviewersId,
    programChairsId,
    authorsId,
    paperReviewsCompleteThreshold,
    submissionId,
    officialReviewName,
    commentName,
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
      {useCache && (
        <div className="alert alert-warning pc-console-loading">
          {pcConsoleData.timeStamp ? (
            <>
              <span>
                Data last updated {dayjs(pcConsoleData.timeStamp).fromNow()} (
                {formatDateTime(pcConsoleData.timeStamp, { second: undefined })})
              </span>{' '}
              <SpinnerButton
                className="btn btn-xs ml-2 mr-2"
                onClick={loadData}
                disabled={isLoadingData}
              >
                Reload
              </SpinnerButton>
              {isLoadingData && dataLoadingStatusMessage && (
                <>
                  <span>
                    {dataLoadingStatusMessage}{' '}
                    <LoadingSpinner inline text={null} extraClass="spinner-small" />
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <span>{dataLoadingStatusMessage}</span>
              <LoadingSpinner inline text={null} extraClass="spinner-small" />
            </>
          )}
        </div>
      )}
      <ConsoleTabs
        defaultActiveTabId="venue-configuration"
        tabs={[
          {
            id: 'venue-configuration',
            label: 'Overview',
            content: <Overview pcConsoleData={pcConsoleData} timelineData={timelineData} />,
            visible: true,
          },
          {
            id: `${submissionName.toLowerCase()}-status`,
            label: `${submissionName} Status`,
            content: (
              <PaperStatus
                pcConsoleData={pcConsoleData}
                loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
              />
            ),
            visible: true,
          },
          {
            id: `${reviewerUrlFormat}-status`,
            label: `${getSingularRoleName(prettyField(reviewerName))} Status`,
            content: (
              <ReviewerStatusTab
                pcConsoleData={pcConsoleData}
                loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
                loadRegistrationNoteMap={loadRegistrationNoteMap}
              />
            ),
            visible: true,
          },
          {
            id: `${areaChairUrlFormat}-status`,
            label: `${getSingularRoleName(prettyField(areaChairName))} Status`,
            content: (
              <AreaChairStatus
                pcConsoleData={pcConsoleData}
                loadSacAcInfo={loadSacAcInfo}
                loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
                loadRegistrationNoteMap={loadRegistrationNoteMap}
              />
            ),
            visible: areaChairsId,
          },
          {
            id: `${seniorAreaChairUrlFormat}-status`,
            label: `${getSingularRoleName(prettyField(seniorAreaChairName))} Status`,
            content: (
              <SeniorAreaChairStatus
                pcConsoleData={pcConsoleData}
                loadSacAcInfo={loadSacAcInfo}
                loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
              />
            ),
            visible: seniorAreaChairsId,
          },
          {
            id: 'deskrejectwithdrawn-status',
            label: `Desk Rejected/Withdrawn ${pluralizeString(submissionName)}`,
            content: <RejectedWithdrawnPapers consoleData={pcConsoleData} />,
            visible: withdrawnVenueId || deskRejectedVenueId,
          },
          ...(submissionContentFields.length > 0
            ? submissionContentFields.map((fieldAttrs) => ({
                id: fieldAttrs.field,
                label: prettyField(fieldAttrs.field),
                content: (
                  <PaperStatus
                    pcConsoleData={pcConsoleData}
                    loadReviewMetaReviewData={calculateNotesReviewMetaReviewData}
                    noteContentField={fieldAttrs}
                  />
                ),
                visible: true,
              }))
            : []),
          ...(extraTabs.length > 0
            ? extraTabs.map((tabAttrs) => ({
                id: tabAttrs.tabId,
                label: tabAttrs.tabName,
                content: tabAttrs.renderTab(),
                visible: true,
              }))
            : []),
        ]}
      />
    </>
  )
}

export default ProgramChairConsole
