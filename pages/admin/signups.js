/* eslint-disable no-use-before-define */
import { useEffect } from 'react'
import Head from 'next/head'
import withAdminAuth from '../../components/withAdminAuth'
import api from '../../lib/api-client'

const Signups = ({ appContext, accessToken }) => {
  const { setBannerHidden } = appContext

  useEffect(() => {
    setBannerHidden(true)
  }, [])

  return (
    <>
      <Head>
        <title key="title">User Moderation | OpenReview</title>
      </Head>
      <header>
        <h1>User Moderation</h1>
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        <p>Moderation is currently <strong>{`${process.env.USER_MODERATION ? 'enabled' : 'disabled'}`}</strong> for new user profiles.</p>
        <hr />
      </header>

      <div className="moderation-container">
        <div className="profiles-list not-moderated">
          <UserModerationQueue accessToken={accessToken} onlyModeration={false} />
        </div>

        <div className="profiles-list under-moderation">
          <UserModerationQueue accessToken={accessToken} />
        </div>
      </div>
    </>
  )
}

const UserModerationQueue = ({ accessToken, onlyModeration = true, pageSize = 15 }) => {
  useEffect(() => {
    getProfiles()
  }, [])

  const getProfiles = async () => {
    const offset = 15
    const options = {
      sort: 'tcdate:desc',
      limit: pageSize,
      offset,
      ...onlyModeration ? { needsModeration: true } : {},
    }
    try {
      const result = await api.get('/profiles', options, { accessToken })
      return {
        profiles: result.profiles,
        totalCount: result.count,
        offset,
      }
    } catch (error) {
      promptError(error.details)
      return {}
    }
  }
  return (
    123
  )
}

export default withAdminAuth(Signups)
