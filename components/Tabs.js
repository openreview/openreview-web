import { useEffect, useState } from 'react'

const Tabs = ({
  defaultActiveTabIndex = 0,
  className,
  tabNames,
  tabContents,
  tabEvents,
  resetTabIndex,
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState(defaultActiveTabIndex)

  useEffect(() => {
    if (!resetTabIndex) return
    // eslint-disable-next-line no-param-reassign
    resetTabIndex.current = () => setActiveTabIndex(defaultActiveTabIndex)
  }, [])

  return (
    <div className={className} role="tablist">
      <ul className="nav nav-tabs">
        {tabNames.map((tabName, index) => (
          <li
            role="presentation"
            key={index}
            className={index === activeTabIndex ? 'active' : ''}
          >
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
              data-target={`#${tabName}`}
              aria-controls={tabName}
              role="tab"
              onClick={() => {
                setActiveTabIndex(index)
                if (tabEvents?.[index]) {
                  tabEvents[index]()
                }
              }}
            >
              {tabName}
            </a>
          </li>
        ))}
      </ul>
      <div className="tab-content">
        {tabNames.map((tabName, index) => (
          <div
            key={index}
            role="tabpanel"
            className={`tab-pane ${index === activeTabIndex ? 'active' : ''}`}
            id={tabName}
          >
            {tabContents[index]}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Tabs
