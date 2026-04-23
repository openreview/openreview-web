import dayjs from 'dayjs'
import { camelCase } from 'lodash'
import groupBy from 'lodash/groupBy'
import { useSearchParams } from 'next/navigation'
import { useContext, useEffect, useState } from 'react'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { clearCache, getCache, setCache } from '../../lib/console-cache'
import { formatProfileContent } from '../../lib/edge-utils'
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
import ErrorDisplay from '../ErrorDisplay'
import LoadingSpinner from '../LoadingSpinner'
import SpinnerButton from '../SpinnerButton'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import ConsoleTabs from './ConsoleTabs'
import AreaChairStatus from './ProgramChairConsole/AreaChairStatus'
import Overview from './ProgramChairConsole/Overview'
import PaperStatus from './ProgramChairConsole/PaperStatus'
import RejectedWithdrawnPapers from './ProgramChairConsole/RejectedWithdrawnPapers'
import ReviewerStatusTab from './ProgramChairConsole/ReviewerStatus'
import SeniorAreaChairStatus from './ProgramChairConsole/SeniorAreaChairStatus'

// #region config docs
/** Program Chair Console config doc
 *
 * @typedef {Object} ProgramChairConsoleConfig
 *
 * @property {Object} header mandatory but can be empty object
 * @property {Object} entity mandatory
 * @property {string} venueId mandatory
 * @property {string} reviewersId mandatory
 * @property {string} programChairsId mandatory
 * @property {string} authorsId mandatory
 * @property {number} paperReviewsCompleteThreshold mandatory
 * @property {string} submissionId mandatory
 * @property {string} submissionVenueId mandatory
 * @property {string} officialReviewName mandatory
 * @property {string} commentName mandatory
 * @property {string} anonReviewerName mandatory
 * @property {string} shortPhrase mandatory
 * @property {boolean} enableQuerySearch mandatory
 * @property {string} submissionName mandatory
 * @property {string} areaChairsId optional
 * @property {string} seniorAreaChairsId optional
 * @property {string} bidName optional
 * @property {string} recommendationName optional
 * @property {string} metaReviewRecommendationName optional
 * @property {string[]} additionalMetaReviewFields optional
 * @property {string} requestFormId optional
 * @property {string} withdrawnVenueId optional
 * @property {string} deskRejectedVenueId optional
 * @property {string} officialMetaReviewName optional
 * @property {string} decisionName optional
 * @property {string} anonAreaChairName optional
 * @property {string} reviewerName optional
 * @property {string} areaChairName optional
 * @property {string} seniorAreaChairName optional
 * @property {string} secondaryAreaChairName optional
 * @property {string} secondaryAnonAreaChairName optional
 * @property {string} scoresName optional
 * @property {string|string[]|object[]} reviewRatingName optional
 * @property {string} reviewConfidenceName optional
 * @property {string} recruitmentName optional
 * @property {Object[]} paperStatusExportColumns optional
 * @property {Object[]} reviewerStatusExportColumns optional
 * @property {Object[]} areaChairStatusExportColumns optional
 * @property {Object[]} customStageInvitations optional
 * @property {Object} assignmentUrls optional
 * @property {string} emailReplyTo optional
 * @property {Object[]} reviewerEmailFuncs optional
 * @property {Object[]} acEmailFuncs optional
 * @property {Object[]} sacEmailFuncs optional
 * @property {Object[]} submissionContentFields optional
 * @property {boolean} sacDirectPaperAssignment optional
 * @property {Object} propertiesAllowed optional
 * @property {Object} areaChairStatusPropertiesAllowed optional
 * @property {Object} sacStatuspropertiesAllowed optional
 * @property {string[]} filterOperators optional
 * @property {string} messageReviewersInvitationId optional
 * @property {string} messageAreaChairsInvitationId optional
 * @property {string} messageSeniorAreaChairsInvitationId optional
 * @property {string} messageSubmissionReviewersInvitationId optional
 * @property {string} messageSubmissionAreaChairsInvitationId optional
 * @property {string} messageSubmissionSecondaryAreaChairsInvitationId optional
 * @property {string} preferredEmailInvitationId optional
 * @property {string} ithenticateInvitationId optional
 * @property {Object[]} displayReplyInvitations optional
 * @property {Object} metaReviewAgreementConfig optional
 * @property {boolean} useCache optional
 * @property {string} ethicsReviewersName optional
 * @property {string} ethicsChairsName optional
 * @property {Object} domainContent optional
 */

/**
 * @name ProgramChairConsoleConfig.header
 * @description Page header object with "title" and "instructions" (markdown supported).
 * @type {Object}
 * @default no default value
 * @example
 * {
 *   "header": {
 *     "title": "Some conference",
 *     "instructions": "some **instructions**"
 *   }
 * }
 */

/**
 * @name ProgramChairConsoleConfig.entity
 * @description Venue group entity. Required for loading and permission checks.
 * @type {Object}
 * @default no default value
 * @example
 * { "entity": { "id": "ICLR.cc/202X/Conference" } }
 */

/**
 * @name ProgramChairConsoleConfig.venueId
 * @description Venue group id used as base id/domain for links and API filters.
 * @type {string}
 * @default no default value
 * @example
 * { "venueId": "ICLR.cc/202X/Conference" }
 */

/**
 * @name ProgramChairConsoleConfig.submissionId
 * @description Submission invitation id used to load submissions shown in the console.
 * @type {string}
 * @default no default value
 * @example
 * { "submissionId": "ICLR.cc/202X/Conference/-/Submission" }
 */

/**
 * @name ProgramChairConsoleConfig.submissionName
 * @description Submission label used for tab names, invitation/group ids and links.
 * @type {string}
 * @default no default value
 * @example
 * { "submissionName": "Submission" }
 */

/**
 * @name ProgramChairConsoleConfig.paperReviewsCompleteThreshold
 * @description Threshold used for overview paper progress (papers at or above threshold are considered complete).
 * @type {number}
 * @default no default value
 * @example
 * { "paperReviewsCompleteThreshold": 3 }
 */

/**
 * @name ProgramChairConsoleConfig.submissionVenueId
 * @description Venue id value for active submissions under review. Used in reminder/status filtering.
 * @type {string}
 * @default no default value
 * @example
 * { "submissionVenueId": "ICLR.cc/202X/Conference/Submission" }
 */

/**
 * @name ProgramChairConsoleConfig.requestFormId
 * @description Request form note id used for overview timeline/details links. If missing, bottom part of overview tab will not be shown.
 * @type {string}
 * @default no default value
 * @example
 * { "requestFormId": "u4QodE3u4r" }
 */

