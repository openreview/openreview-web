import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import { useRouter } from 'next/router'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import Table from '../Table'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import api from '../../lib/api-client'
import WebFieldContext from '../WebFieldContext'

const ProgramChairConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    apiVersion,
    areaChairsId,
    seniorAreaChairsId,
  } = useContext(WebFieldContext)
  const { setBannerContent } = appContext
  const { user, accessToken, userLoading } = useUser()
  const router = useRouter()
  const query = useQuery()
  const [activeTabId, setActiveTabId] = useState('venue-configuration')

  useEffect(() => {
    if (!query) return

    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      setBannerContent(venueHomepageLink(venueId))
    }
  }, [query, venueId])

  useEffect(() => {
    if (!userLoading && (!user || !user.profile || user.profile.id === 'guest')) {
      router.replace(
        `/login?redirect=${encodeURIComponent(
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        )}`
      )
    }
  }, [user, userLoading])

  return (
    <>
      <BasicHeader title={header?.title} instructions={header.instructions} />
      <Tabs>
        <TabList>
          <Tab id="venue-configuration" active>
            Overview
          </Tab>
          <Tab id="paper-status" onClick={() => setActiveTabId('paper-status')}>
            Paper Status
          </Tab>
          {areaChairsId && (
            <Tab id="areachair-status" onClick={() => setActiveTabId('areachair-status')}>
              Area Chair Status
            </Tab>
          )}
          {seniorAreaChairsId && (
            <Tab
              id="seniorareachair-status"
              onClick={() => setActiveTabId('seniorareachair-status')}
            >
              Senior Area Chair Status
            </Tab>
          )}
          <Tab id="reviewer-status" onClick={() => setActiveTabId('reviewer-status')}>
            Reviewer Status
          </Tab>
          <Tab
            id="deskrejectwithdrawn-status"
            onClick={() => setActiveTabId('deskrejectwithdrawn-status')}
          >
            Desk Rejected/Withdrawn Papers
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="venue-configuration">123</TabPanel>
          <TabPanel id="paper-status">{activeTabId === 'paper-status' && <>123</>}</TabPanel>
          {areaChairsId && activeTabId === 'areachair-status' && (
            <TabPanel id="areachair-status">
              <>123</>
            </TabPanel>
          )}
          {seniorAreaChairsId && activeTabId === 'seniorareachair-status' && (
            <TabPanel id="seniorareachair-status">
              <>123</>
            </TabPanel>
          )}
          <TabPanel id="reviewer-status">
            {activeTabId === 'reviewer-status' && <>123</>}
          </TabPanel>
          <TabPanel id="deskrejectwithdrawn-status">
            {activeTabId === 'deskrejectwithdrawn-status' && <>123</>}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default ProgramChairConsole
