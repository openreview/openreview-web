import { useEffect, useState } from 'react'
import { Badge } from 'antd'
import api from '../../../../lib/api-client'

export default function NewVenueRequestCount({ children }) {
  const [pendingVenueRequestCount, setPendingVenueRequestCount] = useState(null)

  const getPendingVenueRequestCount = async () => {
    try {
      const undeployedVenueRequests = await api
        .getCombined(
          '/notes',
          {
            invitation: `${process.env.SUPER_USER}/Support/-/Request_Form`,
            select: 'content.venue_id',
          },
          {
            invitation: `${process.env.SUPER_USER}/Support/Venue_Request.*`,
            select: `parentInvitations,content.venue_id`,
          },
          { includeVersion: true }
        )
        .then((response) =>
          response?.notes?.filter((p) => {
            if (p.parentInvitations) return false
            if (p.apiVersion === 2 ? p.content?.venue_id?.value : p.content?.venue_id)
              return false
            return true
          })
        )

      setPendingVenueRequestCount(undeployedVenueRequests?.length)
    } catch (error) {
      /* empty */
    }
  }

  useEffect(() => {
    getPendingVenueRequestCount()
  }, [])

  return (
    <Badge count={pendingVenueRequestCount} size="small" offset={[0, -5]}>
      {children}
    </Badge>
  )
}