/**
 * @name ProgramChairConsoleConfig.withdrawnVenueId
 * @description Venue id value that marks withdrawn submissions.
 * @type {string}
 * @default no default value
 * @example
 * { "withdrawnVenueId": "ICLR.cc/202X/Conference/Withdrawn_Submission" }
 */

/**
 * @name ProgramChairConsoleConfig.deskRejectedVenueId
 * @description Venue id value that marks desk-rejected submissions.
 * @type {string}
 * @default no default value
 * @example
 * { "deskRejectedVenueId": "ICLR.cc/202X/Conference/Desk_Rejected_Submission" }
 */

/**
 * @name ProgramChairConsoleConfig.reviewersId
 * @description Reviewer group id. Used for reviewer invitations, assignments, bids and messaging.
 * @type {string}
 * @default no default value
 * @example
 * { "reviewersId": "ICLR.cc/202X/Conference/Reviewers" }
 */

/**
 * @name ProgramChairConsoleConfig.reviewerName
 * @description Reviewer role label used to identify per-paper role groups and UI labels.
 * @type {string}
 * @default 'Reviewers'
 * @example
 * { "reviewerName": "Reviewers" }
 */

/**
 * @name ProgramChairConsoleConfig.anonReviewerName
 * @description Prefix of anonymous reviewer groups used to map reviews to assigned reviewers.
 * @type {string}
 * @default no default value
 * @example
 * { "anonReviewerName": "Reviewer_" }
 */

/**
 * @name ProgramChairConsoleConfig.areaChairsId
 * @description AC group id. Enables AC timeline/stats, AC status tab and AC messaging.
 * @type {string}
 * @default no default value
 * @example
 * { "areaChairsId": "ICLR.cc/202X/Conference/Area_Chairs" }
 */

/**
 * @name ProgramChairConsoleConfig.areaChairName
 * @description AC role label used to identify per-paper AC groups and display labels.
 * @type {string}
 * @default 'Area_Chairs'
 * @example
 * { "areaChairName": "Area_Chairs" }
 */

/**
 * @name ProgramChairConsoleConfig.anonAreaChairName
 * @description Prefix of anonymous AC groups used to map meta reviews to assigned ACs.
 * @type {string}
 * @default no default value
 * @example
 * { "anonAreaChairName": "Area_Chair_" }
 */

/**
 * @name ProgramChairConsoleConfig.seniorAreaChairsId
 * @description SAC group id. Enables SAC timeline/stats, SAC status tab and SAC messaging.
 * @type {string}
 * @default no default value
 * @example
 * { "seniorAreaChairsId": "ICLR.cc/202X/Conference/Senior_Area_Chairs" }
 */

/**
 * @name ProgramChairConsoleConfig.seniorAreaChairName
 * @description SAC role label used to identify per-paper SAC groups and display labels.
 * @type {string}
 * @default 'Senior_Area_Chairs'
 * @example
 * { "seniorAreaChairName": "Senior_Area_Chairs" }
 */

/**
 * @name ProgramChairConsoleConfig.secondaryAreaChairName
 * @description Secondary AC role label used for assignment/status/messaging for secondary ACs (secondary AC email support in PR #2208).
 * @type {string}
 * @default no default value
 * @example
 * { "secondaryAreaChairName": "Secondary_Area_Chairs" }
 */

/**
 * @name ProgramChairConsoleConfig.secondaryAnonAreaChairName
 * @description Prefix for anonymous secondary AC groups.
 * @type {string}
 * @default no default value
 * @example
 * { "secondaryAnonAreaChairName": "Secondary_Area_Chair_" }
 */

/**
 * @name ProgramChairConsoleConfig.programChairsId
 * @description Program chairs group id used in overview links.
 * @type {string}
 * @default no default value
 * @example
 * { "programChairsId": "ICLR.cc/202X/Conference/Program_Chairs" }
 */

/**
 * @name ProgramChairConsoleConfig.authorsId
 * @description Authors group id used in overview links and counts.
 * @type {string}
 * @default no default value
 * @example
 * { "authorsId": "ICLR.cc/202X/Conference/Authors" }
 */

/**
 * @name ProgramChairConsoleConfig.officialReviewName
 * @description Official review invitation name used for review parsing, stats and links.
 * @type {string}
 * @default no default value
 * @example
 * { "officialReviewName": "Official_Review" }
 */

/**
 * @name ProgramChairConsoleConfig.officialMetaReviewName
 * @description Meta-review invitation name used for status/statistics/link generation.
 * @type {string}
 * @default 'Meta_Review'
 * @example
 * { "officialMetaReviewName": "Meta_Review" }
 */

/**
 * @name ProgramChairConsoleConfig.commentName
 * @description Comment invitation name used in overview timeline display.
 * @type {string}
 * @default no default value
 * @example
 * { "commentName": "Official_Comment" }
 */

/**
 * @name ProgramChairConsoleConfig.decisionName
 * @description Decision invitation name used to parse/display per-submission decisions. Made optional in PR #1232.
 * @type {string}
 * @default 'Decision'
 * @example
 * { "decisionName": "Decision" }
 */

/**
 * @name ProgramChairConsoleConfig.bidName
 * @description Bid invitation suffix used for reviewer/AC/SAC bidding data and links. This config is optional since PR #1729.
 * @type {string}
 * @default no default value
 * @example
 * { "bidName": "Bid" }
 */

/**
 * @name ProgramChairConsoleConfig.recommendationName
 * @description Reviewer recommendation invitation suffix used for AC recommendation progress.
 * @type {string}
 * @default no default value
 * @example
 * { "recommendationName": "Recommendation" }
 */

/**
 * @name ProgramChairConsoleConfig.scoresName
 * @description Score invitation suffix used in edge browser links for bids/recommendations.
 * @type {string}
 * @default no default value
 * @example
 * { "scoresName": "Affinity_Score" }
 */

/**
 * @name ProgramChairConsoleConfig.metaReviewRecommendationName
 * @description Recommendation field key in meta-review content.
 * @type {string}
 * @default 'recommendation'
 * @example
 * { "metaReviewRecommendationName": "recommendation" }
 */

/**
 * @name ProgramChairConsoleConfig.additionalMetaReviewFields
 * @description Extra meta-review fields added to table/search/export and status views (feature added in PR #1828).
 * @type {string[]}
 * @default []
 * @example
 * { "additionalMetaReviewFields": ["final_recommendation"] }
 */

