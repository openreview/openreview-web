'use client'

import { useState } from 'react'
import ProfileTag from '../../components/ProfileTag'

export default function ServiceRoles({ serviceRoles }) {
  const [tagsToShow, setTagsToShow] = useState(5)
  const visibleServiceRoles = serviceRoles.slice(0, tagsToShow)

  return (
    <div className={`tags-container ${visibleServiceRoles.length ? 'mb-2' : ''}`}>
      {visibleServiceRoles.map((tag, index) => (
        <ProfileTag key={index} tag={tag} showProfileId={false} />
      ))}
      {serviceRoles.length > 0 && tagsToShow < serviceRoles.length && (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setTagsToShow(serviceRoles.length)
          }}
          role="button"
          className="mt-2"
        >
          View all {serviceRoles.length} Service Roles
        </a>
      )}
    </div>
  )
}
