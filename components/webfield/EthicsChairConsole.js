/* globals promptError: false */
import { useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import ErrorDisplay from '../ErrorDisplay'
import EthicsChairOverview from './EthicsChairConsole/EthicsChairOverview'
import PaperStatus from './EthicsChairConsole/EthicsChairPaperStatus'
import EthicsChairTasks from './EthicsChairConsole/EthicsChairTasks'
import { getRoleHashFragment } from '../../lib/utils'
import ConsoleTabs from './ConsoleTabs'

const EthicsChairConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    ethicsChairsName,
    ethicsReviewersName,
    submissionId,
    submissionName,
    ethicsReviewName,
    anonEthicsReviewerName,
    shortPhrase,
    ethicsMetaReviewName,
    preferredEmailInvitationId,
  } = useContext(WebFieldContext)
  const { setBannerContent } = appContext
  const router = useRouter()
  const query = useQuery()
  const { user, userLoading } = useUser()

  const ethicsChairsUrlFormat = getRoleHashFragment(ethicsChairsName)

  useEffect(() => {
    if (!query) return

    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      setBannerContent(venueHomepageLink(venueId))
    }
  }, [query, venueId])

  const missingConfig = Object.entries({
    header,
    entity: group,
    venueId,
    ethicsChairsName,
    ethicsReviewersName,
    submissionId,
    submissionName,
    anonEthicsReviewerName,
    shortPhrase,
  })
    .filter(([key, value]) => value === undefined)
    .map((p) => p[0])
  if (missingConfig.length > 0) {
    const errorMessage = `Ethics Chair Console is missing required properties: ${missingConfig.join(
      ', '
    )}`
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }

  return (
    <>
      <BasicHeader title={header?.title} instructions={header.instructions} />
      <ConsoleTabs
        defaultActiveTabId="overview"
        tabs={[
          {
            id: 'overview',
            label: 'Overview',
            content: <EthicsChairOverview />,
            visible: true,
          },
          {
            id: `${submissionName.toLowerCase()}-status`,
            label: `${submissionName} Status`,
            content: <PaperStatus />,
            visible: true,
          },
          {
            id: `${ethicsChairsUrlFormat}-tasks`,
            label: 'Ethics Chair Tasks',
            content: <EthicsChairTasks />,
            visible: true,
          },
        ]}
      />
    </>
  )
}

export default EthicsChairConsole