/**
 * @name ProgramChairConsoleConfig.reviewRatingName
 * @description Review rating field config. Supports string, string[] and object[] with fallback fields (fallback support added in PR #1808).
 * @type {string|string[]|object[]}
 * @default no default value
 * @example <caption>single field</caption>
 * { "reviewRatingName": "rating" }
 * @example <caption>multiple fields</caption>
 * { "reviewRatingName": ["soundness", "overall_recommendation"] }
 * @example <caption>fallback mapping</caption>
 * {
 *   "reviewRatingName": [
 *     { "overall_rating": ["final_rating", "preliminary_rating"] },
 *     "overall_recommendation"
 *   ]
 * }
 */

/**
 * @name ProgramChairConsoleConfig.reviewConfidenceName
 * @description Review confidence field used for confidence stats and export.
 * @type {string}
 * @default no default value
 * @example
 * { "reviewConfidenceName": "confidence" }
 */

/**
 * @name ProgramChairConsoleConfig.enableQuerySearch
 * @description Enables query-search controls in paper, AC and withdrawn/desk-rejected tabs.
 * @type {boolean}
 * @default no default value
 * @example
 * { "enableQuerySearch": true }
 */

/**
 * @name ProgramChairConsoleConfig.shortPhrase
 * @description Short venue phrase used in email subject and export file names.
 * @type {string}
 * @default no default value
 * @example
 * { "shortPhrase": "ICLR 202X" }
 */

/**
 * @name ProgramChairConsoleConfig.recruitmentName
 * @description Recruitment invitation suffix used in overview timeline.
 * @type {string}
 * @default 'Recruitment'
 * @example
 * { "recruitmentName": "Recruitment" }
 */

/**
 * @name ProgramChairConsoleConfig.paperStatusExportColumns
 * @description Extra export columns for the paper status table. This is an array of objects, where each object has: `header` (column title) and `getValue` (function body string executed with `row` in scope). getValue can get rather complex and the char escape should be handled carefully.
 * @type {Object[]}
 * @default no default value
 * @example <caption>basic exmaple</caption>
 * {
 *   "paperStatusExportColumns": [
 *     {
 *       "header": "Submission Type",
 *       "getValue": "row.note?.content?.submission_type?.value ?? 'N/A'"
 *     }
 *   ]
 * }
 * @example <caption>complex exmaple</caption>
 * {
 *   "paperStatusExportColumns": [
 *     {
 *       "header": "SAC Recommendation",
 *       "getValue": `const SACRecommendationNote = row.note?.details?.replies?.find(p => p.invitations.some(q => q.includes('SAC_Recommendation')));
return SACRecommendationNote ? \`\${SACRecommendationNote.content.decision?.value ?? 'N/A'}\` : 'N/A';`,
     },

 *     }
 *   ]
 * }
 */

/**
 * @name ProgramChairConsoleConfig.reviewerStatusExportColumns
 * @description Extra export columns for reviewer status table.
 * @type {Object[]}
 * @default no default value
 * @example
 * {
 *   "reviewerStatusExportColumns": [
 *     {
 *       "header": "OpenReview ID",
 *       "getValue": "row.reviewerProfileId"
 *     }
 *   ]
 * }
 */

/**
 * @name ProgramChairConsoleConfig.areaChairStatusExportColumns
 * @description Extra export columns for AC/SAC status tables.
 * @type {Object[]}
 * @default no default value
 * @example
 * {
 *   "areaChairStatusExportColumns": [
 *     {
 *       "header": "AC GS Scholar",
 *       "getValue": "row.areaChairProfile?.content?.gscholar ?? 'N/A'"
 *     }
 *   ]
 * }
 */

/**
 * @name ProgramChairConsoleConfig.propertiesAllowed
 * @description Additional query-search properties for paper status. Supports paths array and function strings.
 * @type {Object}
 * @default no default value
 * @example
 * {
 *   "propertiesAllowed": {
 *     "flagged": ["note.content.flagged_for_ethics_review.value","note.content.flagged_for_something_else.value"],
 *     "officialReviewCount": `const invitationToCheck="Official_Review";
const officialReviews = row.note?.details?.replies?.filter(reply => (reply.invitations.some(invitation => invitation.includes(invitationToCheck))))
return officialReviews.length;
`
 *   }
 * }
 */

/**
 * @name ProgramChairConsoleConfig.areaChairStatusPropertiesAllowed
 * @description Query-search properties override (instead of addition) for AC status, it also support function string
 * @type {Object}
 * @default built-in AC defaults
 * @example
 * {
 *   "areaChairStatusPropertiesAllowed": {
 *     "name": ["areaChairProfile.preferredName"],
 *     "numTotalReplyCount": `
            const notesAssigned = row.notes
            const replyCounts = notesAssigned.map(note => note.replyCount ?? 0)
            const totalReplyCount = replyCounts.reduce((sum, count) => sum + count, 0)
            return totalReplyCount
          `,
 *   }
 * }
 */

/**
 * @name ProgramChairConsoleConfig.sacStatuspropertiesAllowed
 * @description Query-search properties override for SAC status (direct paper assignment mode), it also support function string
 * @type {Object}
 * @default built-in SAC defaults
 * @example
 * {
 *   "sacStatuspropertiesAllowed": {
 *     "number": ["number"],
 *     "name": ["sacProfile.preferredName"],
 *     "email": ["sacProfile.preferredEmail"],
 *     "hasSubmissionWithFewerThan3Reviews": `
 *           const assignedNotes = row.notes
 *           const hasSubmission = assignedNotes.some(note => (note.officialReviews?.length ?? 0) < 3)
 *           return hasSubmission ? 'yes' : 'no'
 *         `
 *   }
 * }
 */

/**
 * @name ProgramChairConsoleConfig.filterOperators
 * @description Allowed query operators for query-search menu bars.
 * @type {string[]}
 * @default ["!=", ">=", "<=", ">", "<", "==", "="]
 * @example
 * { "filterOperators": ["=", "==", "!=", ">", "<", ">=", "<="] }
 */

/**
 * @name ProgramChairConsoleConfig.customStageInvitations
 * @description Additional stage configs used in overview progress cards and table search/export
 * @type {Object[]}
 * @default []
 * @example
 * {
 *   "customStageInvitations": [
 *     {
 *       "name": "Custom_Stage_Field_One",
 *       "role": "Area_Chairs",
 *       "repliesPerSubmission": 1,
 *       "displayField": "custom_stage_field_one",
 *       "extraDisplayFields": ["some_field"]
 *     }
 *   ]
 * }
 */

