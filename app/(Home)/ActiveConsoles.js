//#region client version
// 'use client'

// import { useEffect, useState } from 'react'
// import { useSelector } from 'react-redux'
// import api from '../../lib/api-client'
// import VenueList from './VenueList'

// export default function ActiveConsoles({ activeVenues, openVenues }) {
//   const { user, token } = useSelector((state) => state.root)
//   const [venues, setVenues] = useState(null)
//   const activeAndOpenVenues = activeVenues.concat(openVenues)

//   const getActiveConsoles = async () => {
//     const result = await api
//       .get('/groups', { member: user.id, web: true, select: 'id' }, { accessToken: token })
//       .then((apiRes) => apiRes.groups)
//     setVenues(
//       result.flatMap((venue) => {
//         if (!activeAndOpenVenues.find((p) => venue.id.startsWith(p.groupId))) return []
//         return { groupId: venue.id }
//       })
//     )
//   }

//   useEffect(() => {
//     if (!user) return
//     getActiveConsoles()
//   }, [user])

//   if (!user || !venues?.length) return null
//   return (
//     <section>
//       <h1>Your Active Consoles</h1>
//       <hr className="small" />
//       <VenueList name="active consoles" venues={venues} />
//     </section>
//   )
// }
//#endregion

import api from '../../lib/api-client'
import VenueList from './VenueList'
import serverAuth from '../auth'

export const dynamic = 'force-dynamic'

export default async function ActiveConsoles({ activeVenues, openVenues }) {
  const { user, token } = await serverAuth()
  const activeAndOpenVenues = activeVenues.concat(openVenues)

  if (!user) return null

  let venues = null
  try {
    const result = await api.get(
      '/groups',
      { member: user.id, web: true, select: 'id' },
      { accessToken: token }
    )
    venues = result.groups.flatMap((venue) => {
      if (!activeAndOpenVenues.find((p) => venue.id.startsWith(p.groupId))) return []
      return { groupId: venue.id }
    })
  } catch (error) {
    console.log('Error in ActiveConsoles', {
      page: 'Home',
      component: 'ActiveConsoles',
      user: user?.id,
      apiError: error,
      apiRequest: {
        endpoint: '/groups',
        params: { member: user?.id, web: true, select: 'id' },
      },
    })
  }

  if (!venues?.length) return null

  return (
    <section>
      <h1>Your Active Consoles</h1>
      <hr className="small" />
      <VenueList name="active consoles" venues={venues} />
    </section>
  )
}
