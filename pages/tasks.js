import LoadingSpinner from '../components/LoadingSpinner'

const Tasks = () => (
  <div className="tasks-container">
    <header>
      <h1>Tasks</h1>
    </header>

    <div>
      <LoadingSpinner />
    </div>
  </div>
)

Tasks.title = 'Activity'

export default Tasks
