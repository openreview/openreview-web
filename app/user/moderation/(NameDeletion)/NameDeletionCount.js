import { useEffect, useState } from 'react'
import Badge from '../../../../components/Badge'
import api from '../../../../lib/api-client'

export default function NameDeletionCount({ children }) {
  const [nameDeletionRequestCount, setNameDeletionRequestCount] = useState(null)

  const getNameDeletionCount = async () => {
    try {
      const response = await api.get('/notes', {
        invitation: `${process.env.SUPER_USER}/Support/-/Profile_Name_Removal`,
      })
      setNameDeletionRequestCount(
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
    <Badge count={nameDeletionRequestCount} size="small" offset={[0, -5]}>
      {children}
    </Badge>
  )
}
