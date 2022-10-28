/* globals promptError: false */

import { useState, useEffect } from 'react'
import keyBy from 'lodash/keyBy'
import kebabCase from 'lodash/kebabCase'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from './Tabs'
import SubmissionsList from './webfield/SubmissionsList'
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
  showEdges: true,
}
const allPapersOptions = { pageSize: 25, enableSearch: true, useCredentials: false }
const excludedPapersOptions = { pageSize: 25, enableSearch: false }

export default function ExpertiseSelector({ invitation, venueId, shouldReload }) {
  const { user, userLoading } = useUser()
  const [edgesMap, setEdgesMap] = useState(null)

  const invitationOption = invitation.reply.content.label?.['value-radio']?.[0] || 'Exclude'
  const tabLabel = `${invitationOption}d Papers`
  const tabId = kebabCase(tabLabel)

  const selectedIds = edgesMap
    ? Object.keys(edgesMap).filter((noteId) => !edgesMap[noteId].ddate)
    : null

  const toggleEdge = async (noteId, value) => {
    const existingEdge = edgesMap[noteId]
    const ddate =
      existingEdge && existingEdge.label === value && !existingEdge.ddate ? Date.now() : null

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
          selectedBidOption={!edge || edge.ddate ? undefined : edge.label}
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
          tail: user.profile.id,
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
  }, [userLoading, user])

  if (userLoading) return <LoadingSpinner />

  if (!user) return <ErrorAlert message="You must be logged in to select your expertise" />

  return (
    <Tabs className={styles.container}>
      <TabList>
        <Tab id="all-your-papers" icon="search" active>
          All Your Papers
        </Tab>
        <Tab id={tabId}>{tabLabel}</Tab>
      </TabList>

      <TabPanels>
        <TabPanel id="all-your-papers">
          {edgesMap ? (
            <SubmissionsList
              venueId={venueId}
              query={{
                'content.authorids': user.profile.id,
                sort: 'cdate',
                details: 'invitation',
              }}
              apiVersion={1}
              ListItem={NoteListItem}
              shouldReload={shouldReload}
              options={allPapersOptions}
            />
          ) : (
            <LoadingSpinner inline />
          )}
        </TabPanel>
        <TabPanel id={tabId}>
          {selectedIds?.length > 0 ? (
            <SubmissionsList
              venueId={venueId}
              query={{
                ids: selectedIds.join(','),
                sort: 'cdate',
                details: 'invitation',
              }}
              apiVersion={1}
              ListItem={NoteListItem}
              options={excludedPapersOptions}
            />
          ) : (
            <p className="empty-message">No {tabLabel.toLowerCase()} to display</p>
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}
