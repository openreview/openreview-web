import { useEffect, useState } from 'react'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'

const ConsoleTabs = ({ defaultActiveTabId, tabs = [], updateActiveTabId }) => {
  const validTabIds = tabs.flatMap((tab) => (tab.visible ? tab.id : []))
  const [activeTabId, setActiveTabId] = useState(
    decodeURIComponent(window.location.hash.substring(1)) ||
      defaultActiveTabId ||
      validTabIds[0]
  )

  useEffect(() => {
    if (!validTabIds.includes(activeTabId)) {
      setActiveTabId(defaultActiveTabId)
      return
    }
    updateActiveTabId?.(`#${activeTabId}`)
    if (window.location.hash !== `#${activeTabId}`) {
      window.history.replaceState(null, '', `#${activeTabId}`)
    }
  }, [activeTabId])

  return (
    <Tabs>
      <TabList>
        {tabs.map((tab) => {
          const { id, label, visible } = tab
          if (!visible) return null
          return (
            <Tab
              key={`${id}-tab`}
              id={id}
              active={activeTabId === id ? true : undefined}
              onClick={() => setActiveTabId(id)}
            >
              {label}
            </Tab>
          )
        })}
      </TabList>
      <TabPanels>
        {tabs.map((tab) => {
          const { id, content, visible, alwaysMount } = tab
          if ((!visible || activeTabId !== `${id}`) && !alwaysMount) return null
          return (
            <TabPanel key={`${id}-panel`} id={id}>
              {content}
            </TabPanel>
          )
        })}
      </TabPanels>
    </Tabs>
  )
}

export default ConsoleTabs
