/* globals $: false */
/* globals Webfield, Webfield2: false */
/* globals typesetMathJax: false */
/* globals promptError: false */
/* globals promptMessage: false */

import { useState, useContext, useEffect, useReducer, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import kebabCase from 'lodash/kebabCase'
import uniq from 'lodash/uniq'
import WebFieldContext from '../WebFieldContext'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'
import VenueHeader from './VenueHeader'
import SubmissionButton from './SubmissionButton'
import Note, { NoteV2 } from '../Note'
import PaginatedList from '../PaginatedList'
import Markdown from '../EditorComponents/Markdown'
import ErrorDisplay from '../ErrorDisplay'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

function ConsolesList({ venueId, submissionInvitationId, authorsGroupId, apiVersion, shouldReload, options = {} }) {
  const [userConsoles, setUserConsoles] = useState(null)
  const { user, accessToken, userLoading } = useUser()

  const defaultAuthorsGroupId = `${venueId}/Authors`

  useEffect(() => {
    if (userLoading) return

    if (!user) {
      setUserConsoles([])
      return
    }

    const getUserGroupsP = api.getAll(
      '/groups',
      { regex: `${venueId}/.*`, member: user.id, web: true },
      { accessToken }
    )
    const getUserSubmissionsP = api.get(
      '/notes',
      { invitation: submissionInvitationId, 'content.authorids': user.profile.id, limit: 1 },
      { accessToken, version: apiVersion }
    )

    Promise.all([getUserGroupsP, getUserSubmissionsP])
      .then(([userGroups, userSubmissions]) => {
        const groupIds = []
        if (userSubmissions.notes?.length > 0) {
          groupIds.push(authorsGroupId ?? defaultAuthorsGroupId)
        }
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

function SubmissionsList({ venueId, query, apiVersion, options = {} }) {
  const { accessToken, userLoading } = useUser()

  const paperDisplayOptions = {
    pdfLink: true,
    replyCount: true,
    showContents: true,
    collapse: true,
    showTags: false,
  }
  const opts = {
    enableSearch: false,
    pageSize: 25,
    ...options,
  }

  const loadNotes = async (limit, offset) => {
    const { notes, count } = await api.get(
      '/notes',
      { ...query, details: 'replyCount,invitation,original', limit, offset },
      { accessToken, version: apiVersion }
    )
    return {
      items: notes,
      count: count ?? 0,
    }
  }

  const searchNotes = async (term, limit, offset) => {
    const { notes, count } = await api.get(
      '/notes/search',
      {
        ...query,
        term,
        type: 'terms',
        content: 'all',
        source: 'forum',
        group: venueId,
        limit,
        offset,
      },
      { accessToken, version: apiVersion }
    )
    return {
      items: notes,
      count: count ?? 0,
    }
  }

  function NoteListItem({ item }) {
    if (apiVersion === 2) {
      return <NoteV2 note={item} options={paperDisplayOptions} />
    }
    return <Note note={item} options={paperDisplayOptions} />
  }

  if (userLoading) return null

  return (
    <PaginatedList
      loadItems={loadNotes}
      searchItems={opts.enableSearch && searchNotes}
      ListItem={NoteListItem}
      itemsPerPage={opts.pageSize}
      className="submissions-list"
    />
  )
}

function ActivityList({ venueId, apiVersion, options = {} }) {
  const [activityNotes, setActivityNotes] = useState(null)
  const { user, accessToken, userLoading } = useUser()
  const containerRef = useRef(null)

  const opts = {
    invitation: `${venueId}/.*`,
    pageSize: 25,
    ...options,
  }

  useEffect(() => {
    if (userLoading) return

    api.get(
      '/notes',
      {
        invitation: opts.invitation,
        details: 'forumContent,invitation,writable',
        sort: 'tmdate:desc',
        limit: opts.pageSize,
      },
      { accessToken, version: apiVersion }
    )
      .then(({ notes }) => {
        if (notes?.length > 0) {
          setActivityNotes(notes)
        } else {
          setActivityNotes([])
        }
      })
      .catch((error) => {
        setActivityNotes([])
        promptError(error.message)
      })
  }, [userLoading, accessToken])

  useEffect(() => {
    if (!activityNotes) return

    $(containerRef.current).empty()

    Webfield.ui.activityList(activityNotes, {
      container: containerRef.current,
      emptyMessage: 'No recent activity to display.',
      user: user.profile,
      showActionButtons: true,
    })

    $('[data-toggle="tooltip"]').tooltip()

    typesetMathJax()
  }, [activityNotes])

  return <div ref={containerRef} />
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
  const [shouldReload, reload] = useReducer((p) => !p, true)
  const router = useRouter()
  const { setBannerContent } = appContext

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
      return (
        <Markdown text={tabConfig.content} />
      )
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
          options={tabConfig.options}
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
            {tabs.map((tabConfig, i) => {
              const tabId = kebabCase(tabConfig.name)
              return (
                <Tab key={tabId} id={tabId} active={i === 0}>
                  {tabConfig.name}
                </Tab>
              )
            })}
          </TabList>

          <TabPanels>
            {tabs.map((tabConfig) => {
              const tabId = kebabCase(tabConfig.name)
              return (
                <TabPanel key={`${tabId}-panel`} id={tabId}>
                  {renderTab(tabConfig)}
                </TabPanel>
              )
            })}
          </TabPanels>
        </Tabs>
      </div>
    </>
  )
}
