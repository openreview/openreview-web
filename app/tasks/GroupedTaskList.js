'use client'

import Accordion from '../../components/Accordion'
import TaskList from '../../components/TaskList'
import HeadingLink from './HeadingLink'

export default function GroupedTaskList({ groupedTasks }) {
  if (!Object.keys(groupedTasks).length)
    return <p className="empty-message">No current pending or completed tasks</p>

  return (
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
        shouldCollapse: true,
      }}
    />
  )
}
