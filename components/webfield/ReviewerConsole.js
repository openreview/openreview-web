import { useContext, useState } from 'react'
import Table from '../Table'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import TaskList from '../TaskList'
import WebFieldContext from '../WebFieldContext'
import BasicHeader from './BasicHeader'
import NoteSummary from './NoteSummary'

const NoteReviewStatus = () => {}

const AssignedPaperRow = ({ note }) => {
  const referrerUrl = ''
  const isV2Note = note.version === 2
  return (
    <tr>
      <td>
        <strong className="note-number">{note.number}</strong>
      </td>
      <td>
        <NoteSummary note={note} referrerUrl={referrerUrl} isV2Note={isV2Note} />
      </td>
      <td>
        <NoteReviewStatus />
      </td>
    </tr>
  )
}

const ReviewerConsole = ({ appContext }) => {
  const { header, venueId, authorName } = useContext(WebFieldContext)
  const [customLoad, setCustomLoad] = useState(null)
  const [blindedNotes, setBlindedNotes] = useState([])
  const [invitations, setInvitations] = useState([])

  return (
    <>
      <BasicHeader
        title={header?.title}
        instructions={header.instructions}
        customLoad={customLoad}
      />
      <Tabs>
        <TabList>
          <Tab id="assigned-papers" active>
            Assigned Papers
          </Tab>
          <Tab id="reviewer-tasks">Reviewer Tasks</Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="assigned-papers">
            {blindedNotes?.length === 0 ? (
              <p className="empty-message">
                You have no assigned papers. Please check again after the paper assignment
                process is complete.
              </p>
            ) : (
              <div className="table-container">
                <Table
                  className="console-table table-striped"
                  headings={[
                    { id: 'number', content: '#' },
                    { id: 'summary', content: 'Paper Summary' },
                    { id: 'ratings', content: 'Your Ratings' },
                  ]}
                >
                  {blindedNotes.map((note) => {
                    const abc = 123
                    return <AssignedPaperRow key={note.id} note={note} />
                  })}
                </Table>
              </div>
            )}
          </TabPanel>
          <TabPanel id="reviewer-tasks">
            <TaskList
              invitations={invitations}
              emptyMessage="No outstanding tasks for this conference"
              referrer={`${encodeURIComponent(
                `[Author Console](/group?id=${venueId}/${authorName}'#author-tasks)`
              )}&t=${Date.now()}`}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default ReviewerConsole
