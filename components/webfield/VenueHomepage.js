/* globals promptError: false */
/* globals promptMessage: false */

import { useState, useContext, useEffect, useReducer } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import uniq from 'lodash/uniq'
import { nanoid } from 'nanoid/non-secure'
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

function ConsolesList({
  venueId,
  submissionInvitationId,
  authorsGroupId,
  apiVersion,
  setHidden,
  shouldReload,
  options = {},
}) {
  const [userConsoles, setUserConsoles] = useState(null)
  const { user, accessToken, userLoading } = useUser()

  const defaultAuthorsGroupId = `${venueId}/Authors`

  useEffect(() => {
    if (userLoading) return

    if (!user) {
      setUserConsoles([])
      return
    }

    const groupIdQuery = apiVersion === 1 ? { regex: `${venueId}/.*` } : { prefix: venueId }
    const getUserGroupsP = api.getAll(
      '/groups',
      { ...groupIdQuery, member: user.id, web: true },
      { accessToken, version: apiVersion }
    )

    let getUserSubmissionsP
    if (apiVersion === 1) {
      getUserSubmissionsP = api.get(
        '/notes',
        { invitation: submissionInvitationId, 'content.authorids': user.profile.id },
        { accessToken, version: apiVersion }
      )
    } else {
      getUserSubmissionsP = Promise.resolve({ notes: [] })
    }

    Promise.all([getUserGroupsP, getUserSubmissionsP])
      .then(([userGroups, userSubmissions]) => {
        const groupIds = []
        if (userSubmissions.notes?.length > 0) {
          groupIds.push(authorsGroupId ?? defaultAuthorsGroupId)
        }
        if (userGroups?.length > 0) {
          userGroups.forEach((g) => {
            if (g.id !== venueId) {
              groupIds.push(g.id)
            }
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
            <Link href={`/group?id=${groupId}`}>
              <a>{groupName} Console</a>
            </Link>
          </li>
        )
      })}
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
    apiVersion,
  } = useContext(WebFieldContext)
  const [formattedTabs, setFormattedTabs] = useState(null)
  const [shouldReload, reload] = useReducer((p) => !p, true)
  const router = useRouter()
  const { setBannerContent } = appContext
  const defaultActiveTab = formattedTabs?.findIndex((t) => !t.hidden) ?? 0

  const renderTab = (tabConfig) => {
    if (!tabConfig) return null

    if (tabConfig.type === 'consoles') {
      return (
        <ConsolesList
          venueId={group.id}
          submissionInvitationId={submissionId}
          authorsGroupId={tabConfig.authorsGroupId}
          apiVersion={apiVersion}
          options={tabConfig.options}
          shouldReload={shouldReload}
          setHidden={(newHidden) => {
            if (newHidden === tabConfig.hidden) return

            setFormattedTabs(
              formattedTabs.map((t) =>
                t.id === tabConfig.id ? { ...t, hidden: newHidden } : t
              )
            )
          }}
        />
      )
    }

    if (tabConfig.type === 'activity') {
      return (
        <ActivityList
          venueId={group.id}
          apiVersion={apiVersion}
          options={tabConfig.options}
          shouldReload={shouldReload}
        />
      )
    }

    if (tabConfig.type === 'markdown') {
      return <Markdown text={tabConfig.content} />
    }

    if (tabConfig.query || tabConfig.invitation) {
      const query = tabConfig.invitation
        ? { invitation: tabConfig.invitation }
        : tabConfig.query
      return (
        <SubmissionsList
          venueId={group.id}
          query={query}
          apiVersion={apiVersion}
          pageSize={tabConfig.options.pageSize}
          enableSearch={tabConfig.options.enableSearch}
          paperDisplayOptions={tabConfig.options.paperDisplayOptions}
          setCount={(itemCount) => {
            const isEmpty = !itemCount
            if (tabConfig.options.hideWhenEmpty && tabConfig.hidden !== isEmpty) {
              setFormattedTabs(
                formattedTabs.map((t) =>
                  t.id === tabConfig.id ? { ...t, hidden: isEmpty } : t
                )
              )
            }
          }}
        />
      )
    }
    return null
  }

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
        id: nanoid(10),
        hidden: tab.type === 'consoles' || tab.options?.hideWhenEmpty === true,
        options: {},
        ...tab,
      }))
    )
  }, [tabs])

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
            apiVersion={apiVersion}
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
              >
                {tabConfig.name}
              </Tab>
            ))}
          </TabList>

          <TabPanels>
            {formattedTabs?.map((tabConfig) => (
              <TabPanel key={`${tabConfig.id}-panel`} id={tabConfig.id}>
                {renderTab(tabConfig)}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </div>
    </>
  )
}
