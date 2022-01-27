import { useEffect, useState } from 'react'

const Tabs = ({
  defaultActiveTabIndex = 0,
  className,
  tabNames,
  tabContents,
  resetTabIndex,
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState(defaultActiveTabIndex)

  useEffect(() => {
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
            <a
              href={`#${tabName}`}
              aria-controls={tabName}
              role="tab"
              onClick={() => setActiveTabIndex(index)}
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
