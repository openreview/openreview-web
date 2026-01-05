import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

import { Activity } from 'react'

import { Tabs as AntdTabs } from 'antd'
import styles from '../styles//components/Tabs.module.scss'

// export function Tabs({ children, className }) {
//   return <div className={`tabs-container ${className || ''}`}>{children}</div>
// }

// export function TabList({ children }) {
//   return (
//     <div className="mobile-full-width">
//       <ul className="nav nav-tabs" role="tablist">
//         {children}
//       </ul>
//     </div>
//   )
// }

// export function Tab({ id, headingCount, icon, onClick, active, hidden, disabled, children }) {
//   const tabEl = useRef(null)

//   useEffect(() => {
//     if (tabEl.current && active) {
//       tabEl.current.click()
//     }
//   }, [tabEl, active])

//   const handleClick = (e) => {
//     if (disabled) {
//       e.preventDefault()
//       return false
//     }

//     if (typeof onClick === 'function') {
//       onClick(e)
//     }
//     return true
//   }

//   if (hidden) return null

//   return (
//     <li role="presentation" className={disabled ? 'disabled' : null}>
//       <a href={`#${id}`} role="tab" data-toggle="tab" ref={tabEl} onClick={handleClick}>
//         {children}
//         {Number.isInteger(headingCount) && <span className="badge">{headingCount}</span>}
//         {icon && <Icon name={icon} />}
//       </a>
//     </li>
//   )
// }

// export function TabPanels({ children }) {
//   return <div className="tab-content">{children}</div>
// }

// export function TabPanel({ id, className, children }) {
//   return (
//     <div id={id} className={`tab-pane fade ${className || ''}`} role="tabpanel">
//       {children}
//     </div>
//   )
// }

/*--------------------------------------------------------------*/

export const OrTabs = ({ items, defaultActiveKey }) => {
  const [activeKey, setActiveKey] = useState(defaultActiveKey || items[0]?.key)

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsNavContainer}>
        {items.map((item) => {
          const { key } = item
          const isActive = key === activeKey
          return (
            <button
              key={key}
              role="tab"
              className={`${styles.tabsNavButton} ${isActive ? styles.activeTabsNavButton : ''}`}
              onClick={() => setActiveKey(key)}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <div className={styles.tabsContentContainer}>
        {items.map((item) => {
          const { key, children } = item
          const isActive = key === activeKey

          return (
            <div key={key} role="tabpanel">
              <Activity mode={isActive ? 'visible' : 'hidden'}>{children}</Activity>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/*--------------------------------------------------------------*/
const Tabs = ({ items }) => {
  const activityItems = items.map((item) => ({
    ...item,
    children: <Activity mode="visible">{item.children}</Activity>,
  }))
  return (
    <AntdTabs
      type="card"
      styles={{
        item: { fontWeight: '600' },
      }}
      items={activityItems}
    />
  )
}

export default Tabs
