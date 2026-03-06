/* eslint-disable max-len */
/* globals promptError: false */

import { useContext, useEffect, useState } from 'react'
import WebFieldContext from '../WebFieldContext'
import useUser from '../../hooks/useUser'
import Table from '../Table'
import api from '../../lib/api-client'
import LoadingSpinner from '../LoadingSpinner'
import ErrorDisplay from '../ErrorDisplay'
import BasicHeader from './BasicHeader'
import { prettyId, prettyInvitationId } from '../../lib/utils'
import PaginationLinks from '../PaginationLinks'
import ProfileLink from './ProfileLink'

const pageSize = 10

// eslint-disable-next-line arrow-body-style
const TagRow = ({ tag, membershipIds, domain }) => {
  return (
    <tr>
      <td>
        <ProfileLink id={tag.profileId} />
      </td>
      <td>{tag.label}</td>
      <td>
        {/* eslint-disable-next-line no-nested-ternary */}
        {membershipIds ? (
          membershipIds?.length ? (
            <>
              {membershipIds.map((id, index) => (
                <div key={index}>
                  <a href={`/group?id=${id}`} target="_blank" rel="noopener noreferrer">
                    {id}
                  </a>
                </div>
              ))}
            </>
          ) : (
            <span>No member for {prettyId(domain)}</span>
          )
        ) : (
          <span>loading...</span>
        )}
      </td>
    </tr>
  )
}

const TagsPage = ({ tagsOfPage, domain }) => {
  const [profileIdMembershipMap, setProfileIdMembershipMap] = useState(new Map())

  const loadGroupMembers = async (profileIds) => {
    try {
      const groupMemberCallsP = profileIds.map((profileId) =>
        api
          .get('/groups', { member: profileId, select: 'id,domain', domain })
          .then((result) => {
            const memberGroups = result.groups || []
            const memberGroupsOfDomain = memberGroups.filter((p) => p.domain === domain)
            return memberGroupsOfDomain
          })
      )
      const groupMembersResults = await Promise.all(groupMemberCallsP)
      const profileIdToGroupMap = new Map()
      profileIds.forEach((profileId, index) => {
        profileIdToGroupMap.set(
          profileId,
          groupMembersResults[index].map((p) => p.id)
        )
      })
      setProfileIdMembershipMap(profileIdToGroupMap)
    } catch (error) {
      promptError(error.message)
    }
  }
  useEffect(() => {
    const profileIds = tagsOfPage.map((tag) => tag.profileId)
    loadGroupMembers(profileIds)
  }, [tagsOfPage])
  return (
    <>
      {tagsOfPage.map((tag) => (
        <TagRow
          key={tag.profileId}
          tag={tag}
          membershipIds={profileIdMembershipMap.get(tag.profileId)}
          domain={domain}
        />
      ))}
    </>
  )
}

// #region config docs
/** TagsViewer config doc
 *
 * @typedef {Object} TagsViewerConfig
 *
 * @property {string} tagInvitation optional
 * @property {string} title optional
 * @property {string} instructions optional
 * @property {string} domain optional
 */

/**
 * @name TagsViewerConfig.tagInvitation
 * @description The invitation id to get tags. By default it shows the blocked profiles.
 * @type {string}
 * @default `${process.env.SUPER_USER}/Support/-/Profile_Blocked_Status`
 */

/**
 * @name TagsViewerConfig.title
 * @description title of the component/page.
 * @type {string}
 * @default `Tags For ${prettyInvitationId(tagInvitation)}`
 * @example "some title overwrite"
 */

/**
 * @name TagsViewerConfig.instructions
 * @description Markdown string rendered under the header title.
 * @type {string}
 * @default no default value
 * @example "some **instructions**"
 */

/**
 * @name TagsViewerConfig.domain
 * @description This is used to filter the group membership of tagged profile. By default it is group.domain so that member of the venue is shown. If the component is used in a group webfield outside the venue, this property should be set to the venue domain.
 * @type {string}
 * @default domain of the group
 */
// #endregion

const TagsViewer = () => {
  const {
    entity: group,
    tagInvitation = `${process.env.SUPER_USER}/Support/-/Profile_Blocked_Status`,
    title = `Tags For ${prettyInvitationId(tagInvitation)}`,
    instructions,
    domain = group.domain,
  } = useContext(WebFieldContext)
  const { user, isRefreshing } = useUser()
  const [allTags, setAllTags] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const tagsToDisplay = allTags?.length
    ? allTags.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : []
  const count = allTags?.length

  const loadTags = async () => {
    try {
      const tagsResult = await api.get('/tags', { invitation: tagInvitation })
      const rawTags = tagsResult.tags || []
      let tagsMap = []
      rawTags.forEach((tag) => {
        const { profile: profileId, label, cdate } = tag
        if (tagsMap.find((t) => t.profileId === profileId)) {
          // this one is a unblock, so remove from map
          tagsMap = tagsMap.filter((t) => t.profileId !== profileId)
        } else {
          tagsMap.push({ profileId, label, cdate })
        }
      })
      setAllTags(tagsMap)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!user || isRefreshing) return
    loadTags()
  }, [user, isRefreshing])

  if (!allTags) return <LoadingSpinner />
  if (!allTags.length) return <ErrorDisplay message="No tags found" withLayout={false} />
  return (
    <>
      <BasicHeader title={title} instructions={instructions} />
      <Table
        className="console-table table-striped"
        headings={[
          { id: 'profileId', content: 'Profile ID', width: '20%' },
          {
            id: 'label',
            content: 'Label',
            width: '20%',
          },
          {
            id: 'memberships',
            content: 'Memberships',
            width: 'auto',
          },
        ]}
      >
        <TagsPage tagsOfPage={tagsToDisplay} domain={domain} />
      </Table>
      <PaginationLinks
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={pageSize}
        totalCount={count}
      />
    </>
  )
}

export default TagsViewer
