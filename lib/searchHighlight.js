const wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' })

export const tokenizeTerm = (term) => {
  if (!term) return []
  return Array.from(wordSegmenter.segment(term))
    .filter((s) => s.isWordLike)
    .map((s) => s.segment)
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Highlights matched tokens with a soft amber background — the browser
// ⌘F / Google convention. Uses <mark> (the semantic element for
// search-relevance highlights) with normal weight so the page doesn't
// fight brand red, which is reserved for status/active/brand cues.
const HIGHLIGHT_STYLE = {
  background: '#fde58c',
  color: 'inherit',
  padding: '0 2px',
  borderRadius: 2,
  fontWeight: 'inherit',
}

export const highlightMatch = (text, term) => {
  if (!term || !text) return text
  const tokens = tokenizeTerm(term)
  if (!tokens.length) return text
  const pattern = tokens.map(escapeRegex).join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')
  const segments = String(text).split(regex)
  return (
    <>
      {segments.map((segment, index) =>
        index % 2 === 1 ? (
          <mark key={index} style={HIGHLIGHT_STYLE}>
            {segment}
          </mark>
        ) : (
          segment
        )
      )}
    </>
  )
}

export const truncateAroundMatch = (label, term) => {
  const maxCharLength = 120
  if (!label || label.length <= maxCharLength) return label
  const tokens = tokenizeTerm(term)
  if (!tokens.length) return label.slice(0, maxCharLength) + '…'
  const pattern = tokens.map(escapeRegex).join('|')
  const regex = new RegExp(pattern, 'i')
  const m = label.match(regex)
  if (!m) return label.slice(0, maxCharLength) + '…'
  const matchLen = m[0].length
  const budget = maxCharLength - matchLen
  const half = Math.floor(budget / 2)
  let start = m.index - half
  let end = m.index + matchLen + half
  if (start < 0) {
    end -= start
    start = 0
  }
  if (end > label.length) {
    start = Math.max(0, start - (end - label.length))
    end = label.length
  }
  const prefix = start > 0 ? '…' : ''
  const suffix = end < label.length ? '…' : ''
  return `${prefix}${label.slice(start, end)}${suffix}`
}

// Walks the venue's searchable fields and returns the first one whose value
// contains the term (or any of its tokens). Mirrors the homepage dropdown's
// fallback so the /search Venues tab can surface off-title matches.
const VENUE_FIELDS = [
  { key: 'domain', label: 'Domain', getValue: (v) => v.domain },
  { key: 'title', label: 'Title', getValue: (v) => v.content?.title?.value },
  { key: 'subtitle', label: 'Subtitle', getValue: (v) => v.content?.subtitle?.value },
  { key: 'location', label: 'Location', getValue: (v) => v.content?.location?.value },
  { key: 'website', label: 'Website', getValue: (v) => v.content?.website?.value },
]

export const findVenueFieldMatch = (venue, term) => {
  if (!term) return null
  const lowerTerm = term.toLowerCase()
  const fullMatch = VENUE_FIELDS.find((f) => {
    const v = f.getValue(venue)
    return v && v.toLowerCase().includes(lowerTerm)
  })
  if (fullMatch) return { field: fullMatch.label, fieldValue: fullMatch.getValue(venue) }
  const tokens = tokenizeTerm(term).map((t) => t.toLowerCase())
  if (!tokens.length) return null
  const tokenMatch = VENUE_FIELDS.find((f) => {
    const v = f.getValue(venue)
    if (!v) return false
    const lower = v.toLowerCase()
    return tokens.some((t) => lower.includes(t))
  })
  return tokenMatch
    ? { field: tokenMatch.label, fieldValue: tokenMatch.getValue(venue) }
    : null
}
