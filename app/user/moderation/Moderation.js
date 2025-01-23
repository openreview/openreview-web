'use client'

import { useEffect, useState } from 'react'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../../../components/Tabs'
import NameDeletionCount from './(NameDeletion)/NameDeletionCount'
import ProfileMergeCount from './(ProfileMerge)/ProfileMergeCount'
import VenueRequestCount from './(VenueRequests)/VenueRequestCount'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function Moderation({ children, accessToken }) {
  const [activeTabId, setActiveTabId] = useState('#profiles')
  const [isClientRendering, setIsClientRendering] = useState(false)

  useEffect(() => {
    setIsClientRendering(true)
  }, [])

  if (!isClientRendering)
    return (
      <Tabs>
        <TabList>
          <Tab id="profiles" active={true}>
            User Moderation
          </Tab>
          <Tab id="email">Email Delete Requests</Tab>
          <Tab id="name">Name Delete Requests</Tab>
          <Tab id="merge">Profile Merge Requests</Tab>
          <Tab id="institution">Institution List</Tab>
          <Tab id="requests">Venue Requests</Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="profiles">
            <LoadingSpinner />
          </TabPanel>
        </TabPanels>
      </Tabs>
    )

  return (
    <Tabs>
      <TabList>
        <Tab id="profiles" active={true}>
          User Moderation
        </Tab>
        <Tab id="email" onClick={() => setActiveTabId('#email')}>
          Email Delete Requests
        </Tab>
        <Tab id="name" onClick={() => setActiveTabId('#name')}>
          Name Delete Requests <NameDeletionCount accessToken={accessToken} />
        </Tab>
        <Tab id="merge" onClick={() => setActiveTabId('#merge')}>
          Profile Merge Requests <ProfileMergeCount accessToken={accessToken} />
        </Tab>
        <Tab id="institution" onClick={() => setActiveTabId('#institution')}>
          Institution List
        </Tab>
        <Tab id="requests" onClick={() => setActiveTabId('#requests')}>
          Venue Requests <VenueRequestCount accessToken={accessToken} />
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel id="profiles">{children.profiles}</TabPanel>
        <TabPanel id="email">{activeTabId === '#email' && children.email}</TabPanel>
        <TabPanel id="name">{activeTabId === '#name' && children.name}</TabPanel>
        <TabPanel id="merge">{activeTabId === '#merge' && children.merge}</TabPanel>
        <TabPanel id="institution">
          {activeTabId === '#institution' && children.institution}
        </TabPanel>
        <TabPanel id="requests">{activeTabId === '#requests' && children.requests}</TabPanel>
      </TabPanels>
    </Tabs>
  )
}
