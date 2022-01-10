import React from 'react'
import Link from 'next/link'
import { prettyId, urlFromGroupId } from '../../lib/utils'

const commonGroups = ['everyone', '(anonymous)', '(guest)', '~', '~Super_User1']

const GroupIdList = ({ groupIds }) => {
  if (!Array.isArray(groupIds)) return null

  return groupIds.map((groupId, index) => (
    // eslint-disable-next-line react/no-array-index-key
    <span key={index}>
      {commonGroups.includes(groupId) ? prettyId(groupId) : (
        <Link href={urlFromGroupId(groupId)}>
          <a>{prettyId(groupId)}</a>
        </Link>
      )}
    </span>
  )).reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)
}

export default GroupIdList