/**
 * @name ProgramChairConsoleConfig.metaReviewAgreementConfig
 * @description Config for dedicated meta-review agreement stage shown in overview and search/export, similar to customStageInvitations but has no extraDisplayFields. Another difference is metaReviewAgreement checks for reply to meta review instead of forum reply
 * @type {Object}
 * @default no default value
 * @example
 * {
 *   "metaReviewAgreementConfig": {
 *     "name": "Meta_Review_Agreement",
 *     "role": "Area_Chairs",
 *     "repliesPerSubmission": 1,
 *     "displayField": "decision",
 *     "description": "Agreement stage completion"
 *   }
 * }
 */

/**
 * @name ProgramChairConsoleConfig.assignmentUrls
 * @description Per-role assignment URL configuration for timeline and paper status assignment links.
 * @type {Object}
 * @default no default value
 * @example
 * {
 *   "assignmentUrls": {
 *     "Reviewers": {
 *       "manualAssignmentUrl": "/edges/browse?...",
 *       "automaticAssignment": false
 *     },
 *     "Area_Chairs": {
 *       "manualAssignmentUrl": "/edges/browse?...",
 *       "automaticAssignment": true
 *     }
 *   }
 * }
 */

/**
 * @name ProgramChairConsoleConfig.submissionContentFields
 * @description Adds extra paper-status tabs keyed by submission content fields
 * field: The submission content field that the tab will be based on. The tab will filter based on whether or not this field is present in a submission's content
responseInvitations: Array of invitation endings that are used to display replies that were made after, and in response to the submission being flagged
reasonInvitations: Array of invitation endings that are used to display replies that were made before, or in parallel, the flag and are the reason that the flag was raised
reasonFields: Object that contains content fields that may be in any of the notes that reply to any of the reason invitations. These are the fields and possible values that would cause the process function to flag the submission
 * @type {Object[]}
 * @default []
 * @example
 * {
 *   "submissionContentFields": [
 *     {
 *       "field": "ethics_review_flag",
 *       "reasonInvitations": ["Ethics_Review"],
 *       "reasonFields": { "ethics_review_triage": ['Ethics review needed.'] },
 *       "responseInvitations": ["Ethics_Response"]
 *     }
 *   ]
 * }
 */

/**
 * @name ProgramChairConsoleConfig.sacDirectPaperAssignment
 * @description If true, SAC status tab shows direct paper assignment progress instead of SAC-to-AC mapping.
 * @type {boolean}
 * @default no default value
 * @example
 * { "sacDirectPaperAssignment": true }
 */

/**
 * @name ProgramChairConsoleConfig.messageReviewersInvitationId
 * @description Invitation id used when sending bulk reminders from Reviewer Status tab.
 * @type {string}
 * @default no default value
 * @example
 * { "messageReviewersInvitationId": "ICLR.cc/202X/Conference/Reviewers/-/Message" }
 */

/**
 * @name ProgramChairConsoleConfig.messageAreaChairsInvitationId
 * @description Invitation id used when sending bulk reminders from AC Status tab.
 * @type {string}
 * @default no default value
 * @example
 * { "messageAreaChairsInvitationId": "ICLR.cc/202X/Conference/Area_Chairs/-/Message" }
 */

/**
 * @name ProgramChairConsoleConfig.messageSeniorAreaChairsInvitationId
 * @description Invitation id used when sending bulk reminders from SAC Status tab.
 * @type {string}
 * @default no default value
 * @example
 * { "messageSeniorAreaChairsInvitationId": "ICLR.cc/202X/Conference/Senior_Area_Chairs/-/Message" }
 */

/**
 * @name ProgramChairConsoleConfig.messageSubmissionReviewersInvitationId
 * @description Per-submission reviewer reminder invitation id used by Paper Status messaging modal.
 * @type {string}
 * @default no default value
 * @example
 * {
 *   "messageSubmissionReviewersInvitationId": "ICLR.cc/202X/Conference/Submission{number}/-/Message"
 * }
 */

/**
 * @name ProgramChairConsoleConfig.messageSubmissionAreaChairsInvitationId
 * @description Per-submission AC reminder invitation id used by Paper Status messaging modal (selected-paper AC messaging added in PR #2011).
 * @type {string}
 * @default no default value
 * @example
 * {
 *   "messageSubmissionAreaChairsInvitationId": "ICLR.cc/202X/Conference/Submission{number}/Area_Chairs/-/Message"
 * }
 */

/**
 * @name ProgramChairConsoleConfig.messageSubmissionSecondaryAreaChairsInvitationId
 * @description Per-submission secondary-AC reminder invitation id used by Paper Status messaging modal (secondary AC messaging support in PR #2208).
 * @type {string}
 * @default no default value
 * @example
 * {
 *   "messageSubmissionSecondaryAreaChairsInvitationId": "ICLR.cc/202X/Conference/Submission{number}/Secondary_Area_Chairs/-/Message"
 * }
 */

/**
 * @name ProgramChairConsoleConfig.preferredEmailInvitationId
 * @description Invitation id for preferred-email edges used by profile links and copy-email actions.
 * @type {string}
 * @default no default value
 * @example
 * { "preferredEmailInvitationId": "ICLR.cc/202X/Conference/-/Preferred_Email" }
 */

/**
 * @name ProgramChairConsoleConfig.emailReplyTo
 * @description Reply-to address for reminder emails sent from PC console tabs.
 * @type {string}
 * @default no default value
 * @example
 * { "emailReplyTo": "pc@conference.org" }
 */

/**
 * @name ProgramChairConsoleConfig.reviewerEmailFuncs
 * @description Extra custom message filter options for the Reviewer Status message dropdown.
 * @type {Object[]}
 * @default no default value
 * @example
 * {
 *   "reviewerEmailFuncs": [
 *     {
 *       "label": "Reviewers with Zero Load",
 *       "filterFunc": `
        var loadNotes = row.reviewerProfile.registrationNotes?.filter(n => n.invitations.some(i => i.includes('Max_Load')));
        return parseInt(loadNotes?.[0]?.content?.maximum_load_this_cycle?.value, 10) == 0 ?? False
        `
 *     }
 *   ]
 * }
 */

/**
 * @name ProgramChairConsoleConfig.acEmailFuncs
 * @description Extra custom message filter options for the Area Chair Status message dropdown, similar to reviewerEmailFuncs.
 * @type {Object[]}
 * @default no default value
 * @example
 * {
 *   "acEmailFuncs": [
 *     {
 *       "label": "ACs from custom filter",
 *       "filterFunc": "return row.numCompletedMetaReviews === 0"
 *     }
 *   ]
 * }
 */

