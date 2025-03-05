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

const Submissions = ({ group, notes, pagination, appContext }) => {
  const { userLoading } = useUser()

  const title = `${prettyId(group.id)} Submissions`
  const displayOptions = {
    pdfLink: false,
    htmlLink: false,
    showContents: false,
  }
  const { setBannerContent } = appContext

  useEffect(() => {
    if (userLoading || !group.host) return

    setBannerContent(referrerLink(`[${prettyId(group.host)}](/venue?id=${group.host})`))
  }, [userLoading, group.host])

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
  let group
  try {
    const { groups } = await api.get(
      '/groups',
      { id: groupId },
      { accessToken: token, remoteIpAddress: ctx.req?.headers['x-forwarded-for'] }
    )
    group = groups?.length > 0 ? groups[0] : null
  } catch (error) {
    group = null
  }
  if (!group) {
    return { statusCode: 404, message: `The venue ${groupId} could not be found` }
  }

  const getInvitationId = (idToTest) =>
    api
      .get(
        '/invitations',
        { id: idToTest, expired: true },
        {
          accessToken: token,
          version: 1,
          remoteIpAddress: ctx.req?.headers['x-forwarded-for'],
        }
      )
      .then((res) => res.invitations?.[0]?.id || null)
      .catch((err) => null)

  let isV2Group
  let invitationId
  if (group.invitations) {
    isV2Group = true
    invitationId = group.content?.submission_id?.value
  } else {
    isV2Group = false
    const potentialIds = await Promise.all([
      getInvitationId(`${groupId}/-/Blind_Submission`),
      getInvitationId(`${groupId}/-/blind_submission`),
      getInvitationId(`${groupId}/-/Submission`),
      getInvitationId(`${groupId}/-/submission`),
    ])
    invitationId = potentialIds.filter(Boolean)[0]
  }
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
    {
      accessToken: token,
      version: isV2Group ? 2 : 1,
      remoteIpAddress: ctx.req?.headers['x-forwarded-for'],
    }
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
  return { group, notes, pagination }
}

Submissions.bodyClass = 'submissions'

export default withError(Submissions)
