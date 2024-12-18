import VenueList from './VenueList'

export const revalidate = 600

export default async function ActiveVenues({ venues }) {
  return (
    <section>
      <h1>Active Venues</h1>
      <hr className="small" />
      <VenueList name="active venues" venues={venues} />
    </section>
  )
}
