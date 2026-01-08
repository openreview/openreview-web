'use client'

import dynamic from 'next/dynamic'
import NameDeletionCount from './(NameDeletion)/NameDeletionCount'
import ProfileMergeCount from './(ProfileMerge)/ProfileMergeCount'
import VenueRequestCount from './(VenueRequests)/VenueRequestCount'
import UserModerationTab from './UserModerationTab'
import Tabs from 'components/Tabs'

const EmailDeletionTab = dynamic(() => import('./(EmailDeletion)/EmailDeletionTab'))
const NameDeletionTab = dynamic(() => import('./(NameDeletion)/NameDeletionTab'))
const ProfileMergeTab = dynamic(() => import('./(ProfileMerge)/ProfileMergeTab'))
const InstitutionTab = dynamic(() => import('./(Institution)/InstitutionTab'))
const VenueRequestTab = dynamic(() => import('./(VenueRequests)/VenueRequestTab'))

export default function Moderation({ accessToken }) {
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
      label: (
        <>
          Profile Merge Requests <ProfileMergeCount accessToken={accessToken} />
        </>
      ),
      children: <ProfileMergeTab accessToken={accessToken} />,
    },
    {
      key: 'institution',
      label: 'Institution List',
      children: <InstitutionTab accessToken={accessToken} />,
    },
    {
      key: 'requests',
      label: (
        <>
          Venue Requests <VenueRequestCount accessToken={accessToken} />
        </>
      ),
      children: <VenueRequestTab accessToken={accessToken} />,
    },
  ]

  return <Tabs items={items} />
}
