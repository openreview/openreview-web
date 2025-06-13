'use client'

/* globals $: false */
import { nanoid } from 'nanoid'
import { useRef, useState } from 'react'

const Collapse = ({ showLabel, hideLabel, onExpand, className, indent, children }) => {
  const [collapsed, setCollapsed] = useState(true)
  const collapseRef = useRef(null)
  const id = nanoid(6)

  return (
    <div className={`collapse-widget ${className ?? ''}`}>
      <a
        data-toggle="collapse"
        href={`#${id}`}
        aria-expanded="false"
        aria-controls="collapseExample"
        onClick={(e) => {
          e.preventDefault()
          if ($(collapseRef.current).hasClass('collapsing')) return
          $(collapseRef.current).collapse(collapsed ? 'show' : 'hide')
          if (collapsed && onExpand) onExpand()
          setCollapsed((p) => !p)
        }}
      >
        {collapsed ? showLabel : hideLabel}
      </a>
      {!collapsed && (
        <div
          ref={collapseRef}
          className={`collapse${indent ? ' collapse-indent' : ''}`}
          id={id}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export default Collapse
