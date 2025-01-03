import { useEffect, useState } from 'react'
import api from '../../../../lib/api-client'

export default function NameDeletionCount({ accessToken }) {
  const [nameDeletionRequestCount, setNameDeletionRequestCount] = useState(null)

  const getNameDeletionCount = async () => {
    try {
      const response = await api.get(
        '/notes',
        {
          invitation: `${process.env.SUPER_USER}/Support/-/Profile_Name_Removal`,
        },
        { accessToken }
      )
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

  if (!nameDeletionRequestCount) return null
  return <span className="badge">{nameDeletionRequestCount}</span>
}
