import Head from 'next/head'
import LoadingSpinner from '../components/LoadingSpinner'

const Tasks = () => (
  <div className="tasks-container">
    <Head>
      <title key="title">Tasks | OpenReview</title>
    </Head>

    <header>
      <h1>Tasks</h1>
    </header>

    <div>
      <LoadingSpinner />
    </div>
  </div>
)

Tasks.bodyClass = 'tasks'

export default Tasks
