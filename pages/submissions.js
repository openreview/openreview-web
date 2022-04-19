import Head from 'next/head'
import withError from '../components/withError'
import NoteList from '../components/NoteList'
import PaginationLinks from '../components/PaginationLinks'
import api from '../lib/api-client'
import { prettyId } from '../lib/utils'
import { auth } from '../lib/auth'

const Submissions = ({ groupId, notes, pagination }) => {
  const title = `${prettyId(groupId)} Submissions`
  const displayOptions = {
    pdfLink: false,
    htmlLink: false,
    showContents: false,
  }

  return (
    <div>
      <Head>
        <title key="title">{`${title} | OpenReview`}</title>
      </Head>

      <header className="clearfix">
        <h1>{title}</h1>
        <hr />
      </header>

      <div className="notes">
        <NoteList notes={notes} displayOptions={displayOptions} />
      </div>

      <PaginationLinks
        currentPage={pagination.currentPage}
        itemsPerPage={pagination.notesPerPage}
        totalCount={pagination.totalCount}
        baseUrl={pagination.baseUrl}
        queryParams={pagination.queryParams}
      />
    </div>
  )
}

Submissions.getInitialProps = async (ctx) => {
  const { token } = auth(ctx)
  const groupId = ctx.query.venue
  if (!groupId) {
    return { statusCode: 400, message: 'Missing required parameter venue' }
  }

  const currentPage = Math.max(parseInt(ctx.query.page, 10) || 1, 1)
  const notesPerPage = 25
  const { notes, count } = await api.get(
    '/notes',
    {
      invitation: `${groupId}/.*/-/([Bb]lind_)?[Ss]ubmission`,
      limit: notesPerPage,
      offset: notesPerPage * (currentPage - 1),
    },
    { accessToken: token }
  )
  if (!notes) {
    return {
      statusCode: 400,
      message: 'Venue submissions unavailable. Please try again later',
    }
  }

  const pagination = {
    currentPage,
    notesPerPage,
    totalCount: count,
    baseUrl: '/submissions',
    queryParams: { venue: groupId },
  }
  return { groupId, notes, pagination }
}

Submissions.bodyClass = 'submissions'

export default withError(Submissions)
