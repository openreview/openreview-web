import Head from 'next/head'
import { useEffect } from 'react'
import withError from '../components/withError'
import NoteList from '../components/NoteList'
import PaginationLinks from '../components/PaginationLinks'
import api from '../lib/api-client'
import { referrerLink } from '../lib/banner-links'
import { prettyId } from '../lib/utils'
import { auth } from '../lib/auth'
import useUser from '../hooks/useUser'

const Submissions = ({ groupId, notes, pagination, appContext }) => {
  const { userLoading, accessToken } = useUser()

  const title = `${prettyId(groupId)} Submissions`
  const displayOptions = {
    pdfLink: false,
    htmlLink: false,
    showContents: false,
  }
  const { setBannerContent } = appContext

  useEffect(() => {
    if (userLoading) return

    const getHostGroupId = async () => {
      try {
        const { groups } = await api.get('/groups', { id: groupId }, { accessToken })
        return groups?.length > 0 ? groups[0].host : null
      } catch (error) {
        return null
      }
    }

    getHostGroupId().then((hostGroupId) => {
      if (hostGroupId) {
        setBannerContent(referrerLink(`[${prettyId(hostGroupId)}](/venue?id=${hostGroupId})`))
      }
    })
  }, [userLoading, groupId, notes])

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
  const groupId = ctx.query.venue
  if (!groupId) {
    return { statusCode: 400, message: 'Missing required parameter venue' }
  }

  const { token } = auth(ctx)

  const getInvitationId = (idToTest) =>
    api
      .get('/invitations', { id: idToTest, expired: true }, { accessToken: token })
      .then((res) => res.invitations?.[0]?.id || null)
      .catch((err) => null)

  const potentialIds = await Promise.all([
    getInvitationId(`${groupId}/-/Blind_Submission`),
    getInvitationId(`${groupId}/-/blind_submission`),
    getInvitationId(`${groupId}/-/Submission`),
    getInvitationId(`${groupId}/-/submission`),
  ])
  const invitationId = potentialIds.filter(Boolean)[0]
  if (!invitationId) {
    return { statusCode: 400, message: `No submission invitation found for venue ${groupId}` }
  }

  const currentPage = Math.max(parseInt(ctx.query.page, 10) || 1, 1)
  const notesPerPage = 25
  const { notes, count } = await api.get(
    '/notes',
    {
      invitation: invitationId,
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
