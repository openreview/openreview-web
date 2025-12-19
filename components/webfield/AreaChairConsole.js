/* eslint-disable max-len */
/* globals $,promptMessage,promptError,typesetMathJax: false */

import { useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { camelCase, chunk, orderBy } from 'lodash'
import Link from 'next/link'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import Table from '../Table'
import ErrorDisplay from '../ErrorDisplay'
import NoteSummary from './NoteSummary'
import { AcPcConsoleNoteReviewStatus, LatestReplies } from './NoteReviewStatus'
import { AreaChairConsoleNoteMetaReviewStatus } from './NoteMetaReviewStatus'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import {
  getNumberFromGroup,
  getIndentifierFromGroup,
  prettyId,
  prettyList,
  inflect,
  parseNumberField,
  prettyField,
  pluralizeString,
  getSingularRoleName,
  getRoleHashFragment,
} from '../../lib/utils'
import AreaChairConsoleMenuBar from './AreaChairConsoleMenuBar'
import LoadingSpinner from '../LoadingSpinner'
import ConsoleTaskList from './ConsoleTaskList'
import { getProfileLink } from '../../lib/webfield-utils'
import { formatProfileContent } from '../../lib/edge-utils'
import ConsoleTabs from './ConsoleTabs'
import SelectAllCheckBox from './SelectAllCheckbox'

const AssignedPaperRow = ({
  rowData,
  venueId,
  areaChairName,
  officialReviewName,
  submissionName,
  metaReviewRecommendationName,
  selectedNoteIds,
  setSelectedNoteIds,
  shortPhrase,
  showCheckbox = true,
  additionalMetaReviewFields,
  activeTabId,
  displayReplyInvitations,
}) => {
  const { note, metaReviewData, ithenticateEdge } = rowData
  const referrerUrl = encodeURIComponent(
    `[${prettyField(
      areaChairName
    )} Console](/group?id=${venueId}/${areaChairName}${activeTabId})`
  )
  return (
    <tr>
      {showCheckbox && (
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
      )}
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary
          note={note}
          referrerUrl={referrerUrl}
          isV2Note={true}
          ithenticateEdge={ithenticateEdge}
        />
      </td>
      <td>
        <AcPcConsoleNoteReviewStatus
          rowData={rowData}
          venueId={venueId}
          officialReviewName={officialReviewName}
          referrerUrl={referrerUrl}
          shortPhrase={shortPhrase}
          submissionName={submissionName}
        />
      </td>
      {displayReplyInvitations?.length && (
        <td>
          <LatestReplies rowData={rowData} referrerUrl={referrerUrl} />
        </td>
      )}
      <td>
        <AreaChairConsoleNoteMetaReviewStatus
          note={note}
          metaReviewData={metaReviewData}
          metaReviewRecommendationName={metaReviewRecommendationName}
          referrerUrl={referrerUrl}
          additionalMetaReviewFields={additionalMetaReviewFields}
        />
      </td>
    </tr>
  )
}

const AreaChairConsoleTasks = ({
  venueId,
  areaChairName,
  defaultAreaChairName = areaChairName,
}) => {
  const areaChairUrlFormat = areaChairName ? getRoleHashFragment(areaChairName) : null
  const referrer = encodeURIComponent(
    `[${prettyField(
      defaultAreaChairName
    )} Console](/group?id=${venueId}/${defaultAreaChairName}#${areaChairUrlFormat}-tasks)`
  )

  return (
    <ConsoleTaskList
      venueId={venueId}
      roleName={areaChairName}
      filterAssignedInvitation={true}
      referrer={referrer}
    />
  )
}

const AreaChairConsoleTabs = ({ acConsoleData, setAcConsoleData }) => {
  const [selectedNoteIds, setSelectedNoteIds] = useState([])
  const {
    venueId,
    areaChairName,
    secondaryAreaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    officialMetaReviewName,
    reviewerName = 'Reviewers',
    metaReviewRecommendationName = 'recommendation',
    additionalMetaReviewFields = [],
    shortPhrase,
    filterOperators,
    propertiesAllowed,
    enableQuerySearch,
    extraExportColumns,
    ithenticateInvitationId,
    extraRoleNames,
    sortOptions,
    displayReplyInvitations,
    customStageInvitations,
  } = useContext(WebFieldContext)
  const defaultActiveTabId = `assigned-${pluralizeString(submissionName).toLowerCase()}`
  const [activeTabId, setActiveTabId] = useState(defaultActiveTabId)

  const areaChairUrlFormat = areaChairName ? getRoleHashFragment(areaChairName) : null
  const extraRoleNamesWithUrlFormat = extraRoleNames?.map((roleName) => ({
    name: roleName,
    urlFormat: getRoleHashFragment(roleName),
  }))
  const secondaryAreaChairUrlFormat = secondaryAreaChairName
    ? getRoleHashFragment(secondaryAreaChairName)
    : null

  const renderTable = () => {
    if (!acConsoleData.tableRowsAll) return <LoadingSpinner />
    if (acConsoleData.tableRowsAll?.length === 0)
      return (
        <p className="empty-message">
          No assigned {submissionName.toLowerCase()}. Check back later or{' '}
          <Link href={`/contact`}>contact us</Link> if you believe this to be an error.
        </p>
      )
    if (acConsoleData.tableRows?.length === 0)
      return (
        <div className="table-container empty-table-container">
          <AreaChairConsoleMenuBar
            tableRowsAll={acConsoleData.tableRowsAll}
            tableRows={acConsoleData.tableRows}
            selectedNoteIds={selectedNoteIds}
            setSelectedNoteIds={setSelectedNoteIds}
            setAcConsoleData={setAcConsoleData}
            shortPhrase={shortPhrase}
            enableQuerySearch={enableQuerySearch}
            extraExportColumns={extraExportColumns}
            filterOperators={filterOperators}
            propertiesAllowed={propertiesAllowed}
            reviewRatingName={reviewRatingName}
            metaReviewRecommendationName={metaReviewRecommendationName}
            additionalMetaReviewFields={additionalMetaReviewFields}
            reviewerName={reviewerName}
            officialReviewName={officialReviewName}
            submissionName={submissionName}
            officialMetaReviewName={officialMetaReviewName}
            areaChairName={areaChairName}
            ithenticateInvitationId={ithenticateInvitationId}
            sortOptions={sortOptions}
            customStageInvitations={customStageInvitations}
          />
          <p className="empty-message">
            No assigned {submissionName.toLowerCase()} matching search criteria.
          </p>
        </div>
      )
    return (
      <div className="table-container">
        <AreaChairConsoleMenuBar
          tableRowsAll={acConsoleData.tableRowsAll}
          tableRows={acConsoleData.tableRows}
          selectedNoteIds={selectedNoteIds}
          setSelectedNoteIds={setSelectedNoteIds}
          setAcConsoleData={setAcConsoleData}
          shortPhrase={shortPhrase}
          enableQuerySearch={enableQuerySearch}
          extraExportColumns={extraExportColumns}
          filterOperators={filterOperators}
          propertiesAllowed={propertiesAllowed}
          reviewRatingName={reviewRatingName}
          metaReviewRecommendationName={metaReviewRecommendationName}
          additionalMetaReviewFields={additionalMetaReviewFields}
          reviewerName={reviewerName}
          officialReviewName={officialReviewName}
          submissionName={submissionName}
          officialMetaReviewName={officialMetaReviewName}
          areaChairName={areaChairName}
          ithenticateInvitationId={ithenticateInvitationId}
          sortOptions={sortOptions}
          customStageInvitations={customStageInvitations}
        />
        <Table
          className="console-table table-striped areachair-console-table"
          headings={[
            {
              id: 'select-all',
              content: (
                <SelectAllCheckBox
                  selectedIds={selectedNoteIds}
                  setSelectedIds={setSelectedNoteIds}
                  allIds={acConsoleData.tableRows?.map((row) => row.note.id)}
                />
              ),
              width: '35px',
            },
            { id: 'number', content: '#', width: '55px' },
            { id: 'summary', content: `${submissionName} Summary`, width: '34%' },
            {
              id: 'reviewProgress',
              content: `${prettyField(officialReviewName)} Progress`,
              width: '34%',
            },
            ...(displayReplyInvitations?.length
              ? [
                  {
                    id: 'latestReplies',
                    content: 'Latest Replies',
                    width: '50%',
                  },
                ]
              : []),
            {
              id: 'metaReviewStatus',
              content: `${prettyField(officialMetaReviewName)} Status`,
              width: 'auto',
            },
          ]}
        >
          {acConsoleData.tableRows?.map((row) => (
            <AssignedPaperRow
              key={row.note.id}
              rowData={row}
              venueId={venueId}
              areaChairName={areaChairName}
              officialReviewName={officialReviewName}
              officialMetaReviewName={officialMetaReviewName}
              submissionName={submissionName}
              metaReviewRecommendationName={metaReviewRecommendationName}
              selectedNoteIds={selectedNoteIds}
              setSelectedNoteIds={setSelectedNoteIds}
              shortPhrase={shortPhrase}
              additionalMetaReviewFields={additionalMetaReviewFields}
              activeTabId={activeTabId}
              displayReplyInvitations={displayReplyInvitations}
            />
          ))}
        </Table>
      </div>
    )
  }

  const renderTripletACTable = () => {
    if (!acConsoleData.tripletACtableRows) return <LoadingSpinner />
    if (acConsoleData.tripletACtableRows?.length === 0)
      return (
        <p className="empty-message">
          No assigned {submissionName.toLowerCase()}.Check back later or{' '}
          <Link href={`/contact`}>contact us</Link> if you believe this to be an error.
        </p>
      )
    return (
      <div className="table-container">
        <Table
          className="console-table table-striped areachair-console-table"
          headings={[
            { id: 'number', content: '#', width: '55px' },
            { id: 'summary', content: `${submissionName} Summary`, width: '34%' },
            {
              id: 'reviewProgress',
              content: `${prettyField(officialReviewName)} Progress`,
              width: '34%',
            },
            ...(displayReplyInvitations?.length
              ? [
                  {
                    id: 'latestReplies',
                    content: 'Latest Replies',
                    width: '50%',
                  },
                ]
              : []),
            {
              id: 'metaReviewStatus',
              content: `${prettyField(officialMetaReviewName)} Status`,
              width: 'auto',
            },
          ]}
        >
          {acConsoleData.tripletACtableRows?.map((row) => (
            <AssignedPaperRow
              key={row.note.id}
              rowData={row}
              venueId={venueId}
              areaChairName={areaChairName}
              officialReviewName={officialReviewName}
              officialMetaReviewName={officialMetaReviewName}
              submissionName={submissionName}
              metaReviewRecommendationName={metaReviewRecommendationName}
              shortPhrase={shortPhrase}
              showCheckbox={false}
              additionalMetaReviewFields={additionalMetaReviewFields}
              activeTabId={activeTabId}
              displayReplyInvitations={displayReplyInvitations}
            />
          ))}
        </Table>
      </div>
    )
  }

  return (
    <ConsoleTabs
      defaultActiveTabId={defaultActiveTabId}
      tabs={[
        {
          id: `assigned-${pluralizeString(submissionName ?? '').toLowerCase()}`,
          label: `Assigned ${pluralizeString(submissionName)}`,
          content: renderTable(),
          visible: true,
        },
        {
          id: `${secondaryAreaChairUrlFormat}-assignments`,
          label: `${getSingularRoleName(prettyField(secondaryAreaChairName))} Assignments`,
          content: renderTripletACTable(),
          visible: secondaryAreaChairName,
        },
        {
          id: `${areaChairUrlFormat}-tasks`,
          label: `${getSingularRoleName(prettyField(areaChairName))} Tasks`,
          content: <AreaChairConsoleTasks venueId={venueId} areaChairName={areaChairName} />,
          visible: true,
        },
        ...(extraRoleNamesWithUrlFormat?.length > 0
          ? extraRoleNamesWithUrlFormat.map((role) => ({
              id: `${role.urlFormat}-tasks`,
              label: `${getSingularRoleName(prettyField(role.name))} Tasks`,
              content: (
                <AreaChairConsoleTasks
                  venueId={venueId}
                  areaChairName={role.name}
                  defaultAreaChairName={areaChairName}
                />
              ),
              visible: true,
            }))
          : []),
      ]}
      updateActiveTabId={setActiveTabId}
    />
  )
}

// #region config docs
/** Area Chair Console config doc
 *
 * @typedef {Object} AreaChairConsoleConfig
 *
 // eslint-disable-next-line max-len
 * @property {Object} header mandatory but can be empty object
 * @property {string} venueId mandatory
 * @property {Object} reviewerAssignment optional
 * @property {string} submissionInvitationId mandatory
 * @property {string} seniorAreaChairsId optional
 * @property {string} areaChairName mandatory
 * @property {string} secondaryAreaChairName optional
 * @property {string} submissionName mandatory
 * @property {string} officialReviewName mandatory
 * @property {string|string[]|object[]} reviewRatingName mandatory
 * @property {string} reviewConfidenceName optional
 * @property {string} officialMetaReviewName mandatory
 * @property {string} reviewerName mandatory
 * @property {string} anonReviewerName mandatory
 * @property {string} metaReviewRecommendationName optional
 * @property {string[]} additionalMetaReviewFields optional
 * @property {string} shortPhrase mandatory
 * @property {string[]} filterOperators optional
 * @property {Object[]} propertiesAllowed optional
 * @property {boolean} enableQuerySearch optional
 * @property {string} emailReplyTo optional
 * @property {Object[]} extraExportColumns optional
 * @property {string} preferredEmailInvitationId optional
 * @property {string} ithenticateInvitationId optional
 * @property {string[]} extraRoleNames optional
 * @property {Object[]} sortOptions optional
 * @property {Object[]} displayReplyInvitations optional
 * @property {Object[]} customStageInvitations optional
 */

/**
 * @name AreaChairConsoleConfig.header
 * @description Page header. Contains two string fields: "title" and "instructions" (markdown supported)
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
 * @name AreaChairConsoleConfig.venueId
 * @description Used to construct banner content, referrer link and various group/invitation ids. The value is usually domain.id
 * @type {string}
 * @default no default value
 * @example
 * { "venueId": "ICLR.cc/202X/Conference" }
 */

/**
 * @name AreaChairConsoleConfig.reviewerAssignment
 * @description An object which can contain the following fields:
 * - showEdgeBrowserUrl (boolean): a flag to control whether to show link to edge browser to edit reviewer assignments
 * - proposedAssignmentTitle (string): the title of the proposed assignment config note. if provided, edgeBrowserProposedUrl will be used as the link to the edge browser, otherwise edgeBrowserDeployedUrl will be used
 * - edgeBrowserProposedUrl (string): the url to edge browser to edit (proposed) assignments. shown in instructions when showEdgeBrowserUrl is true and proposedAssignmentTitle is provided
 * - edgeBrowserDeployedUrl (string): the url to edge browser to edit deployed assignments. shown in instructions when showEdgeBrowserUrl is true and proposedAssignmentTitle is not provided
 * @type {Object}
 * @default no default value
 * @example
 * {
 *   "reviewerAssignment": {
 *     "showEdgeBrowserUrl": true,
 *     "proposedAssignmentTitle": "Min0-Max3"
 *     "edgeBrowserProposedUrl": "/edges/browse?start=ICLR.cc/202X/Conference/Area_Chairs/-/Assignment,tail:~Test_User1&traverse=ICLR.cc/202X/Conference/Reviewers/-/Proposed_Assignment,label:undefined&edit=ICLR.cc/202X/Conference/Reviewers/-/Proposed_Assignment,label:undefined;ICLR.cc/202X/Conference/Reviewers/-/Invite_Assignment&browse=ICLR.cc/202X/Conference/Reviewers/-/Aggregate_Score,label:undefined;ICLR.cc/202X/Conference/Reviewers/-/Affinity_Score;ICLR.cc/202X/Conference/Reviewers/-/Bid&maxColumns=2&version=2"
 *     "edgeBrowserDeployedUrl": "/edges/browse?start=ICLR.cc/202X/Conference/Area_Chairs/-/Assignment,tail:~Test_User1&traverse=ICLR.cc/202X/Conference/Reviewers/-/Assignment&edit=ICLR.cc/202X/Conference/Reviewers/-/Invite_Assignment&browse=ICLR.cc/202X/Conference/Reviewers/-/Affinity_Score;ICLR.cc/202X/Conference/Reviewers/-/Bid;ICLR.cc/202X/Conference/Reviewers/-/Custom_Max_Papers,head:ignore&maxColumns=2&version=2"
 *   }
 * }
 */

/**
 * @name AreaChairConsoleConfig.submissionInvitationId
 * @description Used as the invitation to query notes to be displayed in console
 * @type {string}
 * @default no default value
 * @example
 * { "submissionInvitationId": "ICLR.cc/202X/Conference/-/Submission" }
 */

/**
 * @name AreaChairConsoleConfig.seniorAreaChairsId
 * @description The SAC group id. Used to construct SAC-AC assignment invitation id to query SAC assignment edges and to construct the SAC display text
 * @type {string}
 * @default no default value
 * @example
 * { "seniorAreaChairsId": "ICLR.cc/202X/Conference/Senior_Area_Chairs" }
 */

/**
 * @name AreaChairConsoleConfig.areaChairName
 * @description The name of ACs group used in group id. Used to identify ACs group anonymous AC group
 * @type {string}
 * @default no default value
 * @example
 * { "areaChairName": "Area_Chairs" }
 */

/**
 * @name AreaChairConsoleConfig.secondaryAreaChairName
 * @description The name of Secondary ACs group used in group id. Used to identify Secondary ACs group to determine the submission to show in AC triplet(Secondary AC) tab
 * @type {string}
 * @default no default value
 * @example
 * { "secondaryAreaChairName": "Secondary_Area_Chairs" }
 */

/**
 * @name AreaChairConsoleConfig.submissionName
 * @description Name of submission, used to construct group id, query param, error message etc
 * @type {string}
 * @default no default value
 * @example
 * { "submissionName": "Submission" }
 */

/**
 * @name AreaChairConsoleConfig.officialReviewName
 * @description Name of official reviews, used in label text and to construct official review invitation id
 * @type {string}
 * @default no default value
 * @example
 * { "officialReviewName": "Official_Review" }
 */

/**
 * @name ReviewerConsoleConfig.reviewRatingName
 * @description Used to get rating value from official review, support string, string array for displaying multiple rating fields and object array which allows custom rating name and fallback values
 * @type {string|string[]|object[]}
 * @default no default value
 * @example <caption>string shows single rating</caption>
 * { "reviewRatingName": "rating" }
 * @example <caption>string array shows multiple ratings</caption>
 * { "reviewRatingName": ["soundness","excitement","reproducibility"] }
 * @example <caption>object array/mixed shows multiple ratings with fallback options the following config would show 2 ratings: "overall_rating" and "overall_recommendation" for "overall_rating", it's value will be final_rating field, when final_rating field is not available, it will take the next available value defined in the array, in this example it will take "preliminary_rating"</caption>
 * {
 *  "reviewRatingName": [
 *    {
 *      "overall_rating": [
 *        "final_rating",
 *        "preliminary_rating"
 *      ]
 *    },
 *    "overall_recommendation",
 *  ]
 * }
 */

/**
 * @name AreaChairConsoleConfig.reviewConfidenceName
 * @description Name of confidence field in official review.
 * @type {string}
 * @default no default value
 * @example
 * { "reviewConfidenceName": "confidence_level" }
 */

/**
 * @name AreaChairConsoleConfig.officialMetaReviewName
 * @description Name of meta review. Used in label text and to construct meta review invitation id.
 * @type {string}
 * @default no default value
 * @example
 * { "officialMetaReviewName": "Meta_Review" }
 */

/**
 * @name AreaChairConsoleConfig.reviewerName
 * @description Used to construct label text and for filtering reviewers group
 * @type {string}
 * @default 'Reviewers'
 * @example
 * { "reviewerName": "Reviewers" }
 */

/**
 * @name AreaChairConsoleConfig.anonReviewerName
 * @description Used to filter anonymous reviewer groups
 * @type {string}
 * @default 'Reviewer_'
 * @example
 * { "anonReviewerName": "Reviewer_" }
 */

/**
 * @name AreaChairConsoleConfig.metaReviewRecommendationName
 * @description Name of recommendation field in meta review
 * @type {string}
 * @default 'recommendation'
 * @example
 * { "metaReviewRecommendationName": "recommendation" }
 */

/**
 * @name AreaChairConsoleConfig.additionalMetaReviewFields
 * @description Additional fields to display from meta review
 * @type {string[]}
 * @default []
 * @example
 * { "additionalMetaReviewFields": ["final_recommendation"] }
 */

/**
 * @name AreaChairConsoleConfig.shortPhrase
 * @description Used in text when messaging reviewers
 * @type {string}
 * @default no default value
 * @example
 * { "shortPhrase": "ABCD 20XX" }
 */

/**
 * @name AreaChairConsoleConfig.filterOperators
 * @description The query search operator allowed
 * @type {string[]}
 * @default no default value set in AC Console, default to ['!=', '>=', '<=', '>', '<', '==', '='] in menu bar
 * @example
 * { "filterOperators": [">","<"] }
 */

/**
 * @name AreaChairConsoleConfig.propertiesAllowed
 * @description Properties allowed in query search apart from default properties defined in menu bar
 * @type {object[]}
 * @default no default value
 * @example
 * {
 *  "propertiesAllowed": [
 *    {
 *      track:['note.content.track.value']
 *    }
 *  ]
 * }
 */

/**
 * @name AreaChairConsoleConfig.enableQuerySearch
 * @description Controls whether to enable query search in menu bar, if not set or set to false, only basic search is available (filterOperators and propertiesAllowed will be ignored)
 * @type {boolean}
 * @default no default value, equivalent to false
 * @example
 * {
 *  "enableQuerySearch": true
 * }
 */

/**
 * @name AreaChairConsoleConfig.emailReplyTo
 * @description replyto of the emails sent from console
 * @type {string}
 * @default no default value
 * @example
 * {
 *  "emailReplyTo": "conference@contact.email"
 * }
 */

/**
 * @name AreaChairConsoleConfig.extraExportColumns
 * @description Extra data in the CSV export. Each object contains a header prop (header in exported csv) and a getValue string which is a function that takes row data as param and read the value required in export
 * @type {object[]}
 * @default no default value
 * @example
 * {
 *  "extraExportColumns": [
 *    {
 *      track:['note.content.track.value'],
 *      getValue: `
 *         return row.reviewers?.
 *          map((reviewer) => {
 *            const review = row.officialReviews?.find(
 *              (review) => review.anonymousId === reviewer.anonymousId
 *            );
 *            return \`\${reviewer.preferredName}:rating-\${review?.rating??'N/A'}|confidence-\${review?.confidence??'N/A'}|first time reviewer-\${review?.content?.first_time_reviewer?.value ?? 'N/A'}\`;
 *          })
 *          .join(',')
 *      `
 *    }
 *  ]
 * }
 */

/**
 * @name AreaChairConsoleConfig.preferredEmailInvitationId
 * @description Invitation id to get preferred email edges to show SAC contact
 * @type {string}
 * @default no default value
 * @example
 * {
 *  "preferredEmailInvitationId": "conference/202XX/Conference/-/Preferred_Emails"
 * }
 */

/**
 * @name AreaChairConsoleConfig.ithenticateInvitationId
 * @description Invitation id to get iThenticate edges to show in paper summary
 * @type {string}
 * @default no default value
 * @example
 * {
 *  "ithenticateInvitationId": 'conference/20XX/Conference/-/iThenticate_Plagiarism_Check'
 * }
 */

/**
 * @name AreaChairConsoleConfig.extraRoleNames
 * @description The role names of the AC to display a task tab for, task of each role apart from the AC role will be displayed in a separate tab
 * @type {string[]}
 * @default no default value
 * @example <caption>Two Task tabs will be displayed: Area Chair Tasks and Secondary Area Chair Tasks</caption>
 * {
 *  "extraRoleNames": ["Secondary_Area_Chairs"]
 * }
 */

/**
 * @name AreaChairConsoleConfig.sortOptions
 * @description Custom sort options to be added apart from the default sort options in menu bar sorting dropdown, each object contains: label: the value to be shown in dropdown options, value: a value used as id of the dropdown options, getValue: a string function to calculate the order. getValue function has row data as input param
 * @type {object[]}
 * @default no default value
 * @example <caption>Following config add "Confidence Spread" in sorting dropdown</caption>
 * {
 *  "sortOptions": [
 *    {
 *      label:'Confidence Spread',
 *      value:'confidence spread',
 *      getValue:"return row.reviewProgressData?.confidenceMax - row.reviewProgressData?.confidenceMin"
 *    }
 *  ]
 * }
 */

/**
 * @name AreaChairConsoleConfig.displayReplyInvitations
 * @description The invitation id and field of the forum reply to be shown in a "Latest Replies" column. Each object has 2 fields: id: the invitation id to get reply, {number} in the id is replaced with the actual paper number. fields: an array of string specifying the reply field to show
 * @type {object[]}
 * @default no default value
 * @example
 * {
 *  "displayReplyInvitations": [
 *    {
 *      id: "abcd.org/20XX/Conference/Submission{number}/-/Official_Review",
 *      fields: ["summary", "limitations"],
 *    },
 *    {
 *      id: "abcd.org/20XX/Conference/Submission{number}/-/Public_Comment",
 *      fields: ["strengths", "suitability"],
 *    }
 *  ]
 * }
 */

/**
 * @name AreaChairConsoleConfig.customStageInvitations
 * @description config the custom stage replies to be shown under meta review status column. Each object can have 3 fields: name: construct the invitation id to fiter note replies, displayField: the field name to read from the custom stage note, extraDisplayFields: an string array with more fields to show from the custom stage note. Compared to the customStageInvitations config in PC/SAC console, it does not have role or repliesPerSubmission
 * @type {object[]}
 * @default no default value
 * @example
 * {
 *  "customStageInvitations": [
 *    {
 *      name:"Meta_Review_Confirmation",
 *      displayField: "decision",
 *      extraDisplayFields: ["meta_review_agreement"],
 *    }
 *  ]
 * }
 */

// #endregion

const AreaChairConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    reviewerAssignment,
    submissionInvitationId,
    seniorAreaChairsId,
    areaChairName,
    secondaryAreaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    reviewConfidenceName,
    officialMetaReviewName,
    reviewerName = 'Reviewers',
    anonReviewerName = 'Reviewer_',
    metaReviewRecommendationName = 'recommendation',
    additionalMetaReviewFields = [],
    shortPhrase,
    filterOperators,
    propertiesAllowed,
    enableQuerySearch,
    emailReplyTo,
    extraExportColumns,
    preferredEmailInvitationId,
    ithenticateInvitationId,
    extraRoleNames,
    sortOptions,
    displayReplyInvitations,
    customStageInvitations,
  } = useContext(WebFieldContext)
  const {
    showEdgeBrowserUrl,
    proposedAssignmentTitle,
    edgeBrowserProposedUrl,
    edgeBrowserDeployedUrl,
  } = reviewerAssignment ?? {}
  const { user, accessToken, isRefreshing } = useUser()
  const query = useSearchParams()
  const { setBannerContent } = appContext ?? {}
  const [acConsoleData, setAcConsoleData] = useState({})
  const [sacLinkText, setSacLinkText] = useState('')

  const edgeBrowserUrl = proposedAssignmentTitle
    ? edgeBrowserProposedUrl
    : edgeBrowserDeployedUrl
  const headerInstructions = showEdgeBrowserUrl
    ? `${header?.instructions}<p><strong>${getSingularRoleName(
        prettyField(reviewerName)
      )} Assignment Browser: </strong><a id="edge_browser_url" href="${edgeBrowserUrl}" target="_blank" rel="nofollow">Modify ${getSingularRoleName(
        prettyField(reviewerName)
      )} Assignments</a></p>`
    : header?.instructions

  const getReviewerName = (reviewerProfile) => {
    const name =
      reviewerProfile.content.names.find((t) => t.preferred) ||
      reviewerProfile.content.names[0]
    return name ? name.fullname : prettyId(reviewerProfile.id)
  }

  const getSACLinkText = async () => {
    if (!acConsoleData.sacProfiles?.length) return
    const sacName = prettyField(seniorAreaChairsId?.split('/')?.pop())
    const singluarSACName = sacName.endsWith('s') ? sacName.slice(0, -1) : sacName
    const sacText = `Your assigned ${inflect(
      acConsoleData.sacProfiles.length,
      `${singluarSACName} is`,
      `${singluarSACName}s are`
    )}`

    let sacEmails = []
    if (preferredEmailInvitationId) {
      try {
        const sacEmailPs = acConsoleData.sacProfiles.map((sacProfile) =>
          api
            .get(
              '/edges',
              { invitation: preferredEmailInvitationId, head: sacProfile.id },
              { accessToken }
            )
            .then((result) => result.edges[0]?.tail)
        )
        sacEmails = await Promise.all(sacEmailPs)
      } catch (error) {
        /* empty */
      }
    }
    const sacProfileLinks = acConsoleData.sacProfiles.map(
      (sacProfile, index) =>
        `<a href="${getProfileLink(sacProfile.id)}" >${prettyId(sacProfile.id)}</a>${
          sacEmails[index] ? `(${sacEmails[index]})` : ''
        }`
    )
    setSacLinkText(
      `<p class="dark">${sacText} ${prettyList(
        sacProfileLinks,
        'long',
        'conjunction',
        false
      )}</p>`
    )
  }

  const loadData = async () => {
    try {
      const allGroups = await api.getAll(
        '/groups',
        {
          member: user.id,
          prefix: `${venueId}/${submissionName}.*`,
          select: 'id',
          stream: true,
          domain: group.domain,
        },
        { accessToken }
      )
      const areaChairGroups = allGroups.filter((p) => p.id.endsWith(`/${areaChairName}`))
      const secondaryAreaChairGroups = secondaryAreaChairName
        ? allGroups.filter((p) => p.id.endsWith(`/${secondaryAreaChairName}`))
        : []

      const singularName = areaChairName.endsWith('s')
        ? areaChairName.slice(0, -1)
        : areaChairName
      const anonymousAreaChairGroups = allGroups.filter((p) =>
        p.id.includes(`/${singularName}_`)
      )
      const anonymousAreaChairIdByNumber = {}
      const areaChairPaperNums = areaChairGroups.flatMap((p) => {
        const num = getNumberFromGroup(p.id, submissionName)
        const anonymousAreaChairGroup = anonymousAreaChairGroups.find((q) =>
          q.id.startsWith(`${venueId}/${submissionName}${num}/${singularName}_`)
        )
        if (anonymousAreaChairGroup) {
          anonymousAreaChairIdByNumber[num] = anonymousAreaChairGroup.id
          return num
        }
        return []
      })
      const secondaryAreaChairPaperNums = secondaryAreaChairGroups.map((p) =>
        getNumberFromGroup(p.id, submissionName)
      )

      const noteNumbers = [
        ...new Set(areaChairPaperNums),
        ...new Set(secondaryAreaChairPaperNums),
      ]
      const blindedNotesP = noteNumbers.length
        ? api.getAll(
            '/notes',
            {
              invitation: submissionInvitationId,
              number: noteNumbers.join(','),
              select: 'id,number,forum,content,details',
              details: 'replies',
              sort: 'number:asc',
              domain: group.domain,
            },
            { accessToken }
          )
        : Promise.resolve([])

      // #region getReviewerGroups(noteNumbers)
      const reviewerGroupsP = chunk([...new Set(areaChairPaperNums)], 25)
        .reduce(
          (prev, curr) =>
            prev.then((acc) =>
              Promise.all(
                curr.map((paperNumber) =>
                  api.get(
                    '/groups',
                    {
                      parent: `${venueId}/${submissionName}${paperNumber}`,
                      select: 'id,members',
                      domain: group.domain,
                    },
                    { accessToken }
                  )
                )
              ).then((res) => acc.concat(res))
            ),
          Promise.resolve([])
        )
        .then((result) => {
          const reviewerGroupsResult = result.flatMap((p) => p.groups)
          const anonymousReviewerGroups = reviewerGroupsResult.filter((p) =>
            p.id.includes(`/${anonReviewerName}`)
          )
          const reviewerGroups = reviewerGroupsResult.filter((p) =>
            p.id.includes(`/${reviewerName}`)
          )
          return noteNumbers.map((p) => {
            const reviewers = reviewerGroups
              .find((q) => getNumberFromGroup(q.id, submissionName) === p)
              ?.members.flatMap((r) => {
                const anonymousReviewerGroup = anonymousReviewerGroups.find(
                  (t) =>
                    t.id.startsWith(`${venueId}/${submissionName}${p}/${anonReviewerName}`) &&
                    (t.id === r || t.members[0] === r)
                )
                return {
                  anonymizedGroup: anonymousReviewerGroup?.id ?? r,
                  anonymousId: getIndentifierFromGroup(
                    anonymousReviewerGroup?.id || r,
                    anonReviewerName
                  ),
                  reviewerProfileId: anonymousReviewerGroup?.members.length
                    ? anonymousReviewerGroup.members[0]
                    : r,
                }
              })
            return {
              number: p,
              reviewers,
            }
          })
        })

      // #endregion

      // #region assigned SAC
      const assignedSACsP = seniorAreaChairsId
        ? api
            .get(
              '/edges',
              {
                invitation: `${seniorAreaChairsId}/-/Assignment`,
                head: user.profile.id,
                domain: group.domain,
              },
              { accessToken }
            )
            .then((result) => result?.edges?.map((edge) => edge.tail) ?? [])
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
      const result = await Promise.all([
        blindedNotesP,
        reviewerGroupsP,
        assignedSACsP,
        ithenticateEdgesP,
      ])

      // #region get assigned reviewer , sac and all reviewer group members profiles
      const allIds = [
        ...new Set([
          ...result[1].flatMap((p) => p.reviewers ?? []).map((p) => p.reviewerProfileId),
          ...result[2],
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
      const ithenticateEdges = result[3]
      const allProfiles = (profileResults[0].profiles ?? [])
        .concat(profileResults[1].profiles ?? [])
        .map((profile) => ({
          ...profile,
          title: formatProfileContent(profile.content).title,
        }))
      const customStageInvitationIds = customStageInvitations
        ? customStageInvitations.map((p) => `/-/${p.name}`)
        : []
      const tableRows = notes.map((note) => {
        const assignedReviewers =
          result[1].find((p) => p.number === note.number)?.reviewers ?? []
        const assignedReviewerProfiles = assignedReviewers.map((reviewer) =>
          allProfiles.find(
            (p) =>
              p.content.names.some((q) => q.username === reviewer.reviewerProfileId) ||
              p.email === reviewer.reviewerProfileId
          )
        )
        const officialReviews = note.details.replies
          .filter((p) => {
            const officalReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialReviewName}`
            return p.invitations.includes(officalReviewInvitationId)
          })
          ?.map((q) => {
            const anonymousId = getIndentifierFromGroup(q.signatures[0], anonReviewerName)
            const reviewValue = q.content?.review?.value
            return {
              ...q,
              anonymousId,
              confidence: parseNumberField(q.content?.[reviewConfidenceName]?.value),
              ...Object.fromEntries(
                (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
                  (ratingName) => {
                    const ratingDisplayName =
                      typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
                    const ratingValue =
                      typeof ratingName === 'object'
                        ? Object.values(ratingName)[0]
                            .map((r) => q.content?.[r]?.value)
                            .find((s) => s !== undefined)
                        : q.content?.[ratingName]?.value
                    return [[ratingDisplayName], parseNumberField(ratingValue)]
                  }
                )
              ),
              reviewLength: reviewValue?.length,
            }
          })

        const ratings = Object.fromEntries(
          (Array.isArray(reviewRatingName) ? reviewRatingName : [reviewRatingName]).map(
            (ratingName) => {
              const displayRatingName =
                typeof ratingName === 'object' ? Object.keys(ratingName)[0] : ratingName
              const ratingValues = officialReviews.map((p) => p[displayRatingName])
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
              return [displayRatingName, { ratingAvg, ratingMin, ratingMax }]
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

        const metaReviewInvitationId = `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`
        const allMetaReviews = note.details.replies.flatMap((p) => {
          if (!p.invitations.includes(metaReviewInvitationId)) return []
          return {
            ...p,
            anonId: getIndentifierFromGroup(p.signatures[0], `${singularName}_`),
            isByOtherAC: p.signatures[0] !== anonymousAreaChairIdByNumber[note.number],
          }
        })
        const metaReview = allMetaReviews.find((p) => !p.isByOtherAC)

        const customStageReviews = customStageInvitations?.reduce((prev, curr) => {
          const customStageReview = note.details.replies.find((p) =>
            p.invitations.some((q) => customStageInvitationIds.some((r) => q.includes(r)))
          )
          if (!customStageReview) return prev
          const customStageValue = customStageReview?.content?.[curr.displayField]?.value
          const customStageExtraDisplayFields = curr.extraDisplayFields ?? []
          return {
            ...prev,
            [camelCase(curr.name)]: {
              searchValue: customStageValue,
              name: prettyId(curr.name),
              value: customStageValue,
              displayField: prettyField(curr.displayField),
              extraDisplayFields: customStageExtraDisplayFields.map((field) => ({
                field: prettyField(field),
                value: customStageReview?.content?.[field]?.value,
              })),
              ...customStageReview,
            },
          }
        }, {})
        return {
          note,
          reviewers: result[1]
            .find((p) => p.number === note.number)
            ?.reviewers?.map((reviewer) => {
              const profile = allProfiles.find(
                (p) =>
                  p.content.names.some((q) => q.username === reviewer.reviewerProfileId) ||
                  p.email === reviewer.reviewerProfileId
              )
              return {
                ...reviewer,
                type: 'profile',
                profile,
                hasReview: officialReviews.some((p) => p.anonymousId === reviewer.anonymousId),
                noteNumber: note.number,
                preferredId: reviewer.reviewerProfileId,
                preferredName: profile ? getReviewerName(profile) : reviewer.reviewerProfileId,
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
            replyCount: note.details.replies.length,
          },
          metaReviewData: {
            [metaReviewRecommendationName]:
              metaReview?.content?.[metaReviewRecommendationName]?.value ?? 'N/A',
            ...additionalMetaReviewFields.reduce((prev, curr) => {
              const additionalMetaReviewFieldValue =
                metaReview?.content?.[curr]?.value ?? 'N/A'
              return { ...prev, [curr]: additionalMetaReviewFieldValue }
            }, {}),
            metaReviewInvitationId: `${venueId}/${submissionName}${note.number}/-/${officialMetaReviewName}`,
            metaReview,
            metaReviewByOtherACs: allMetaReviews.flatMap((p) => {
              if (p.isByOtherAC)
                return {
                  [metaReviewRecommendationName]:
                    p.content?.[metaReviewRecommendationName]?.value ?? 'N/A',
                  ...additionalMetaReviewFields.reduce((prev, curr) => {
                    const additionalMetaReviewFieldValue = p.content?.[curr]?.value ?? 'N/A'
                    return { ...prev, [curr]: additionalMetaReviewFieldValue }
                  }, {}),
                  anonId: p.anonId,
                  id: p.id,
                }
              return []
            }),
            customStageReviews,
          },
          messageSignature: anonymousAreaChairIdByNumber[note.number],
          ...(ithenticateInvitationId && {
            ithenticateEdge: ithenticateEdges.find((p) => p.head === note.id),
            ithenticateWeight:
              ithenticateEdges.find((p) => p.head === note.id)?.weight ?? 'N/A',
          }),
          displayReplies: displayReplyInvitations?.map((p) => {
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
          }),
        }
      })

      const sacProfiles = allProfiles.filter(
        (p) =>
          p.content.names.some((q) => result[2].includes(q.username)) ||
          result[2].includes(p.email)
      )

      const assignedPaperRows = tableRows.filter((p) =>
        areaChairPaperNums.includes(p.note.number)
      )
      const tripletACPaperRows = tableRows.filter((p) =>
        secondaryAreaChairPaperNums.includes(p.note.number)
      )

      // #endregion
      setAcConsoleData({
        tableRowsAll: assignedPaperRows,
        tableRows: assignedPaperRows,
        tripletACtableRows: tripletACPaperRows,
        reviewersInfo: result[1],
        allProfiles,
        sacProfiles: sacProfiles.map((sacProfile) => ({
          id: sacProfile.id,
        })),
      })
    } catch (error) {
      promptError(`loading data: ${error.message}`)
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
    if (
      isRefreshing ||
      !user ||
      !group ||
      !venueId ||
      !submissionName ||
      !officialReviewName ||
      !submissionInvitationId
    )
      return
    loadData()
  }, [user, isRefreshing, group])

  useEffect(() => {
    if (acConsoleData.notes) {
      typesetMathJax()
    }
  }, [acConsoleData.notes])

  useEffect(() => {
    getSACLinkText()
  }, [acConsoleData.sacProfiles])

  const missingConfig = Object.entries({
    header,
    group,
    venueId,
    reviewerAssignment,
    submissionInvitationId,
    areaChairName,
    submissionName,
    officialReviewName,
    reviewRatingName,
    reviewConfidenceName,
    officialMetaReviewName,
    shortPhrase,
    enableQuerySearch,
    reviewerName,
    anonReviewerName,
  })
    .filter(([key, value]) => value === undefined)
    .map((p) => p[0])
  if (missingConfig.length > 0) {
    const errorMessage = `${
      areaChairName ? `${prettyField(areaChairName)} ` : ''
    }Console is missing required properties: ${missingConfig.join(', ')}`
    return <ErrorDisplay statusCode="" message={errorMessage} withLayout={false} />
  }

  return (
    <>
      <BasicHeader
        title={header?.title}
        instructions={`${headerInstructions}${sacLinkText}`}
      />
      <AreaChairConsoleTabs
        acConsoleData={acConsoleData}
        setAcConsoleData={setAcConsoleData}
      />
    </>
  )
}

export default AreaChairConsole
