/* globals promptError: false */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import uniq from 'lodash/uniq'
import useQuery from '../../hooks/useQuery'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import LoadingSpinner from '../../components/LoadingSpinner'
import EdgeBrowser from '../../components/browser/EdgeBrowser'
import EdgeBrowserHeader from '../../components/browser/EdgeBrowserHeader'
import ErrorDisplay from '../../components/ErrorDisplay'
import api from '../../lib/api-client'
import { parseEdgeList, buildInvitationReplyArr } from '../../lib/edge-utils'
import { referrerLink } from '../../lib/banner-links'

import '../../styles/pages/edge-browser.less'

const Browse = ({ appContext }) => {
  const { user, accessToken, userLoading } = useLoginRedirect()
  const [invitations, setInvitations] = useState(null)
  const [titleInvitation, setTitleInvitation] = useState(null)
  const [maxColumns, setMaxColumns] = useState(-1)
  const [error, setError] = useState(null)
  const query = useQuery()
  const { setBannerHidden, setBannerContent, setLayoutOptions } = appContext

  const notFoundError = {
    name: 'Not Found', message: 'Could not load edge explorer. Invitation not found.', statusCode: 404,
  }
  const forbiddenError = {
    name: 'Forbidden', message: 'You do not have permission to view this invitation.', statusCode: 403,
  }
  const invalidError = {
    name: 'Not Found', message: 'Could not load edge explorer. Invalid edge invitation.', statusCode: 400,
  }
  const unknownError = {
    name: 'Server Error', message: 'Could not load edge explorer.', statusCode: 500,
  }

  useEffect(() => {
    if (userLoading || !query) return

    if (!query.traverse) {
      setError(notFoundError)
      return
    }

    setLayoutOptions({ fullWidth: true, minimalFooter: true })

    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      setBannerHidden(true)
    }

    const startInvitations = parseEdgeList(query.start)
    const traverseInvitations = parseEdgeList(query.traverse)
    const editInvitations = parseEdgeList(query.edit)
    const browseInvitations = parseEdgeList(query.browse)
    const hideInvitations = parseEdgeList(query.hide)
    const allInvitations = traverseInvitations.concat(
      startInvitations, editInvitations, browseInvitations, hideInvitations,
    )
    if (allInvitations.length === 0) {
      setError(invalidError)
      return
    }

    // Use the first traverse invitation as the main group ID
    setTitleInvitation(traverseInvitations[0])
    setMaxColumns(Math.max(Number.parseInt(query.maxColumns, 10), -1) || -1)

    const idsToLoad = uniq(allInvitations.map(i => i.id)).filter(id => id !== 'staticList')
    api.get('/invitations', { ids: idsToLoad.join(','), expired: true, type: 'edges' }, { accessToken })
      .then((apiRes) => {
        if (!apiRes.invitations?.length) {
          setError(invalidError)
          return
        }

        let allValid = true
        allInvitations.forEach((invObj) => {
          const fullInvitation = apiRes.invitations.find((inv) => {
            // For static lists, use the properties of the first traverse invitation
            const invId = invObj.id === 'staticList' ? allInvitations[0].id : invObj.id
            return inv.id === invId
          })
          if (!fullInvitation) {
            setError({
              name: 'Not Found', message: `Could not load edge explorer. Invitation not found: ${invObj.id}`, statusCode: 404,
            })
            allValid = false
            return
          }

          const readers = buildInvitationReplyArr(fullInvitation, 'readers', user.profile.id)
          const writers = buildInvitationReplyArr(fullInvitation, 'writers', user.profile.id) || readers
          const signatures = fullInvitation.reply?.signatures
          const nonreaders = buildInvitationReplyArr(fullInvitation, 'nonreaders', user.profile.id)
          Object.assign(invObj, {
            head: fullInvitation.reply.content.head,
            tail: fullInvitation.reply.content.tail,
            weight: fullInvitation.reply.content.weight,
            // eslint-disable-next-line max-len
            ...fullInvitation.reply.content.defaultWeight && { defaultWeight: fullInvitation.reply.content.defaultWeight },
            label: fullInvitation.reply.content.label,
            readers,
            writers,
            signatures,
            nonreaders,
          })
        })
        if (!allValid) {
          return
        }

        setInvitations({
          startInvitation: startInvitations[0],
          traverseInvitations,
          editInvitations,
          browseInvitations,
          hideInvitations,
          allInvitations,
        })
      })
      .catch((apiError) => {
        if (typeof apiError === 'object' && apiError.name) {
          if (apiError.name === 'Not Found' || apiError.name === 'NotFoundError') {
            setError(notFoundError)
          } else if (apiError.name === 'forbidden' || apiError.name === 'ForbiddenError') {
            setError(forbiddenError)
          }
        } else if (typeof apiError === 'string' && apiError.startsWith('Invitation Not Found')) {
          setError(notFoundError)
        }
        setError(unknownError)
      })
  }, [userLoading, query, user])

  useEffect(() => {
    if (!error) return

    setBannerContent(null)
    setLayoutOptions({ fullWidth: false, minimalFooter: false })
  }, [error])

  if (error) {
    return <ErrorDisplay statusCode={error.statusCode} message={error.message} />
  }

  return (
    <>
      <Head>
        <title key="title">Edge Browser | OpenReview</title>
      </Head>

      <EdgeBrowserHeader invitation={titleInvitation} />

      {invitations ? (
        <EdgeBrowser
          startInvitation={invitations.startInvitation}
          traverseInvitations={invitations.traverseInvitations}
          editInvitations={invitations.editInvitations}
          browseInvitations={invitations.browseInvitations}
          hideInvitations={invitations.hideInvitations}
          maxColumns={maxColumns}
          userInfo={{ userId: user?.id, accessToken }}
        />
      ) : (
        <LoadingSpinner />
      )}
    </>
  )
}

Browse.bodyClass = 'edge-browser'

export default Browse
