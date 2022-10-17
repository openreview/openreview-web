/* globals promptError: false */

import { useState, useEffect } from 'react'
import keyBy from 'lodash/keyBy'
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

  const toggleEdge = async (noteId, value) => {
    const existingEdge = edgesMap[noteId]
    const ddate = (existingEdge && existingEdge.label === value && !existingEdge.ddate)
      ? Date.now()
      : null

    try {
      const res = await api.post('/edges', {
        ...(existingEdge ? { id: existingEdge.id } : {}),
        invitation: invitation.id,
        readers: [venueId, user.profile.id],
        writers: [venueId, user.profile.id],
        signatures: [user.profile.id],
        head: noteId,
        tail: user.profile.id,
        label: value,
        ddate,
      })
      setEdgesMap({
        ...edgesMap,
        [noteId]: res,
      })
      return res
    } catch (error) {
      promptError(error.message)
      return null
    }
  }

  function NoteListItem({ item }) {
    const edge = edgesMap[item.id]

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
          selectedBidOption={(!edge || edge.ddate) ? undefined : edge.label}
          updateBidOption={(value) => toggleEdge(item.id, value)}
          className="mb-2"
        />
      </>
    )
  }

  useEffect(() => {
    const loadEdges = async () => {
      try {
        const edges = await api.getAll('/edges', {
          invitation: invitation.id,
          tail : user.profile.id
        })
        if (edges?.length > 0) {
          setEdgesMap(keyBy(edges, 'head'))
        } else {
          setEdgesMap({})
        }
      } catch (error) {
        setEdgesMap({})
      }
    }

    loadEdges()
  }, [userLoading, user, shouldReload])

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
          {edgesMap ? (
            <SubmissionsList
              venueId={venueId}
              query={{ 'content.authorids': user.profile.id, sort: 'cdate', details: 'invitation' }}
              apiVersion={1}
              ListItem={NoteListItem}
              shouldReload={shouldReload}
              options={{ pageSize: 25, enableSearch: true, useCredentials: false }}
            />
          ) : (
            <LoadingSpinner inline />
          )}
        </TabPanel>
        <TabPanel id="your-expertise">
          {edgesMap ? (
            <LocallyPaginatedList
              listItems={[]}
              totalCount={0}
              ListItem={NoteListItem}
              emptyMessage="You have not selected any papers to represent your expertise"
              className=""
            />
          ) : (
            <LoadingSpinner inline />
          )}
        </TabPanel>
        <TabPanel id="excluded-papers">
          {edgesMap ? (
            <LocallyPaginatedList
              listItems={[]}
              totalCount={0}
              ListItem={NoteListItem}
              emptyMessage="You have not selected any papers to exclude"
              className=""
            />
          ) : (
            <LoadingSpinner inline />
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}
