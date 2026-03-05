'use client'

import dynamic from 'next/dynamic'
import NameDeletionCount from './(NameDeletion)/NameDeletionCount'
import ProfileMergeCount from './(ProfileMerge)/ProfileMergeCount'
import NewVenueRequestCount from './(VenueRequests)/NewVenueRequestCount'
import UserModerationTab from './UserModerationTab'
import { AntdTabs } from '../../../components/Tabs'

const EmailDeletionTab = dynamic(() => import('./(EmailDeletion)/EmailDeletionTab'))
const NameDeletionTab = dynamic(() => import('./(NameDeletion)/NameDeletionTab'))
const ProfileMergeTab = dynamic(() => import('./(ProfileMerge)/ProfileMergeTab'))
const InstitutionTab = dynamic(() => import('./(Institution)/InstitutionTab'))
const VenueRequestTab = dynamic(() => import('./(VenueRequests)/VenueRequestTab'))
const VenuesTab = dynamic(() => import('./(VenueRequests)/VenuesTab'))

export default function Moderation() {
  const items = [
    {
      key: 'profiles',
      label: 'Moderation',
      children: <UserModerationTab />,
    },
    {
      key: 'email',
      label: <NameDeletionCount>Email Delete</NameDeletionCount>,
      children: <EmailDeletionTab />,
    },
    {
      key: 'name',
      label: 'Name Delete',
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
      key: 'requests',
      label: <NewVenueRequestCount>Venue Requests</NewVenueRequestCount>,
      children: <VenueRequestTab />,
    },
    {
      key: 'venues',
      label: 'Deployed Venues',
      children: <VenuesTab />,
    },
  ]
  return <AntdTabs type="card" items={items} />
}
