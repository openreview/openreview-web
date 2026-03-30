'use client'

import ProfileTag from '../../components/ProfileTag'

export default function ServiceRoles({ serviceRoles }) {
  return (
    <div
      className={`tags-container service-roles-container ${serviceRoles.length ? 'mb-2' : ''}`}
    >
      {serviceRoles.map((tag, index) => (
        <ProfileTag key={index} tag={tag} showProfileId={false} />
      ))}
    </div>
  )
}
