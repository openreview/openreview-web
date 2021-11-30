import React from 'react'
import Link from 'next/link'
import { prettyId, urlFromGroupId } from '../../lib/utils'

const GroupIdList = ({ groupIds }) => {
  const commonGroups = ['everyone', '(anonymous)', '(guest)', '~', '~Super_User1']
  if (!Array.isArray(groupIds)) return ''
  return (
    <div className="info-container__content">
      {groupIds.map((groupId, index) => {
        if (commonGroups.includes(groupId)) {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <React.Fragment key={index}>
              {index > 0 && ', '}
              {prettyId(groupId)}
            </React.Fragment>
          )
        }
        return (
          // eslint-disable-next-line react/no-array-index-key
          <React.Fragment key={index}>
            {index > 0 && ', '}
            <Link href={urlFromGroupId(groupId)}><a>{prettyId(groupId)}</a></Link>
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default GroupIdList
