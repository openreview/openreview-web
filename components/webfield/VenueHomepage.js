/* globals promptError: false */
/* globals promptMessage: false */

import { useState, useContext, useEffect, useReducer } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import uniq from 'lodash/uniq'
import kebabCase from 'lodash/kebabCase'
import WebFieldContext from '../WebFieldContext'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'
import VenueHeader from './VenueHeader'
import SubmissionButton from './SubmissionButton'
import SubmissionsList from './SubmissionsList'
import ActivityList from './ActivityList'
import Markdown from '../EditorComponents/Markdown'
import ErrorDisplay from '../ErrorDisplay'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

function ConsolesList({ venueId, submissionInvitationId, setHidden, shouldReload }) {
  const [userConsoles, setUserConsoles] = useState(null)
  const { user, accessToken, userLoading } = useUser()

  useEffect(() => {
    if (userLoading) return

    if (!user) {
      setUserConsoles([])
      return
    }

    api
      .getAll(
        '/groups',
        { prefix: `${venueId}/`, member: user.id, web: true, domain: venueId },
        { accessToken }
      )
      .then((userGroups) => {
        const groupIds = []
        if (userGroups?.length > 0) {
          userGroups.forEach((g) => {
            groupIds.push(g.id)
          })
        }
        setUserConsoles(uniq(groupIds))
      })
      .catch((error) => {
        setUserConsoles([])
        promptError(error.message)
      })
  }, [user, accessToken, userLoading, venueId, submissionInvitationId, shouldReload])

  useEffect(() => {
    if (!userConsoles || typeof setHidden !== 'function') return

    setHidden(userConsoles.length === 0)
  }, [userConsoles])

  if (!userConsoles) return null

  return (
    <ul className="list-unstyled submissions-list">
      {userConsoles.map((groupId) => {
        let groupName = groupId.split('/').pop().replace(/_/g, ' ')
        if (groupName.endsWith('s')) {
          groupName = groupName.slice(0, -1)
        }

        return (
          <li key={groupId} className="note invitation-link">
            <Link href={`/group?id=${groupId}`}>{groupName} Console</Link>
          </li>
        )
      })}
    </ul>
  )
}

