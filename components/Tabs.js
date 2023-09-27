import { useEffect, useRef } from 'react'
import Icon from './Icon'

export function Tabs({ children, className }) {
  return <div className={`tabs-container ${className || ''}`}>{children}</div>
}

export function TabList({ children }) {
  return (
    <div className="mobile-full-width">
      <ul className="nav nav-tabs" role="tablist">
        {children}
      </ul>
    </div>
  )
}

export function Tab({ id, headingCount, icon, onClick, active, hidden, children }) {
  const tabEl = useRef(null)

  useEffect(() => {
    if (tabEl.current && active) {
      setTimeout(() => {
        tabEl.current.click()
      }, 100)
    }
  }, [tabEl, active])

  const handleClick = (e) => {
    if (typeof onClick === 'function') {
      onClick(e)
    }
  }

  if (hidden) return null

  return (
    <li role="presentation" onClick={handleClick}>
      <a
        href={`#${id}`}
        aria-controls={id}
        role="tab"
        data-toggle="tab"
        data-modify-history="true"
        ref={tabEl}
      >
        {children}
        {Number.isInteger(headingCount) && <span className="badge">{headingCount}</span>}
        {icon && <Icon name={icon} />}
      </a>
    </li>
  )
}

export function TabPanels({ children }) {
  return <div className="tab-content">{children}</div>
}

export function TabPanel({ id, className, children }) {
  return (
    <div id={id} className={`tab-pane fade ${className || ''}`} role="tabpanel">
      {children}
    </div>
  )
}
