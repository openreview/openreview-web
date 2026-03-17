/* eslint-disable max-len */
/* globals promptError: false */

import { useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import WebFieldContext from '../WebFieldContext'
import useUser from '../../hooks/useUser'
import Table from '../Table'
import api from '../../lib/api-client'
import LoadingSpinner from '../LoadingSpinner'
import ErrorDisplay from '../ErrorDisplay'
import BasicHeader from './BasicHeader'
import { prettyId, prettyInvitationId, formatDateTime } from '../../lib/utils'
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
      <td>{tag.weight}</td>
      <td>{formatDateTime(tag.cdate)}</td>
      <td>
        {tag.signature && (
          <a
            href={
              tag.signature.startsWith('~')
                ? `/profile?id=${tag.signature}`
                : `/group?id=${tag.signature}`
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {tag.signature}
          </a>
        )}
      </td>
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
            <span>No member{domain ? ` for ${prettyId(domain)}` : ''}</span>
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
          .get('/groups', {
            member: profileId,
            select: 'id,domain',
            ...(domain && { domain }),
          })
          .then((result) => {
            const memberGroups = result.groups || []
            const filtered = memberGroups.filter((p) => p.domain !== process.env.SUPER_USER)
            return domain ? filtered.filter((p) => p.domain === domain) : filtered
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
/** ProfileTagsViewer config doc
 *
 * @typedef {Object} ProfileTagsViewerConfig
 *
 * @property {string} tagInvitation optional
 * @property {string} title optional
 * @property {string} instructions optional
 * @property {string} parentInvitations optional comma-separated list (URL param)
 */

/**
 * @name ProfileTagsViewerConfig.tagInvitation
 * @description The invitation id to get tags.
 * @type {string}
 */

/**
 * @name ProfileTagsViewerConfig.title
 * @description title of the component/page.
 * @type {string}
 * @default `Tags For ${prettyInvitationId(tagInvitation)}`
 * @example "some title overwrite"
 */

/**
 * @name ProfileTagsViewerConfig.instructions
 * @description Markdown string rendered under the header title.
 * @type {string}
 * @default no default value
 * @example "some **instructions**"
 */

// #endregion

const ProfileTagsViewer = () => {
  const {
    tagInvitation = `${process.env.SUPER_USER}/Support/-/Profile_Blocked_Status`,
    title = `Tags For ${prettyInvitationId(tagInvitation)}`,
    instructions,
  } = useContext(WebFieldContext)
  const query = useSearchParams()
  const domain = query.get('domain')
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
      const rawTags = (tagsResult.tags || []).filter(
        (tag) => !domain || tag.readers?.includes(domain)
      )
      let tagsMap = []
      rawTags.forEach((tag) => {
        const { profile: profileId, label, weight, cdate, signature } = tag
        if (tagsMap.find((t) => t.profileId === profileId)) {
          // this one is a unblock, so remove from map
          tagsMap = tagsMap.filter((t) => t.profileId !== profileId)
        } else {
          tagsMap.push({ profileId, label, weight, cdate, signature })
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
          { id: 'profileId', content: 'Profile ID', width: '15%' },
          { id: 'label', content: 'Label', width: '15%' },
          { id: 'weight', content: 'Weight', width: '10%' },
          { id: 'cdate', content: 'Date', width: '15%' },
          { id: 'signature', content: 'Signature', width: '15%' },
          { id: 'memberships', content: 'Memberships', width: '30%' },
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

export default ProfileTagsViewer
