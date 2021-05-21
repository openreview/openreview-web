/* globals Webfield: false */

import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import ErrorDisplay from '../../components/ErrorDisplay'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebfieldContainer from '../../components/WebfieldContainer'
import { prettyId } from '../../lib/utils'

// Page Styles
import '../../styles/pages/group.less'
import useUser from '../../hooks/useUser'

const GroupInfo = ({ appContext }) => {
  const { accessToken, userLoading } = useUser()
  const [error, setError] = useState(null)
  const [group, setGroup] = useState(null)
  const query = useQuery()
  const { setBannerHidden, clientJsLoading } = appContext
  const containerRef = useRef(null)

  const loadGroup = async (id) => {
    try {
      const { groups } = await api.get('/groups', { id }, { accessToken })
      if (groups?.length > 0) {
        setGroup({ ...groups[0], web: null })
      } else {
        setError({ statusCode: 404, message: 'Group not found' })
      }
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  useEffect(() => {
    if (!group || !containerRef || clientJsLoading) return

    Webfield.editModeBanner(group.id, 'info')
    Webfield.ui.groupInfo(group, { container: containerRef.current })

    // eslint-disable-next-line consistent-return
    return () => {
      // Hide edit mode banner
      if (document.querySelector('#flash-message-container .profile-flash-message')) {
        document.getElementById('flash-message-container').style.display = 'none'
      }
    }
  }, [clientJsLoading, containerRef, group])

  useEffect(() => {
    if (userLoading || !query) return

    setBannerHidden(true)

    if (!query.id) {
      setError({ statusCode: 400, message: 'Missing required parameter id' })
      return
    }

    loadGroup(query.id)
  }, [userLoading, query])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />
  return (
    <>
      <Head>
        <title key="title">{`${group ? prettyId(group.id) : 'Group Info'} | OpenReview`}</title>
      </Head>

      {(clientJsLoading || !group) && (
        <LoadingSpinner />
      )}

      <WebfieldContainer id="group-container">
        <div id="header">
          <h1>{prettyId(query?.id)}</h1>
        </div>

        <div id="notes" ref={containerRef} />
      </WebfieldContainer>
    </>
  )
}
GroupInfo.bodyClass = 'group'

export default GroupInfo
