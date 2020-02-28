import Head from 'next/head'
import LoadingSpinner from '../components/LoadingSpinner'

const Activity = () => (
  <div className="activity-container">
    <Head>
      <title key="title">Activity | OpenReview</title>
    </Head>

    <header>
      <h1>Activity</h1>
    </header>

    <div>
      <LoadingSpinner />
    </div>
  </div>
)

Activity.bodyClass = 'activity'

export default Activity
