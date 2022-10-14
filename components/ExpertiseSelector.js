import { useState, useEffect } from 'react'
import { groupBy } from 'lodash'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from './Tabs'
import SubmissionsList from './webfield/SubmissionsList'
import BasePaginatedList from './BasePaginatedList'
import Note, { NoteV2 } from './Note'
import { BidRadioButtonGroup } from './webfield/BidWidget'
import LoadingSpinner from './LoadingSpinner'
import ErrorAlert from './ErrorAlert'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'
import { prettyInvitationId } from '../lib/utils'

import styles from '../styles/components/ExpertiseSelector.module.scss'

const paperDisplayOptions = {
  pdfLink: true,
  replyCount: false,
  showContents: true,
  collapse: true,
  showTags: true,
}

function LocallyPaginatedList({ listItems, ListItem, totalCount, emptyMessage, className }) {
  const [page, setPage] = useState(1)

  return (
    <BasePaginatedList
      listItems={listItems}
      totalCount={totalCount}
      itemsPerPage={25}
      currentPage={page}
      setCurrentPage={setPage}
      ListItem={ListItem}
      emptyMessage="You have not selected any papers to represent your expertise"
      className=""
    />
  )
}

export default function ExpertiseSelector({ invitation, venueId, shouldReload }) {
  const { user, userLoading } = useUser()
  const [edgesMap, setEdgesMap] = useState(null)

  function NoteListItem({ item }) {
    return (
      <>
        {item.apiVersion === 2 ? (
          <NoteV2 note={item} options={paperDisplayOptions} />
        ) : (
          <Note note={item} options={paperDisplayOptions} />
        )}
        <BidRadioButtonGroup
          label={prettyInvitationId(invitation.id)}
          options={invitation.reply.content.label?.['value-radio']}
          updateBidOption={() => {}}
          className="mb-2"
        />
      </>
    )
  }

  useEffect(() => {
    if (userLoading) return

    const loadEdges = async () => {
      try {
        const edges = await api.getAll('/edges', {
          invitation: invitation.id,
          tail : user.profile.id
        })
        if (edges?.length > 0) {
          setEdgesMap(groupBy(edges, 'head'))
        } else {
          setEdgesMap({})
        }
      } catch (error) {
        setEdgesMap({})
      }
    }

    loadEdges()
  }, [userLoading, shouldReload])

  if (userLoading) return <LoadingSpinner />

  if (!user) return <ErrorAlert message="You must be logged in to select your expertise" />

  return (
    <Tabs className={styles.container}>
      <TabList>
        <Tab id="all-your-papers" icon="search" active>
          All Your Papers
        </Tab>
        <Tab id="your-expertise">
          Your Selected Expertise
        </Tab>
        <Tab id="excluded-papers">
          Excluded Papers
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel id="all-your-papers">
          <SubmissionsList
            venueId={venueId}
            query={{ 'content.authorids': user.profile.id, sort: 'cdate', details: 'invitation' }}
            apiVersion={1}
            ListItem={NoteListItem}
            shouldReload={shouldReload}
            options={{ pageSize: 25, enableSearch: true, useCredentials: false }}
          />
        </TabPanel>
        <TabPanel id="all-your-papers">
          <LocallyPaginatedList
            listItems={[]}
            totalCount={0}
            ListItem={NoteListItem}
            emptyMessage="You have not selected any papers to represent your expertise"
            className=""
          />
        </TabPanel>
        <TabPanel id="excluded-papers">
          <LocallyPaginatedList
            listItems={[]}
            totalCount={0}
            ListItem={NoteListItem}
            emptyMessage="You have not selected any papers to exclude"
            className=""
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}
