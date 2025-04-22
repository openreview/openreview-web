'use client'

import { useEffect, useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../../../components/Tabs'
import NameDeletionCount from './(NameDeletion)/NameDeletionCount'
import ProfileMergeCount from './(ProfileMerge)/ProfileMergeCount'
import VenueRequestCount from './(VenueRequests)/VenueRequestCount'
import LoadingSpinner from '../../../components/LoadingSpinner'
import UserModerationTab from './UserModerationTab'

const EmailDeletionTab = dynamic(() => import('./(EmailDeletion)/EmailDeletionTab'))
const NameDeletionTab = dynamic(() => import('./(NameDeletion)/NameDeletionTab'))
const ProfileMergeTab = dynamic(() => import('./(ProfileMerge)/ProfileMergeTab'))
const InstitutionTab = dynamic(() => import('./(Institution)/InstitutionTab'))
const VenueRequestTab = dynamic(() => import('./(VenueRequests)/VenueRequestTab'))

export default function Moderation({ accessToken }) {
  const [activeTabId, setActiveTabId] = useState('#profiles')
  const [isPending, startTransition] = useTransition()
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
        <Tab id="email" onClick={() => startTransition(() => setActiveTabId('#email'))}>
          Email Delete Requests
        </Tab>
        <Tab id="name" onClick={() => startTransition(() => setActiveTabId('#name'))}>
          Name Delete Requests <NameDeletionCount accessToken={accessToken} />
        </Tab>
        <Tab id="merge" onClick={() => startTransition(() => setActiveTabId('#merge'))}>
          Profile Merge Requests <ProfileMergeCount accessToken={accessToken} />
        </Tab>
        <Tab
          id="institution"
          onClick={() => startTransition(() => setActiveTabId('#institution'))}
        >
          Institution List
        </Tab>
        <Tab id="requests" onClick={() => startTransition(() => setActiveTabId('#requests'))}>
          Venue Requests <VenueRequestCount accessToken={accessToken} />
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel id="profiles">
          <UserModerationTab accessToken={accessToken} />
        </TabPanel>
        <TabPanel id="email">
          {activeTabId === '#email' && <EmailDeletionTab accessToken={accessToken} />}
        </TabPanel>
        <TabPanel id="name">
          {activeTabId === '#name' && <NameDeletionTab accessToken={accessToken} />}
        </TabPanel>
        <TabPanel id="merge">
          {activeTabId === '#merge' && <ProfileMergeTab accessToken={accessToken} />}
        </TabPanel>
        <TabPanel id="institution">
          {activeTabId === '#institution' && <InstitutionTab accessToken={accessToken} />}
        </TabPanel>
        <TabPanel id="requests">
          {activeTabId === '#requests' && <VenueRequestTab accessToken={accessToken} />}
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}