/**
 * @name ProgramChairConsoleConfig.sacEmailFuncs
 * @description Extra custom message filter options for the Senior Area Chair Status message dropdown, similar to reviewerEmailFuncs.
 * @type {Object[]}
 * @default no default value
 * @example
 * {
 *   "sacEmailFuncs": [
 *     {
 *       "label": "SACs from custom filter",
 *       "filterFunc": "return row.notes?.length === 0"
 *     }
 *   ]
 * }
 */

/**
 * @name ProgramChairConsoleConfig.ithenticateInvitationId
 * @description Duplication edge invitation id used to display/export similarity percentages.
 * @type {string}
 * @default no default value
 * @example
 * {
 *   "ithenticateInvitationId": "ICLR.cc/202X/Conference/Submission/-/Ithenticate"
 * }
 */

/**
 * @name ProgramChairConsoleConfig.displayReplyInvitations
 * @description Enables and configures the “Latest Replies” column in Paper Status (added in PR #2237).
 * @type {Object[]}
 * @default no default value
 * @example
 * {
 *   "displayReplyInvitations": [
 *     {
 *       "id": "ICLR.cc/202X/Conference/Submission{number}/-/Official_Comment",
 *       "fields": ["summary", "limitations"]
 *     },
 *     {
 *       "id": "ICLR.cc/202X/Conference/Submission{number}/-/Public_Comment",
 *       "fields": ["strengths", "suitability"]
 *     }
 *   ]
 * }
 */

/**
 * @name ProgramChairConsoleConfig.useCache
 * @description If true, PC console loads/saves data via console cache and shows reload banner.
 * @type {boolean}
 * @default false
 * @example
 * { "useCache": true }
 */

/**
 * @name ProgramChairConsoleConfig.ethicsReviewersName
 * @description Ethics reviewer role label used in timeline/overview role display.
 * @type {string}
 * @default 'Ethics_Reviewers'
 * @example
 * { "ethicsReviewersName": "Ethics_Reviewers" }
 */

/**
 * @name ProgramChairConsoleConfig.ethicsChairsName
 * @description Ethics chair role label used in timeline/overview role display.
 * @type {string}
 * @default 'Ethics_Chairs'
 * @example
 * { "ethicsChairsName": "Ethics_Chairs" }
 */

/**
 * @name ProgramChairConsoleConfig.domainContent
 * @description Domain-level content fallback used in overview for role setup metadata.
 * @type {Object}
 * @default no default value
 * @example
 * {
 *   "domainContent": {
 *     "reviewer_roles": ["Reviewers"],
 *     "area_chair_roles": ["Area_Chairs"],
 *     "senior_area_chair_roles": ["Senior_Area_Chairs"]
 *   }
 * }
 */
// #endregion

