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

export function Tab({ id, headingCount, icon, onClick, active, hidden, disabled, children }) {
  const tabEl = useRef(null)

  useEffect(() => {
    if (tabEl.current && active) {
      tabEl.current.click()
    }
  }, [tabEl, active])

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault()
      return false
    }

    if (typeof onClick === 'function') {
      onClick(e)
    }
    return true
  }

  if (hidden) return null

  return (
    <li role="presentation" className={disabled ? 'disabled' : null}>
      <a href={`#${id}`} role="tab" data-toggle="tab" ref={tabEl} onClick={handleClick}>
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