function LinksList({ links }) {
  if (!links || links.length === 0) return null

  return (
    <ul className="list-unstyled venues-list mt-2">
      {links.map(({ name, url }, i) => (
        <li className="mb-2" key={i}>
          {url.startsWith('/') ? (
            <Link href={url}>{name ?? url}</Link>
          ) : (
            <a href={url} target="_blank" rel="noopener noreferrer">
              {name ?? url}
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function VenueHomepage({ appContext }) {
  const {
    entity: group,
    header,
    parentGroupId,
    submissionId,
    submissionConfirmationMessage,
    tabs,
  } = useContext(WebFieldContext)
  const [formattedTabs, setFormattedTabs] = useState(null)
  const [tabsLoaded, setTabsLoaded] = useState([])
  const [defaultActiveTab, setDefaultActiveTab] = useState(-1)
  const [tabsDisabled, setTabsDisabled] = useState(false)
  const [shouldReload, reload] = useReducer((p) => !p, true)
  const router = useRouter()
  const { setBannerContent } = appContext

  const renderTab = (tabConfig, tabIndex) => {
    if (!tabConfig) return null

    const markTabLoaded = () => {
      setTabsLoaded((currentTabsLoaded) =>
        currentTabsLoaded.map((loaded, i) => (i === tabIndex ? true : loaded))
      )
    }

    if (tabConfig.type === 'consoles') {
      return (
        <ConsolesList
          venueId={group.id}
          submissionInvitationId={submissionId}
          authorsGroupId={tabConfig.authorsGroupId}
          options={tabConfig.options}
          shouldReload={shouldReload}
          setHidden={(newHidden) => {
            if (newHidden !== tabConfig.hidden) {
              setFormattedTabs((currentTabs) =>
                currentTabs.map((t) =>
                  t.id === tabConfig.id ? { ...t, hidden: newHidden } : t
                )
              )
            }
            markTabLoaded()
          }}
        />
      )
    }

    if (tabConfig.type === 'activity') {
      return (
        <ActivityList
          venueId={group.id}
          apiVersion={2}
          invitation={tabConfig.options.invitation}
          pageSize={tabConfig.options.pageSize}
          shouldReload={shouldReload}
        />
      )
    }

    if (tabConfig.type === 'markdown') {
      return <Markdown text={tabConfig.content} />
    }

    if (tabConfig.links?.length > 0) {
      return <LinksList links={tabConfig.links} />
    }

    if (tabConfig.query || tabConfig.invitation) {
      const query = tabConfig.invitation
        ? { invitation: tabConfig.invitation }
        : tabConfig.query

      const { postQuery } = tabConfig.options
      let filterFn = null
      if (tabConfig.options.postQuery) {
        filterFn = (note) =>
          Object.keys(postQuery).every((key) => {
            const value = key.startsWith('content.')
              ? note.content[key.slice(8)]?.value
              : note[key]
            if (typeof value === 'undefined' || value === null) return false
            return Array.isArray(value)
              ? value.includes(postQuery[key])
              : value === postQuery[key]
          })
      }

      return (
        <SubmissionsList
          venueId={group.domain}
          query={query}
          apiVersion={tabConfig.apiVersion || 2}
          pageSize={tabConfig.options.pageSize}
          enableSearch={tabConfig.options.enableSearch}
          paperDisplayOptions={tabConfig.options.paperDisplayOptions}
          shouldReload={shouldReload}
          updateCount={(itemCount) => {
            const isEmpty = !itemCount
            if (tabConfig.options.hideWhenEmpty && tabConfig.hidden !== isEmpty) {
              setFormattedTabs((currentTabs) =>
                currentTabs.map((t) => (t.id === tabConfig.id ? { ...t, hidden: isEmpty } : t))
              )
            }
            markTabLoaded()
          }}
          filterNotes={filterFn}
        />
      )
    }
    return null
  }

  useEffect(() => {
    const handleRouteChange = () => {
      setTabsDisabled(false)
    }

    router.events.on('hashChangeComplete', handleRouteChange)
    return () => {
      router.events.off('hashChangeComplete', handleRouteChange)
    }
  }, [])

  useEffect(() => {
    // Set referrer banner
    if (!router.isReady) return

    if (router.query.referrer) {
      setBannerContent(referrerLink(router.query.referrer))
    } else if (parentGroupId) {
      setBannerContent(venueHomepageLink(parentGroupId))
    }
  }, [router.isReady, router.query])

  useEffect(() => {
    if (!tabs) return

    setFormattedTabs(
      tabs.map((tab) => ({
        id: kebabCase(tab.name),
        hidden: tab.type === 'consoles' || tab.options?.hideWhenEmpty === true,
        options: {},
        ...tab,
      }))
    )
    // Currently only the consoles and submission list tabs are loaded asynchronously
    setTabsLoaded(
      tabs.map(
        (tab) => tab.type === 'activity' || tab.type === 'activity' || tab.links?.length > 0
      )
    )
  }, [tabs])

  useEffect(() => {
    // Only set an active tab after all the tabs have loaded
    if (!formattedTabs || !tabsLoaded.every(Boolean)) return

    // Remove the prefix "#tab-" from the hash to get the id of the tab
    const currentHash = window.location.hash.slice(5)
    const currentHashTab = currentHash
      ? formattedTabs.findIndex((t) => t.id === currentHash)
      : -1
    setDefaultActiveTab((currActiveTab) =>
      currentHashTab > -1 ? currentHashTab : formattedTabs.findIndex((t) => !t.hidden)
    )
  }, [formattedTabs, tabsLoaded])

  if (!header || !tabs) {
    const errorMessage = 'Venue Homepage requires both header and tabs properties to be set'
    return <ErrorDisplay statusCode="" message={errorMessage} />
  }

  return (
    <>
      <VenueHeader headerInfo={header} />

      {submissionId && (
        <div id="invitation">
          <SubmissionButton
            invitationId={submissionId}
            apiVersion={2}
            onNoteCreated={() => {
              const defaultConfirmationMessage =
                'Your submission is complete. Check your inbox for a confirmation email. The author console page for managing your submissions will be available soon.'
              promptMessage(submissionConfirmationMessage || defaultConfirmationMessage)
              reload()
            }}
            options={{ largeLabel: true }}
          />
        </div>
      )}

      <div id="notes">
        <Tabs>
          <TabList>
            {formattedTabs?.map((tabConfig, i) => (
              <Tab
                key={tabConfig.id}
                id={tabConfig.id}
                active={i === defaultActiveTab}
                hidden={tabConfig.hidden}
                onClick={() => {
                  // Don't allow the user to switch tabs while tabs are changing
                  if (defaultActiveTab === -1 || tabsDisabled) return

                  const currentHash = window.location.hash.slice(5)
                  if (currentHash !== tabConfig.id) {
                    setTabsDisabled(true)
                    router.replace(`#tab-${tabConfig.id}`, undefined, {
                      scroll: false,
                      shallow: true,
                    })
                  }
                }}
              >
                {tabConfig.name}
              </Tab>
            ))}
          </TabList>

          <TabPanels>
            {formattedTabs?.map((tabConfig, i) => (
              <TabPanel key={`${tabConfig.id}-panel`} id={tabConfig.id}>
                {renderTab(tabConfig, i)}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </div>
    </>
  )
}
