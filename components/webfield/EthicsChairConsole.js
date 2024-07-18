/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import ErrorDisplay from '../ErrorDisplay'
import EthicsChairOverview from './EthicsChairConsole/EthicsChairOverview'
import PaperStatus from './EthicsChairConsole/EthicsChairPaperStatus'
import EthicsChairTasks from './EthicsChairConsole/EthicsChairTasks'

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
  } = useContext(WebFieldContext)
  const { setBannerContent } = appContext
  const router = useRouter()
  const query = useQuery()
  const [activeTabId, setActiveTabId] = useState(window.location.hash || '#overview')
  const { user, userLoading } = useUser()

  useEffect(() => {
    if (!query) return

    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      setBannerContent(venueHomepageLink(venueId))
    }
  }, [query, venueId])

  useEffect(() => {
    if (!activeTabId) return
    router.replace(activeTabId)
  }, [activeTabId])

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(
        `/login?redirect=${encodeURIComponent(
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        )}`
      )
    }
  }, [user, userLoading])

  const missingConfig = Object.entries({
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
      <Tabs>
        <TabList>
          <Tab
            id="overview"
            active={activeTabId === '#overview' ? true : undefined}
            onClick={() => setActiveTabId('#overview')}
          >
            Overview
          </Tab>
          <Tab
            id="paper-status"
            active={activeTabId === '#paper-status' ? true : undefined}
            onClick={() => setActiveTabId('#paper-status')}
          >
            {submissionName} Status
          </Tab>
          <Tab
            id="ethicschair-tasks"
            active={activeTabId === '#ethicschair-tasks' ? true : undefined}
            onClick={() => setActiveTabId('#ethicschair-tasks')}
          >
            Ethics Chair Tasks
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="overview">
            <EthicsChairOverview />
          </TabPanel>
          <TabPanel id="paper-status">
            {activeTabId === '#paper-status' && <PaperStatus />}
          </TabPanel>
          <TabPanel id="ethicschair-tasks">
            {activeTabId === '#ethicschair-tasks' && <EthicsChairTasks />}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default EthicsChairConsole
