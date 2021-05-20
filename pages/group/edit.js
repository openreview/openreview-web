/* globals Webfield: false */

import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import ErrorDisplay from '../../components/ErrorDisplay'
import WebfieldContainer from '../../components/WebfieldContainer'
import LoadingSpinner from '../../components/LoadingSpinner'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import useQuery from '../../hooks/useQuery'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'

// Page Styles
import '../../styles/pages/group.less'

export default function GroupEdit({ appContext }) {
  const { accessToken, userLoading } = useLoginRedirect()
  const [group, setGroup] = useState(null)
  const [error, setError] = useState(null)
  const containerRef = useRef(null)

  const router = useRouter()
  const query = useQuery()
  const { setBannerHidden, clientJsLoading } = appContext

  const loadGroup = async (id) => {
    try {
      const { groups } = await api.get('/groups', { id }, { accessToken })
      if (groups?.length > 0) {
        if (groups[0].details?.writable) {
          setGroup({ ...groups[0], web: null })
        } else {
          // User is a reader, not a writer of the group, so redirect to info mode
          router.replace(`/group/info?id=${id}`)
        }
      } else {
        setError({ statusCode: 404, message: 'Group not found' })
      }
    } catch (apiError) {
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  useEffect(() => {
    if (userLoading || !query) return

    setBannerHidden(true)

    if (!query.id) {
      setError({ statusCode: 400, message: 'Missing required parameter id' })
      return
    }

    loadGroup(query.id)
  }, [userLoading, query])

  useEffect(() => {
    if (!group || !containerRef || clientJsLoading) return

    Webfield.editModeBanner(group.id, 'edit')
    Webfield.ui.groupEditor(group, { container: containerRef.current })

    // eslint-disable-next-line consistent-return
    return () => {
      // Hide edit mode banner
      if (document.querySelector('#flash-message-container .profile-flash-message')) {
        document.getElementById('flash-message-container').style.display = 'none'
      }
    }
  }, [clientJsLoading, containerRef, group])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return (
    <>
      <Head>
        <title key="title">{`Edit ${group ? prettyId(group.id) : 'Group'} | OpenReview`}</title>
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

GroupEdit.bodyClass = 'group'
