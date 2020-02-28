import Head from 'next/head'
import Link from 'next/link'
import withError from '../components/withError'
import api from '../lib/api-client'
import { prettyId } from '../lib/utils'

// Page Styles
import '../styles/pages/venues.less'

const VenueItem = ({ id, name }) => (
  <h3>
    <Link href={`/submissions?id=${id}`}>
      <a title="View submissions for this venue">
        {name}
      </a>
    </Link>
  </h3>
)

const Venues = ({ venues }) => (
  <>
    <Head>
      <title key="title">Venue Directory | OpenReview</title>
    </Head>

    <header className="clearfix">
      <h1>All Venues</h1>
      <hr />
    </header>

    <div className="groups">
      <ul className="list-unstyled venues-list">
        {venues.map(group => (
          <li key={group.id}>
            <VenueItem id={group.id} name={group.name} />
          </li>
        ))}
      </ul>
    </div>
  </>
)

Venues.getInitialProps = async () => {
  const apiRes = await api.get('/groups', { id: 'host' })
  const group = apiRes.groups && apiRes.groups[0]
  if (!group) {
    return {
      statusCode: 400,
      message: 'Venues list unavailable. Please try again later',
    }
  }

  const venues = group.members
    .map(id => ({ id, name: prettyId(id) }))
    .sort((groupA, groupB) => {
      const nameA = groupA.name.toLowerCase()
      const nameB = groupB.name.toLowerCase()
      if (nameA < nameB) {
        return -1
      }
      if (nameA > nameB) {
        return 1
      }
      return 0
    })

  return { venues }
}

Venues.bodyClass = 'venues'

export default withError(Venues)
