/* globals $: false */
/* globals Webfield, Webfield2: false */
/* globals typesetMathJax: false */
/* globals promptError: false */
/* globals promptMessage: false */

import { useState, useContext, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import uniq from 'lodash/uniq'
import WebFieldContext from '../WebFieldContext'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'
import VenueHeader from './VenueHeader'
import SubmissionButton from './SubmissionButton'
import Note, { NoteV2 } from '../Note'
import PaginatedList from '../PaginatedList'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

function ConsoleList({ groupIds }) {
  return (
    <ul className="list-unstyled submissions-list">
      {groupIds.map(groupId => {
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

function SubmissionsList({ venueId, invitationId, accessToken, apiVersion, enableSearch }) {
  const paperDisplayOptions = {
    pdfLink: true,
    replyCount: true,
    showContents: true,
    collapsibleContents: true,
    showTags: false,
  }
  const pageSize = 25

  const loadNotes = async (limit, offset) => {
    const { notes, count } = await api.get(
      '/notes',
      { invitation: invitationId, details: 'replyCount,invitation,original', limit, offset },
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
        term,
        type: 'terms',
        content: 'all',
        source: 'forum',
        group: venueId,
        invitation: invitationId,
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
      return (
        <NoteV2 note={item} options={paperDisplayOptions} />
      )
    }
    return (
      <Note note={item} options={paperDisplayOptions} />
    )
  }

  return (
    <PaginatedList
      loadItems={loadNotes}
      searchItems={enableSearch && searchNotes}
      ListItem={NoteListItem}
      itemsPerPage={pageSize}
      className="submissions-list"
    />
  )
}

function ActivityList({ activityNotes, user }) {
  const containerRef = useRef(null)

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

  return (
    <div ref={containerRef} />
  )
}

export default function VenueHomepage({ appContext }) {
  const {
    entity: group,
    header,
    parentGroupId,
    submissionId,
    blindSubmissionId, // v1
    withdrawnSubmissionId,
    deskRejectedSubmissionId,
    submissionConfirmationMessage,
    showSubmissions,
    showActivity,
    authorsGroupId,
    apiVersion,
  } = useContext(WebFieldContext)
  const { user, accessToken, userLoading } = useUser()
  const [userConsoles, setUserConsoles] = useState([])
  const [activityNotes, setActivityNotes] = useState([])
  const [reloadConsoles, setReloadConsoles] = useState(false)
  const router = useRouter()
  const { setBannerContent } = appContext

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
    if (userLoading) return

    if (!user) {
      setUserConsoles([])
      setActivityNotes([])
      return
    }

    const getUserGroupsP = api.getAll(
      '/groups',
      { regex: `${group.id}/.*`, member: user.id, web: true },
      { accessToken }
    )
    const getUserSubmissionsP = api.get(
      '/notes',
      { invitation: submissionId, 'content.authorids': user.profile.id, limit: 1 },
      { accessToken, version: apiVersion }
    )
    const getActivityNotesP = api.get(
      '/notes',
      { invitation: `${group.id}/.*`, details: 'forumContent,invitation,writable', sort: 'tmdate:desc', limit: 25 },
      { accessToken, version: apiVersion}
    )

    Promise.all([getUserGroupsP, getUserSubmissionsP, getActivityNotesP])
      .then(([userGroups, userSubmissions, recentActivityNotes]) => {
        const groupIds = []
        if (userSubmissions.notes?.length > 0) {
          groupIds.push(authorsGroupId)
        }
        if (userGroups?.length > 0) {
          userGroups.forEach((g) => {
            groupIds.push(g.id)
          })
        }
        setUserConsoles(uniq(groupIds))

        if (recentActivityNotes.notes?.length > 0) {
          setActivityNotes(recentActivityNotes.notes)
        }
      })
      .catch((error) => {
        promptError(error.message)
      })
  }, [user, accessToken, userLoading, reloadConsoles])

  if (userLoading) return null

  return (
    <>
      <VenueHeader headerInfo={header} />

      {submissionId && (
        <div id="invitation">
          <SubmissionButton
            invitationId={submissionId}
            apiVersion={apiVersion}
            onNoteCreated={() => {
              const defaultConfirmationMessage = 'Your submission is complete. Check your inbox for a confirmation email. The author console page for managing your submissions will be available soon.'
              promptMessage(submissionConfirmationMessage || defaultConfirmationMessage)
              setReloadConsoles(!reloadConsoles)
            }}
            options={{ largeLabel: true }}
          />
        </div>
      )}

      <div id="notes">
        <Tabs>
          <TabList>
            {userConsoles.length > 0 && (
              <Tab id="your-consoles" active>
                Your Consoles
              </Tab>
            )}
            {showSubmissions && (
              <Tab id="all-submissions" active={userConsoles.length === 0}>
                All Submissions
              </Tab>
            )}
            {showSubmissions && withdrawnSubmissionId && (
              <Tab id="withdrawn-submissions">
                Withdrawn Submissions
              </Tab>
            )}
            {showSubmissions && deskRejectedSubmissionId && (
              <Tab id="desk-rejected-submissions">
                Desk Rejected Submissions
              </Tab>
            )}
            {showActivity && activityNotes.length > 0 && (
              <Tab id="recent-activity" active={userConsoles.length === 0 && !showSubmissions}>
                Recent Activity
              </Tab>
            )}
          </TabList>

          <TabPanels>
            {userConsoles.length > 0 && (
              <TabPanel id="your-consoles">
                <ConsoleList groupIds={userConsoles} />
              </TabPanel>
            )}

            {showSubmissions && (
              <TabPanel id="all-submissions">
                <SubmissionsList
                  venueId={group.id}
                  invitationId={blindSubmissionId || submissionId}
                  apiVersion={apiVersion}
                  enableSearch={true}
                />
              </TabPanel>
            )}

            {showSubmissions && withdrawnSubmissionId && (
              <TabPanel id="withdrawn-submissions">
                <SubmissionsList
                  invitationId={withdrawnSubmissionId}
                  apiVersion={apiVersion}
                />
              </TabPanel>
            )}

            {showSubmissions && deskRejectedSubmissionId && (
              <TabPanel id="desk-rejected-submissions">
                <SubmissionsList
                  invitationId={deskRejectedSubmissionId}
                  apiVersion={apiVersion}
                />
              </TabPanel>
            )}

            {activityNotes.length > 0 && (
              <TabPanel id="recent-activity">
                <ActivityList activityNotes={activityNotes} user={user} />
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </div>
    </>
  )
}
