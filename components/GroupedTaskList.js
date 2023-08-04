import Link from 'next/link'
import { inflect, prettyId } from '../lib/utils'
import Accordion from './Accordion'
import TaskList from './TaskList'

const HeadingLink = ({ groupId, groupInfo }) => (
  <div className="heading-link">
    <Link href={`/group?id=${groupId}`} passHref legacyBehavior>
      <h2 onClick={(e) => e.stopPropagation()}>
        <span className="invitation-id">{prettyId(groupId)} </span>
      </h2>
    </Link>
    <span className="task-count-message">{`Show ${inflect(
      groupInfo.numPending,
      'pending task',
      'pending tasks',
      true
    )}${
      groupInfo.numCompleted
        ? ` and ${inflect(groupInfo.numCompleted, 'completed task', 'completed tasks', true)}`
        : ''
    }`}</span>
  </div>
)

const GroupedTaskList = ({ groupedTasks }) => (
  <Accordion
    sections={Object.keys(groupedTasks).map((groupId) => ({
      heading: <HeadingLink groupId={groupId} groupInfo={groupedTasks[groupId]} />,
      body: <TaskList invitations={groupedTasks[groupId].invitations} />,
    }))}
    options={{
      id: 'tasks',
      collapsed: true,
      html: false,
      bodyContainer: '',
    }}
  />
)

export default GroupedTaskList
