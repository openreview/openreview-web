import { orderBy } from 'lodash'

const independentResearcherDomain = 'independent-researcher.org'

const formatInstitution = (institution) => {
  if (institution?.name && institution?.domain)
    return `${institution.name} (${institution.domain})`
  return institution?.name ?? institution?.domain
}

const formatYears = ({ start, end }) => (start ? `${start} – ${end ?? 'Present'}` : end)

export const formatVouchPosition = (entry) =>
  [entry.position, formatInstitution(entry.institution), formatYears(entry)]
    .filter(Boolean)
    .join(', ')

export function getVouchDetails(profile) {
  const names = profile?.content?.names ?? []
  const name = names.find((p) => p.preferred) ?? names[0]
  const history = profile?.content?.history ?? []
  const currentYear = new Date().getFullYear()
  const positions = history.filter((p) => !p.end || p.end >= currentYear)
  if (positions.every((p) => p.institution?.domain === independentResearcherDomain)) {
    const [previous] = orderBy(
      history.filter((p) => p.institution?.domain !== independentResearcherDomain),
      [(p) => p.end ?? 0, (p) => p.start ?? 0],
      ['desc', 'desc']
    )
    if (previous) positions.push(previous)
  }
  return { fullname: name?.fullname, homepage: profile?.content?.homepage, positions }
}
