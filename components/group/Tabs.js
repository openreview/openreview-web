export function Tabs({ children, className }) {
  return (
    <div className="tabs-container">
      {children}
    </div>
  )
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

export function Tab({ id, headingCount, active, children }) {
  return (
    <li role="presentation" className={active ? 'active' : null}>
      <a href={`#${id}`} aria-controls={id} role="tab" data-toggle="tab" data-modify-history="true">
        {children}
        {' '}
        {headingCount && (
          <span className="badge">{headingCount}</span>
        )}
      </a>
    </li>
  )
}

export function TabPanels({ children }) {
  return (
    <div className="tab-content">
      {children}
    </div>
  )
}

export function TabPanel({ id, active, className, children }) {
  return (
    <div
      id={id}
      className={`tab-pane fade ${className}} ${active ? 'active' : ''}`}
      role="tabpanel"
    >
      {children}
    </div>
  )
}
