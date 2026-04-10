'use client'

import { Flex } from 'antd'
import ProfileTag from '../../components/ProfileTag'

export default function ServiceRoles({ serviceRoles }) {
  return (
    <Flex vertical gap={0} align="flex-start">
      {serviceRoles.map((tag, index) => (
        <ProfileTag key={index} tag={tag} showProfileId={false} borderless />
      ))}
    </Flex>
  )
}
