import dynamic from 'next/dynamic'
import serverAuth, { isSuperUser } from '../../auth'
import Moderation from './Moderation'
import UserModerationTab from './UserModerationTab'
import CommonLayout from '../../CommonLayout'
import ErrorDisplay from '../../../components/ErrorDisplay'

const EmailDeletionTab = dynamic(() => import('./(EmailDeletion)/EmailDeletionTab'))
const NameDeletionTab = dynamic(() => import('./(NameDeletion)/NameDeletionTab'))
const ProfileMergeTab = dynamic(() => import('./(ProfileMerge)/ProfileMergeTab'))
const InstitutionTab = dynamic(() => import('./(Institution)/InstitutionTab'))
const VenueRequestTab = dynamic(() => import('./(VenueRequests)/VenueRequestTab'))

export default async function page() {
  const { user, token } = await serverAuth()
  if (!isSuperUser(user))
    return <ErrorDisplay message="Forbidden. Access to this page is restricted." />

  return (
    <CommonLayout banner={null}>
      <header>
        <h1>User Moderation</h1>
      </header>
      <Moderation
        // eslint-disable-next-line react/no-children-prop
        children={{
          profiles: <UserModerationTab accessToken={token} />,
          email: <EmailDeletionTab accessToken={token} />,
          name: <NameDeletionTab accessToken={token} />,
          merge: <ProfileMergeTab accessToken={token} />,
          institution: <InstitutionTab accessToken={token} />,
          requests: <VenueRequestTab accessToken={token} />,
        }}
        accessToken={token}
      />
    </CommonLayout>
  )
}
