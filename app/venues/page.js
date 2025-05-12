import Link from 'next/link'
import { headers } from 'next/headers'
import ErrorDisplay from '../../components/ErrorDisplay'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import styles from './Venues.module.scss'
import CommonLayout from '../CommonLayout'

export const metadata = {
  title: 'Venue Directory | OpenReview',
}

const VenueItem = ({ id, name }) => (
  <h3>
    <Link href={`/venue?id=${id}`} title={`View venues of ${name}`}>
      {name}
    </Link>
  </h3>
)

const getGroups = async () => {
  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  const { groups } = await api.get('/groups', { id: 'host' }, { remoteIpAddress })
  const group = groups?.length > 0 ? groups[0] : null
  if (!group) {
    throw new Error('Venues list unavailable. Please try again later')
  }

  const venues = group.members
    .map((id) => ({ id, name: prettyId(id) }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return venues
}

export default async function page() {
  let venues = []
  try {
    venues = await getGroups()
  } catch (error) {
    return <ErrorDisplay message={error.message} />
  }

  return (
    <CommonLayout>
      <div className={styles.venues}>
        <header className="clearfix">
          <h1>All Venues</h1>
          <hr />
        </header>
        <div className="groups">
          <ul className="list-unstyled venues-list">
            {venues.map((group) => (
              <li key={group.id}>
                <VenueItem id={group.id} name={group.name} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </CommonLayout>
  )
}
