'use client'

const wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' })

export const tokenizeTerm = (term) => {
  if (!term) return []
  return Array.from(wordSegmenter.segment(term))
    .filter((s) => s.isWordLike)
    .map((s) => s.segment)
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Highlights matched tokens in the brand red (`$orRed`, #8c1b13).
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
          <strong key={index} style={{ color: '#8c1b13' }}>
            {segment}
          </strong>
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
