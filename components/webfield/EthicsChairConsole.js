/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import ErrorDisplay from '../ErrorDisplay'
import EthicsChairOverview from './EthicsChairConsole/EthicsChairOverview'
import PaperStatus from './EthicsChairConsole/EthicsChairPaperStatus'
import EthicsChairTasks from './EthicsChairConsole/EthicsChairTasks'
import { getRoleHashFragment } from '../../lib/utils'

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
  const { setBannerContent } = appContext ?? {}
  const query = useSearchParams()
  const [activeTabId, setActiveTabId] = useState(
    decodeURIComponent(window.location.hash) || '#overview'
  )

  const ethicsChairsUrlFormat = getRoleHashFragment(ethicsChairsName)
  const validTabIds = [
    '#overview',
    `#${submissionName.toLowerCase()}-status`,
    `#${ethicsChairsUrlFormat}-tasks`,
  ]

  useEffect(() => {
    if (!query) return

    if (query.get('referrer')) {
      setBannerContent({ type: 'referrerLink', value: query.get('referrer') })
    } else {
      setBannerContent({ type: 'venueHomepageLink', value: venueId })
    }
  }, [query, venueId])

  useEffect(() => {
    if (!validTabIds.includes(activeTabId)) {
      setActiveTabId(validTabIds[0])
      return
    }
    window.location.hash = activeTabId
  }, [activeTabId])

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
            id={`${submissionName.toLowerCase()}-status`}
            active={
              activeTabId === `#${submissionName.toLowerCase()}-status` ? true : undefined
            }
            onClick={() => setActiveTabId(`#${submissionName.toLowerCase()}-status`)}
          >
            {submissionName} Status
          </Tab>
          <Tab
            id={`${ethicsChairsUrlFormat}-tasks`}
            active={activeTabId === `#${ethicsChairsUrlFormat}-tasks` ? true : undefined}
            onClick={() => setActiveTabId(`#${ethicsChairsUrlFormat}-tasks`)}
          >
            Ethics Chair Tasks
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="overview">
            <EthicsChairOverview />
          </TabPanel>
          <TabPanel id={`${submissionName.toLowerCase()}-status`}>
            {activeTabId === `#${submissionName.toLowerCase()}-status` && <PaperStatus />}
          </TabPanel>
          <TabPanel id={`${ethicsChairsUrlFormat}-tasks`}>
            {activeTabId === `#${ethicsChairsUrlFormat}-tasks` && <EthicsChairTasks />}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default EthicsChairConsole
