// Simulates the geo headers the production load balancer stamps on requests
// (x-client-region / x-client-region-subdivision / x-client-city). The API only
// records sign-in locations (knownLocations + unusual-login warnings) when all
// three are present, and local dev has no load balancer to add them. Each call
// picks a random city so repeated logins rotate between already-known and new
// locations, exercising both the "known location" and "unusual location" paths.
// Outside `next dev` this returns {} and no headers are sent.

const LOCATIONS = [
  { region: 'US', subdivision: 'US-MA', city: 'Cambridge' },
  { region: 'US', subdivision: 'US-CA', city: 'San Francisco' },
  { region: 'GB', subdivision: 'GB-ENG', city: 'London' },
  { region: 'DE', subdivision: 'DE-BE', city: 'Berlin' },
  { region: 'JP', subdivision: 'JP-13', city: 'Tokyo' },
  { region: 'AU', subdivision: 'AU-NSW', city: 'Sydney' },
]

export default function devLoginLocationHeaders() {
  if (process.env.NODE_ENV !== 'development') return {}

  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]
  // oxlint-disable-next-line no-console
  console.info(`[dev] simulating sign-in from ${location.city} (${location.subdivision})`)
  return {
    'x-client-region': location.region,
    'x-client-region-subdivision': location.subdivision,
    'x-client-city': location.city,
  }
}