const ProgramChairConsole = ({ appContext, extraTabs = [] }) => {
  const {
    header,
    entity: group,
    venueId,
    reviewersId,
    programChairsId,
    authorsId,
    paperReviewsCompleteThreshold,
    submissionId,
    submissionVenueId,
    officialReviewName,
    commentName,
    anonReviewerName,
    shortPhrase,
    enableQuerySearch,
    submissionName,
    areaChairsId,
    seniorAreaChairsId,
    bidName,
    recommendationName, // to get ac recommendation edges
    metaReviewRecommendationName = 'recommendation', // recommendation field in meta review
    additionalMetaReviewFields = [],
    requestFormId,
    withdrawnVenueId,
    deskRejectedVenueId,
    officialMetaReviewName = 'Meta_Review',
    decisionName = 'Decision',
    anonAreaChairName,
    reviewerName = 'Reviewers',
    areaChairName = 'Area_Chairs',
    seniorAreaChairName = 'Senior_Area_Chairs',
    secondaryAreaChairName,
    secondaryAnonAreaChairName,
    scoresName,
    reviewRatingName,
    reviewConfidenceName,
    recruitmentName,
    paperStatusExportColumns,
    reviewerStatusExportColumns,
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
    filterOperators,
    messageReviewersInvitationId,
    messageAreaChairsInvitationId,
    messageSeniorAreaChairsInvitationId,
    messageSubmissionReviewersInvitationId,
    messageSubmissionAreaChairsInvitationId,
    messageSubmissionSecondaryAreaChairsInvitationId,
    preferredEmailInvitationId,
    ithenticateInvitationId,
    displayReplyInvitations,
    metaReviewAgreementConfig,
    useCache = false,
    ethicsReviewersName = 'Ethics_Reviewers',
    ethicsChairsName = 'Ethics_Chairs',
    domainContent = {},
  } = useContext(WebFieldContext)
  const { setBannerContent } = appContext ?? {}
  const { user, isRefreshing } = useUser()
  const query = useSearchParams()
  const [pcConsoleData, setPcConsoleData] = useState({})
  const [timelineData, setTimelineData] = useState({})
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataLoadingStatusMessage, setDataLoadingStatusMessage] = useState('Data is loading')

  const seniorAreaChairUrlFormat = getRoleHashFragment(seniorAreaChairName)
  const areaChairUrlFormat = getRoleHashFragment(areaChairName)
  const reviewerUrlFormat = getRoleHashFragment(reviewerName)

  const reviewersInvitedId = reviewersId ? `${reviewersId}/Invited` : null
  const areaChairsInvitedId = areaChairsId ? `${areaChairsId}/Invited` : null
  const seniorAreaChairsInvitedId = seniorAreaChairsId ? `${seniorAreaChairsId}/Invited` : null

  const loadData = async () => {
    if (isLoadingData) return
    setIsLoadingData(true)
    setDataLoadingStatusMessage('Data is loading')
    await clearCache(venueId)

    try {
      // #region getInvitationMap
      const conferenceInvitationsP = api.getAll('/invitations', {
        prefix: `${venueId}/-/.*`,
        expired: true,
        type: 'all',
        domain: venueId,
      })
      const reviewerInvitationsP = api.getAll('/invitations', {
        prefix: `${reviewersId}/-/.*`,
        expired: true,
        type: 'all',
        domain: venueId,
      })
      const acInvitationsP = areaChairsId
        ? api.getAll('/invitations', {
            prefix: `${areaChairsId}/-/.*`,
            expired: true,
            type: 'all',
            domain: venueId,
          })
        : Promise.resolve([])
      const sacInvitationsP = seniorAreaChairsId
        ? api.getAll('/invitations', {
            prefix: `${seniorAreaChairsId}/-/.*`,
            expired: true,
            type: 'all',
            domain: venueId,
          })
        : Promise.resolve([])

      const customStageInvitationsP = customStageInvitations
        ? api.getAll('/invitations', {
            ids: customStageInvitations.map((p) => `${venueId}/-/${p.name}`),
            type: 'note',
            domain: venueId,
          })
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
            .getNoteById(
              requestFormId,
              undefined,
              {
                select: 'id,content',
              },
              undefined
            )
            .catch((error) => {
              if (error.name === 'ForbiddenError') {
                promptError(
                  'You do not have access to the venue configuration, please refer to the [documentation](https://docs.openreview.net/getting-started/frequently-asked-questions/how-do-i-add-a-program-chair-to-my-venue).'
                )
                return null
              }
              throw error
            })
        : Promise.resolve(null)
      // #endregion

      // #region getRegistrationForms
      const prefixes = [reviewersId, areaChairsId, seniorAreaChairsId].filter(Boolean)
      const getRegistrationFormResultsP = Promise.all(
        prefixes.map((prefix) =>
          api
            .getAll('/notes', {
              invitation: `${prefix}/-/.*`,
              signature: venueId,
              select: 'id,invitation,invitations,content.title',
              domain: venueId,
            })
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

      // #region get invited groups
      const invitedGroupsP = await Promise.all(
        [reviewersInvitedId, areaChairsInvitedId, seniorAreaChairsInvitedId].map((invitedId) =>
          invitedId
            ? api.getGroupById(invitedId, undefined, { select: 'members' })
            : Promise.resolve(null)
        )
      )
      // #endregion

      // #region get Reviewer, AC, SAC members
      const committeeMemberResultsP = Promise.all(
        [reviewersId, areaChairsId, seniorAreaChairsId].map((id) =>
          id ? api.getGroupById(id, undefined, { select: 'members' }) : Promise.resolve([])
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
          ? api.get('/edges', {
              invitation: `${reviewersId}/-/${recommendationName}`,
              groupBy: 'id',
              select: 'signatures',
              domain: venueId,
            })
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
            { resultsKey: 'groupedEdges' }
          )
        })
      )
      // #endregion

      // #region getGroups (per paper groups)
      const perPaperGroupResultsP = api.get('/groups', {
        prefix: `${venueId}/${submissionName}.*`,
        stream: true,
        select: 'id,members',
        domain: venueId,
      })
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
              { resultsKey: 'groupedEdges' }
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
        invitedGroupsP,
      ])

      const committeeMemberResults = results[0]
      const ithenticateEdges = results[5]
      const notes = []
      let withdrawnNotesCount = 0
      let deskRejectedNotesCount = 0
      results[1].forEach((note) => {
        if (note.content?.venueid?.value === withdrawnVenueId) {
          withdrawnNotesCount += 1
          return
        }
        if (note.content?.venueid?.value === deskRejectedVenueId) {
          deskRejectedNotesCount += 1
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
      const acRecommendationsEdgeResults = results[2]
      const bidCountResults = results[3]
      const perPaperGroupResults = results[4]
      const invitedGroupsResult = results[6]

      // #region categorize result of per paper groups
      const reviewerGroups = []
      const anonReviewerGroups = {}
      const areaChairGroups = []
      const anonAreaChairGroups = {}
      const anonAreaChairIdMap = new Map()
      const secondaryAreaChairGroups = []
      const secondaryAnonAreaChairGroups = {}
      const seniorAreaChairGroups = []
      const allGroupMembers = new Set()

      const activeNoteNumbers = notes.map((p) => p.number)

      for (let index = 0; index < perPaperGroupResults.groups?.length; index += 1) {
        const p = perPaperGroupResults.groups[index]
        const number = getNumberFromGroup(p.id, submissionName)
        if (!number || !activeNoteNumbers.includes(number)) continue

        if (p.id.endsWith(`/${reviewerName}`)) {
          reviewerGroups.push({
            noteNumber: number,
            ...p,
          })
          for (let reviewerIndex = 0; reviewerIndex < p.members.length; reviewerIndex += 1) {
            const member = p.members[reviewerIndex]
            if (anonReviewerGroups[number] === undefined) anonReviewerGroups[number] = {}
            if (
              anonReviewerGroups[number][member] === undefined &&
              member.includes(anonReviewerName)
            ) {
              anonReviewerGroups[number][member] = member
            }
          }
          continue
        }
        if (p.id.includes(`/${anonReviewerName}`)) {
          if (anonReviewerGroups[number] === undefined) anonReviewerGroups[number] = {}
          if (p.members.length) anonReviewerGroups[number][p.id] = p.members[0]
          for (
            let anonReviewerIndex = 0;
            anonReviewerIndex < p.members.length;
            anonReviewerIndex += 1
          ) {
            const member = p.members[anonReviewerIndex]
            allGroupMembers.add(member)
          }
          continue
        }
        if (p.id.endsWith(`/${areaChairName}`)) {
          areaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          for (let acMemberIndex = 0; acMemberIndex < p.members.length; acMemberIndex += 1) {
            const member = p.members[acMemberIndex]
            if (anonAreaChairGroups[number] === undefined) anonAreaChairGroups[number] = {}
            if (
              anonAreaChairGroups[number][member] === undefined &&
              member.includes(`/${anonAreaChairName}`)
            ) {
              anonAreaChairGroups[number][member] = member
            }
          }
          continue
        }
        if (p.id.includes(`/${anonAreaChairName}`)) {
          if (anonAreaChairGroups[number] === undefined) anonAreaChairGroups[number] = {}
          if (p.members.length) {
            anonAreaChairGroups[number][p.id] = p.members[0]
            anonAreaChairIdMap.set(p.id, p.members[0])
          }
          for (let anonACIndex = 0; anonACIndex < p.members.length; anonACIndex += 1) {
            const member = p.members[anonACIndex]
            allGroupMembers.add(member)
          }
          continue
        }
        if (p.id.endsWith(seniorAreaChairName)) {
          seniorAreaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          for (let sacIndex = 0; sacIndex < p.members.length; sacIndex += 1) {
            const member = p.members[sacIndex]
            allGroupMembers.add(member)
          }
          continue
        }
        if (secondaryAreaChairName && p.id.endsWith(`/${secondaryAreaChairName}`)) {
          secondaryAreaChairGroups.push({
            noteNumber: getNumberFromGroup(p.id, submissionName),
            ...p,
          })
          for (
            let secondaryACIndex = 0;
            secondaryACIndex < p.members.length;
            secondaryACIndex += 1
          ) {
            const member = p.members[secondaryACIndex]
            if (secondaryAnonAreaChairGroups[number] === undefined)
              secondaryAnonAreaChairGroups[number] = {}
            if (
              secondaryAnonAreaChairGroups[number][member] === undefined &&
              member.includes(`/${secondaryAnonAreaChairName}`)
            ) {
              secondaryAnonAreaChairGroups[number][member] = member
            }
          }
          continue
        }
        if (secondaryAreaChairName && p.id.includes(`/${secondaryAnonAreaChairName}`)) {
          if (secondaryAnonAreaChairGroups[number] === undefined)
            secondaryAnonAreaChairGroups[number] = {}
          if (p.members.length) secondaryAnonAreaChairGroups[number][p.id] = p.members[0]
          for (
            let secondaryAnonACIndex = 0;
            secondaryAnonACIndex < p.members.length;
            secondaryAnonACIndex += 1
          ) {
            const member = p.members[secondaryAnonACIndex]
            allGroupMembers.add(member)
          }
        }
      }
      // #endregion

      // #region get all profiles(with assignments)
      const allIds = [...allGroupMembers]
      const ids = allIds.filter((p) => p.startsWith('~'))
      const getProfilesByIdsP = ids.length
        ? api.post('/profiles/search', {
            ids,
          })
        : Promise.resolve([])
      setDataLoadingStatusMessage('Loading profiles')
      const profileResults = await getProfilesByIdsP
      const allProfilesMap = new Map()
      const _ = (profileResults.profiles ?? []).forEach((profile) => {
        const reducedProfile = {
          id: profile.id,
          preferredName: getProfileName(profile),
          title: formatProfileContent(profile.content).title,
          usernames: profile.content.names.flatMap((p) => p.username ?? []),
        }

        const usernames = profile.content.names.flatMap((p) => p.username ?? [])
        usernames.concat(profile.email ?? []).forEach((key) => {
          allProfilesMap.set(key, reducedProfile)
        })
      })
      // #endregion
      const officialReviewsByPaperNumberMap = new Map()
      const metaReviewsByPaperNumberMap = new Map()
      const decisionByPaperNumberMap = new Map()
      const customStageReviewsByPaperNumberMap = new Map()
      const metaReviewAgreementsByPaperNumberMap = new Map()
      const displayReplyInvitationsByPaperNumberMap = new Map()
      notes.forEach((note) => {
        const replies = note.details.replies ?? []
        const officialReviews = []
        const metaReviews = []
        let decision
        const customStageReviews = []
        const metaReviewAgreements = []
        const latestDisplayReplies = []

        const officialReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
        const officialMetaReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`
        const decisionInvitationId = `${venueId}/${submissionName}${note.number}/-/${decisionName}`
        const customStageInvitationIds = customStageInvitations
          ? customStageInvitations.map((p) => `/-/${p.name}`)
          : []
        const displayInvitationIds = displayReplyInvitations
          ? displayReplyInvitations.map((p) => p.id.replaceAll('{number}', note.number))
          : []

        replies.forEach((reply) => {
          if (reply.invitations.includes(officialReviewInvitationId)) {
            let anonymousGroupId
            if (reply.signatures[0].startsWith('~')) {
              const idToAnonIdMap = Object.keys(anonReviewerGroups[note.number] ?? {}).reduce(
                (prev, curr) => ({ ...prev, [anonReviewerGroups[note.number][curr]]: curr }),
                {}
              )

              Object.entries(idToAnonIdMap).forEach(
                ([anonReviewerId, anonReviewerGroupId]) => {
                  const profile = allProfilesMap.get(anonReviewerId)
                  if (!profile) return
                  profile.usernames.concat(profile.email ?? []).forEach((key) => {
                    idToAnonIdMap[key] = anonReviewerGroupId
                  })
                }
              )
              anonymousGroupId = idToAnonIdMap?.[reply.signatures[0]] ?? ''
            } else {
              anonymousGroupId = reply.signatures[0]
            }

            officialReviews.push({
              content: reply.content,
              id: reply.id,
              signatures: reply.signatures,
              forum: reply.forum,
              anonId: getIndentifierFromGroup(anonymousGroupId, anonReviewerName),
            })
          }
          if (reply.invitations.includes(officialMetaReviewInvitationId)) {
            metaReviews.push({
              id: reply.id,
              forum: reply.forum,
              content: reply.content,
              signatures: reply.signatures,
              anonId: getIndentifierFromGroup(reply.signatures[0], anonAreaChairName),
            })
          }
          if (reply.invitations.includes(decisionInvitationId)) {
            decision = reply
          }
          if (
            metaReviewAgreementConfig &&
            reply.invitations.some((p) => p.includes(`/-/${metaReviewAgreementConfig.name}`))
          ) {
            metaReviewAgreements.push(reply)
          }
          if (
            reply.invitations.some((p) => customStageInvitationIds.some((q) => p.includes(q)))
          ) {
            customStageReviews.push(reply)
          }

          const displayInvitationId = displayInvitationIds.find((p) =>
            reply.invitations.includes(p)
          )
          if (!displayInvitationId) return
          const displayInvitation = displayReplyInvitations.find(
            (p) => p.id === displayInvitationId
          )
          const replyOfDisplayInvitationIndex = latestDisplayReplies.findIndex(
            (p) => p.invitationId === displayInvitationId
          )
          if (replyOfDisplayInvitationIndex === -1) {
            // new
            latestDisplayReplies.push({
              id: reply?.id,
              date: reply?.mdate,
              invitationId: displayInvitationId,
              values: displayInvitation.fields.map((field) => {
                const value = reply?.content?.[field]?.value?.toString()
                return {
                  field,
                  value,
                }
              }),
              signature: reply?.signatures?.[0],
            })
          } else {
            // get latest
            const existingReplyOfDisplayInvitation =
              latestDisplayReplies[replyOfDisplayInvitationIndex]
            if (existingReplyOfDisplayInvitation.mdate < reply.mdate) {
              latestDisplayReplies[replyOfDisplayInvitationIndex] = {
                id: reply?.id,
                date: reply?.mdate,
                invitationId: displayInvitationId,
                values: displayInvitation.fields.map((field) => {
                  const value = reply?.content?.[field]?.value?.toString()
                  return {
                    field,
                    value,
                  }
                }),
                signature: reply?.signatures?.[0],
              }
            }
          }
        })

        if (officialReviews.length) {
          officialReviewsByPaperNumberMap.set(note.number, officialReviews)
        }
        if (metaReviews.length) {
          metaReviewsByPaperNumberMap.set(note.number, metaReviews)
        }
        if (decision) {
          decisionByPaperNumberMap.set(note.number, decision)
        }
        if (customStageReviews.length) {
          customStageReviewsByPaperNumberMap.set(note.number, customStageReviews)
        }
        if (metaReviewAgreements.length) {
          metaReviewAgreementsByPaperNumberMap.set(note.number, metaReviewAgreements)
        }
        if (latestDisplayReplies.length) {
          displayReplyInvitationsByPaperNumberMap.set(note.number, latestDisplayReplies)
        }
        note.replyCount = replies.length
        if (useCache) delete note.details?.replies
      })

      // map reviewer recommendation to ac id to calculate recommendation progress correctly
      const acRecommendationsCount = acRecommendationsEdgeResults.groupedEdges?.reduce(
        (profileMap, edge) => {
          const recommendationSignature = edge.values[0].signatures[0]
          let acId = recommendationSignature
          if (recommendationSignature.startsWith(venueId)) {
            // recommendation signed with anon id
            acId = anonAreaChairIdMap.get(recommendationSignature)
          }
          if (!profileMap[acId]) {
            profileMap[acId] = 0 // eslint-disable-line no-param-reassign
          }
          profileMap[acId] += 1 // eslint-disable-line no-param-reassign
          return profileMap
        },
        {}
      )

      const consoleData = {
        invitations: invitationResults,
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
        metaReviewAgreementsByPaperNumberMap,
        displayReplyInvitationsByPaperNumberMap,
        withdrawnNotesCount,
        deskRejectedNotesCount,
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
        reviewersInvitedCount: invitedGroupsResult[0]?.members?.length ?? 0,
        areaChairsInvitedCount: invitedGroupsResult[1]?.members?.length ?? 0,
        seniorAreaChairsInvitedCount: invitedGroupsResult[2]?.members?.length ?? 0,
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

  const calculateNotesReviewMetaReviewData = () => {
    if (!pcConsoleData) return new Map()
    const noteNumberReviewMetaReviewMap = new Map()
    const noteNumberReviewerGroupMembersMap = new Map()
    const noteNumberACGroupMembersSecondariesMap = new Map()
    const noteNumberSeniorAcGroupMembersMap = new Map()

    pcConsoleData.paperGroups.reviewerGroups?.forEach((p) => {
      noteNumberReviewerGroupMembersMap.set(p.noteNumber, p.members)
    })
    pcConsoleData.paperGroups.areaChairGroups?.forEach((p) => {
      noteNumberACGroupMembersSecondariesMap.set(p.noteNumber, {
        members: p.members ?? [],
        secondaries: p.secondaries ?? [],
      })
    })

    pcConsoleData.paperGroups.seniorAreaChairGroups?.forEach((p) => {
      noteNumberSeniorAcGroupMembersMap.set(p.noteNumber, p.members)
    })

    pcConsoleData.notes.forEach((note) => {
      const assignedReviewers = noteNumberReviewerGroupMembersMap.get(note.number) ?? []
      const assignedACs = noteNumberACGroupMembersSecondariesMap.get(note.number) ?? {
        members: [],
        secondaries: [],
      }

      const assignedReviewerProfiles = assignedReviewers.map((reviewer) => ({
        id: reviewer.reviewerProfileId,
        profile: pcConsoleData.allProfilesMap.get(reviewer.reviewerProfileId),
      }))

      const assignedAreaChairs = assignedACs.members

      const assignedAreaChairProfiles = assignedAreaChairs.map((areaChair) => ({
        id: areaChair.areaChairProfileId,
        profile: pcConsoleData.allProfilesMap.get(areaChair.areaChairProfileId),
      }))

      const secondaryAreaChairs = assignedACs.secondaries

      const secondaryAreaChairProfiles = secondaryAreaChairs.map((areaChair) => ({
        id: areaChair.areaChairProfileId,
        profile: pcConsoleData.allProfilesMap.get(areaChair.areaChairProfileId),
      }))

      const assignedSeniorAreaChairs = noteNumberSeniorAcGroupMembersMap.get(note.number) ?? []

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
      const metaReviewAgreements =
        pcConsoleData.metaReviewAgreementsByPaperNumberMap?.get(note.number) ?? []
      const metaReviews = (
        pcConsoleData.metaReviewsByPaperNumberMap?.get(note.number) ?? []
      ).map((metaReview) => {
        const metaReviewAgreement = metaReviewAgreementConfig
          ? metaReviewAgreements.find(
              (p) => p.replyto === metaReview.id || p.forum === metaReview.forum
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
            preferredName: profile ? profile.preferredName : reviewer.reviewerProfileId,
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
          replyCount: note.replyCount,
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
              preferredName: profile ? profile.preferredName : areaChair.areaChairProfileId,
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
              preferredName: profile ? profile.preferredName : areaChair.areaChairProfileId,
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
              preferredName: profile ? profile.preferredName : seniorAreaChairProfileId,
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
        displayReplies:
          pcConsoleData.displayReplyInvitationsByPaperNumberMap.get(note.number) ?? [],
        decision,
        venue: note?.content?.venue?.value,
        messageSignature: programChairsId,
        ithenticateEdge: pcConsoleData.ithenticateEdges.find((p) => p.head === note.id),
      })
    })

    // add profileRegistrationNote
    pcConsoleData.allProfilesMap.forEach((profile, id) => {
      const usernames = profile.usernames ?? []

      let userRegNotes = []
      usernames.forEach((username) => {
        if (pcConsoleData.registrationNoteMap && pcConsoleData.registrationNoteMap[username]) {
          userRegNotes = userRegNotes.concat(pcConsoleData.registrationNoteMap[username])
        }
      })
      profile.registrationNotes = userRegNotes
    })

    setPcConsoleData((data) => ({ ...data, noteNumberReviewMetaReviewMap }))
  }

  const loadSacAcInfo = async () => {
    // #region get sac edges to get sac of ac
    const sacEdgeResult = seniorAreaChairsId
      ? await api
          .get('/edges', {
            invitation: `${seniorAreaChairsId}/-/Assignment`,
            groupBy: 'head,tail',
            select: 'head,tail',
            domain: venueId,
          })
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
    const getProfilesByIdsP = ids.length
      ? api.post('/profiles/search', {
          ids,
        })
      : Promise.resolve([])
    const profileResults = await getProfilesByIdsP
    const acSacProfilesWithoutAssignment = (profileResults.profiles ?? []).map((profile) => ({
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
          api.get('/notes', {
            forum: regForm.id,
            select: 'id,signatures,invitations,content',
            domain: venueId,
            stream: true,
          })
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
    return <ErrorDisplay statusCode="" message={errorMessage} withLayout={false} />
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
        defaultActiveTabId="overview"
        tabs={[
          {
            id: 'overview',
            label: 'Overview',
            content: <Overview pcConsoleData={pcConsoleData} timelineData={timelineData} />,
            visible: true,
            alwaysMount: true,
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
