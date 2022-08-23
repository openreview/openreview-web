import { useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import WebFieldContext from '../WebFieldContext'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'
import VenueHeader from './VenueHeader'
import SubmissionButton from './SubmissionButton'
import Note, { NoteV2 } from '../Note'
import PaginatedList from '../PaginatedList'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

function SubmissionsList({ invitationId, apiVersion }) {
  const { accessToken, userLoading } = useUser()
  const paperDisplayOptions = {
    pdfLink: true,
    replyCount: true,
    showContents: true,
    collapseContents: true,
    showTags: false,
  }

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

  if (userLoading) return null

  return (
    <PaginatedList
      loadItems={loadNotes}
      ListItem={NoteListItem}
      itemsPerPage={25}
      className="submissions-list"
    />
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
    showSubmissions,
    authorsGroupId,
    apiVersion,
  } = useContext(WebFieldContext)
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

  return (
    <>
      <VenueHeader headerInfo={header} />

      {submissionId && (
        <div id="invitation">
          <SubmissionButton
            invitationId={submissionId}
            apiVersion={apiVersion}
            onNoteCreated={() => {}}
            options={{ largeLabel: true }}
          />
        </div>
      )}

      <div id="notes">
        <Tabs>
          <TabList>
            <Tab id="your-consoles" active>
              Your Consoles
            </Tab>
            {showSubmissions && (
              <Tab id="all-submissions">
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
            <Tab id="recent-activity">
              Recent Activity
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel id="your-consoles">
            </TabPanel>

            {showSubmissions && (
              <TabPanel id="all-submissions">
                <SubmissionsList
                  invitationId={blindSubmissionId}
                  apiVersion={apiVersion}
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

            <TabPanel id="recent-activity">
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </>
  )
}
