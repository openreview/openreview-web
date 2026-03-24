import { useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import WebFieldContext from '../WebFieldContext'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import LoadingSpinner from '../LoadingSpinner'
import ErrorDisplay from '../ErrorDisplay'
import BasicHeader from './BasicHeader'
import { prettyId, prettyInvitationId } from '../../lib/utils'
import ProfileLink from './ProfileLink'
import { Col, Flex, Pagination, Row, Space, Tooltip } from 'antd'
import dayjs from 'dayjs'

const ellipsisStyle = {
  display: 'inline-block',
  maxWidth: '100%',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  verticalAlign: 'bottom',
}

const MembershipsList = ({ membershipIds, domain }) => {
  const maxVisibleMembers = 3
  const [expanded, setExpanded] = useState(false)

  if (membershipIds.length === 0) {
    return <span>No member{domain ? ` for ${prettyId(domain)}` : ''}</span>
  }

  const visibleIds = expanded ? membershipIds : membershipIds.slice(0, maxVisibleMembers)
  const hiddenCount = membershipIds.length - maxVisibleMembers

  return (
    <Space vertical size={0}>
      {visibleIds.map((id) => (
        <div key={id}>
          <a href={`/group?id=${id}`} target="_blank" rel="noopener noreferrer">
            {prettyId(id)}
          </a>
        </div>
      ))}
      {!expanded && hiddenCount > 0 && (
        <a onClick={() => setExpanded(true)} style={{ cursor: 'pointer' }}>
          View all ({hiddenCount} more)
        </a>
      )}
    </Space>
  )
}

const TagRow = ({ tag, membershipIds, domain }) => {
  const { profileId, label, weight, cdate, signature } = tag
  return (
    <Row style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
      <Col xs={24} md={3}>
        <Tooltip title={profileId}>
          <span style={ellipsisStyle}>
            <ProfileLink id={profileId} />
          </span>
        </Tooltip>
      </Col>
      <Col xs={24} md={3}>
        <Tooltip title={label}>
          <span style={ellipsisStyle}>{label}</span>
        </Tooltip>
      </Col>
      <Col xs={24} md={2}>
        {weight}
      </Col>
      <Col xs={24} md={3}>
        {dayjs(cdate).format('YY-MM-DD HH:mm')}
      </Col>
      <Col xs={24} md={4}>
        <Tooltip title={signature}>
          <span style={ellipsisStyle}>
            {signature.startsWith('~') ? (
              <ProfileLink id={signature} />
            ) : (
              <a href={`/group?id=${signature}`} target="_blank" rel="noopener noreferrer">
                {signature}
              </a>
            )}
          </span>
        </Tooltip>
      </Col>
      <Col xs={24} md={9} style={{ minWidth: 0 }}>
        <MembershipsList membershipIds={membershipIds} domain={domain} />
      </Col>
    </Row>
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
    <Flex vertical gap="small" style={{ marginBottom: '1.5rem', minHeight: '600px' }}>
      {tagsOfPage.map((tag) => (
        <TagRow
          key={tag.profileId}
          tag={tag}
          membershipIds={profileIdMembershipMap.get(tag.profileId) ?? []}
          domain={domain}
        />
      ))}
    </Flex>
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
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const tagsToDisplay = allTags?.length
    ? allTags.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
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
          tagsMap.push({
            profileId,
            label,
            weight,
            cdate,
            signature,
          })
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
      <Flex vertical>
        <Row style={{ fontWeight: 'bold', marginBottom: 8, width: '100%' }} gutter={15}>
          <Col xs={0} md={3}>
            Profile ID
          </Col>
          <Col xs={0} md={3}>
            Label
          </Col>
          <Col xs={0} md={2}>
            Weight
          </Col>
          <Col xs={0} md={3}>
            Date
          </Col>
          <Col xs={0} md={4}>
            Signature
          </Col>
          <Col xs={0} md={9}>
            Memberships
          </Col>
        </Row>
        <TagsPage tagsOfPage={tagsToDisplay} domain={domain} />
        <Pagination
          align="center"
          current={pageNumber}
          pageSize={pageSize}
          total={count}
          onChange={(page, size) => {
            if (size !== pageSize) {
              setPageSize(size)
              setPageNumber(1)
            } else {
              setPageNumber(page)
            }
          }}
          hideOnSinglePage
          showSizeChanger
          pageSizeOptions={[15, 25, 50, 100]}
        />
      </Flex>
    </>
  )
}

export default ProfileTagsViewer
