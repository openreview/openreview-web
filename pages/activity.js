import LoadingSpinner from '../components/LoadingSpinner'

const Activity = () => (
  <div className="activity-container">
    <header>
      <h1>Activity</h1>
    </header>

    <div>
      <LoadingSpinner />
    </div>
  </div>
)

Activity.title = 'Activity'

export default Activity
