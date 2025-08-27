'use client'

import { useState } from 'react'

export default function ExpandableList({
  items,
  maxItems,
  expandLabel,
  collapseLabel,
  children,
}) {
  const [expanded, setExpanded] = useState(false)

  const list = expanded ? items : items.slice(0, maxItems)
  const listWithCommas = list.reduce(
    (accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]),
    null
  )

  return (
    <span>
      {listWithCommas}{' '}
      {items.length > maxItems && (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a
          href="#"
          title={expanded ? 'Collapse list' : 'Expand list'}
          role="button"
          className="show-all"
          onClick={(e) => {
            e.preventDefault()
            setExpanded((exp) => !exp)
          }}
        >
          {expanded ? collapseLabel : expandLabel}
        </a>
      )}{' '}
      {children}
    </span>
  )
}
