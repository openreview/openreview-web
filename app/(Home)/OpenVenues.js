import api from '../../lib/api-client'
import VenueList from './VenueList'

export const revalidate = 600

export default async function OpenVenues({ venues }) {
  return (
    <section id="open-venues">
      <h1>Open for Submissions</h1>
      <hr className="small" />
      <VenueList name="open venues" venues={venues} maxVisible={9} />
    </section>
  )
}
