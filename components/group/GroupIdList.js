import React from 'react'
import Link from 'next/link'
import { prettyId, urlFromGroupId } from '../../lib/utils'

const commonGroups = ['everyone', '(anonymous)', '(guest)', '~', '~Super_User1']

const GroupIdList = ({ groupIds }) => {
  if (!Array.isArray(groupIds)) return null

  return groupIds
    .map((groupId, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <span key={index}>
        {commonGroups.includes(groupId) ? (
          prettyId(groupId)
        ) : (
          <Link href={urlFromGroupId(groupId)}>
            {prettyId(groupId)}
          </Link>
        )}
      </span>
    ))
    .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null);
}

export const InvitationIdList = ({ invitationIds }) => {
  if (!Array.isArray(invitationIds)) return null

  return invitationIds
    .map((invitationId, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <span key={index}>
        <Link href={`/invitation/edit?id=${invitationId}`}>
          {prettyId(invitationId)}
        </Link>
      </span>
    ))
    .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null);
}

export default GroupIdList
