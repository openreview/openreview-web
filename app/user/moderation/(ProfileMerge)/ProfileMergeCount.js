import { useEffect, useState } from 'react'
import { Badge } from 'antd'
import api from '../../../../lib/api-client'

export default function ProfileMergeCount({ children }) {
  const [profileMergeRequestCount, setProfileMergeRequestCount] = useState(null)

  const getNameDeletionCount = async () => {
    try {
      const response = await api.get('/notes', {
        invitation: `${process.env.SUPER_USER}/Support/-/Profile_Merge`,
      })
      setProfileMergeRequestCount(
        response.notes.filter((p) => p.content.status.value === 'Pending').length
      )
    } catch (error) {
      /* empty */
    }
  }

  useEffect(() => {
    getNameDeletionCount()
  }, [])

  return (
    <Badge count={profileMergeRequestCount} size="small" offset={[0, -5]}>
      {children}
    </Badge>
  )
}
