'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AntdTabs } from '../../../components/Tabs'
import NameDeletionCount from './(NameDeletion)/NameDeletionCount'
import ProfileMergeCount from './(ProfileMerge)/ProfileMergeCount'
import NewVenueRequestCount from './(VenueRequests)/NewVenueRequestCount'
import IdentityDocumentsTab from './IdentityDocumentsTab'
import UserModerationTab from './UserModerationTab'

const EmailDeletionTab = dynamic(() => import('./(EmailDeletion)/EmailDeletionTab'))
const NameDeletionTab = dynamic(() => import('./(NameDeletion)/NameDeletionTab'))
const ProfileMergeTab = dynamic(() => import('./(ProfileMerge)/ProfileMergeTab'))
const InstitutionTab = dynamic(() => import('./(Institution)/InstitutionTab'))
const ConnectedAppTab = dynamic(() => import('./(Connection)/ConnectedAppTab'))
const VenueRequestTab = dynamic(() => import('./(VenueRequests)/VenueRequestTab'))
const VenuesTab = dynamic(() => import('./(VenueRequests)/VenuesTab'))

export default function Moderation() {
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const [activeKey, setActiveKey] = useState('profiles')

  useEffect(() => {
    if (idParam) setActiveKey('profiles')
  }, [idParam])

  const items = useMemo(
    () => [
      {
        key: 'profiles',
        label: 'Moderation',
        children: <UserModerationTab />,
      },
      {
        key: 'documents',
        label: 'Identity Documents',
        children: <IdentityDocumentsTab />,
      },
      {
        key: 'email',
        label: 'Email Delete',
        children: <EmailDeletionTab />,
      },
      {
        key: 'name',
        label: <NameDeletionCount>Name Delete</NameDeletionCount>,
        children: <NameDeletionTab />,
      },
      {
        key: 'merge',
        label: <ProfileMergeCount>Profile Merge</ProfileMergeCount>,
        children: <ProfileMergeTab />,
      },
      {
        key: 'institution',
        label: 'Institution List',
        children: <InstitutionTab />,
      },
      {
        key: 'connections',
        label: 'Connected Apps',
        children: <ConnectedAppTab />,
      },
      {
        key: 'requests',
        label: <NewVenueRequestCount>Venue Requests</NewVenueRequestCount>,
        children: <VenueRequestTab />,
      },
      {
        key: 'venues',
        label: 'Deployed Venues',
        children: <VenuesTab />,
      },
    ],
    []
  )

  return (
    <AntdTabs
      type="card"
      items={items}
      activeKey={activeKey}
      onChange={(key) => {
        setActiveKey(key)
        if (idParam) window.history.replaceState(null, '', window.location.pathname)
      }}
    />
  )
}
