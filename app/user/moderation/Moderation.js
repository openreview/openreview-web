'use client'

import { useEffect, useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
// import { OrTabs, Tab, TabList, TabPanel, TabPanels, Tabs } from '../../../components/Tabs'
import { OrTabs } from '../../../components/Tabs'
import NameDeletionCount from './(NameDeletion)/NameDeletionCount'
import ProfileMergeCount from './(ProfileMerge)/ProfileMergeCount'
import VenueRequestCount from './(VenueRequests)/VenueRequestCount'
import LoadingSpinner from '../../../components/LoadingSpinner'
import UserModerationTab from './UserModerationTab'
import Tabs from 'components/Tabs'

const EmailDeletionTab = dynamic(() => import('./(EmailDeletion)/EmailDeletionTab'))
const NameDeletionTab = dynamic(() => import('./(NameDeletion)/NameDeletionTab'))
const ProfileMergeTab = dynamic(() => import('./(ProfileMerge)/ProfileMergeTab'))
const InstitutionTab = dynamic(() => import('./(Institution)/InstitutionTab'))
const VenueRequestTab = dynamic(() => import('./(VenueRequests)/VenueRequestTab'))

export default function Moderation({ accessToken }) {
  const [isClientRendering, setIsClientRendering] = useState(false)

  const items = [
    {
      key: 'profiles',
      label: 'User Moderation',
      children: <UserModerationTab accessToken={accessToken} />,
    },
    {
      key: 'email',
      label: (
        <>
          Email Delete Requests <NameDeletionCount accessToken={accessToken} />{' '}
        </>
      ),
      children: <EmailDeletionTab accessToken={accessToken} />,
    },
    {
      key: 'name',
      label: 'Name Delete Requests',
      children: <NameDeletionTab accessToken={accessToken} />,
    },
    {
      key: 'merge',
      label: 'Profile Merge Requests',
      children: <ProfileMergeTab accessToken={accessToken} />,
    },
    {
      key: 'institution',
      label: 'Institution List',
      children: <InstitutionTab accessToken={accessToken} />,
    },
    {
      key: 'requests',
      label: 'Venue Requests',
      children: <VenueRequestTab accessToken={accessToken} />,
    },
  ]

  useEffect(() => {
    setIsClientRendering(true)
  }, [])

  if (!isClientRendering)
    return (
      <Tabs
        items={items.map((p) => ({
          key: p.key,
          label: p.label,
          children: <LoadingSpinner />,
        }))}
      />
    )

  return (
    <>
      <Tabs items={items} />
    </>
  )
  // return <OrTabs items={items} />
  // return (
  //   <Tabs>
  //     <TabList>
  //       <Tab id="profiles" active>
  //         User Moderation
  //       </Tab>
  //       <Tab id="email" onClick={() => startTransition(() => setActiveTabId('#email'))}>
  //         Email Delete Requests
  //       </Tab>
  //       <Tab id="name" onClick={() => startTransition(() => setActiveTabId('#name'))}>
  //         Name Delete Requests <NameDeletionCount accessToken={accessToken} />
  //       </Tab>
  //       <Tab id="merge" onClick={() => startTransition(() => setActiveTabId('#merge'))}>
  //         Profile Merge Requests <ProfileMergeCount accessToken={accessToken} />
  //       </Tab>
  //       <Tab
  //         id="institution"
  //         onClick={() => startTransition(() => setActiveTabId('#institution'))}
  //       >
  //         Institution List
  //       </Tab>
  //       <Tab id="requests" onClick={() => startTransition(() => setActiveTabId('#requests'))}>
  //         Venue Requests <VenueRequestCount accessToken={accessToken} />
  //       </Tab>
  //     </TabList>
  //     <TabPanels>
  //       <TabPanel id="profiles">
  //         <UserModerationTab accessToken={accessToken} />
  //       </TabPanel>
  //       <TabPanel id="email">
  //         {activeTabId === '#email' && <EmailDeletionTab accessToken={accessToken} />}
  //       </TabPanel>
  //       <TabPanel id="name">
  //         {activeTabId === '#name' && <NameDeletionTab accessToken={accessToken} />}
  //       </TabPanel>
  //       <TabPanel id="merge">
  //         {activeTabId === '#merge' && <ProfileMergeTab accessToken={accessToken} />}
  //       </TabPanel>
  //       <TabPanel id="institution">
  //         {activeTabId === '#institution' && <InstitutionTab accessToken={accessToken} />}
  //       </TabPanel>
  //       <TabPanel id="requests">
  //         {activeTabId === '#requests' && <VenueRequestTab accessToken={accessToken} />}
  //       </TabPanel>
  //     </TabPanels>
  //   </Tabs>
  // )
}
