/* globals promptError: false */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import uniq from 'lodash/uniq'
import useLoginRedirect from '../../hooks/useLoginRedirect'
import LoadingSpinner from '../../components/LoadingSpinner'
import EdgeBrowser from '../../components/browser/EdgeBrowser'
import EdgeBrowserHeader from '../../components/browser/EdgeBrowserHeader'
import ErrorDisplay from '../../components/ErrorDisplay'
import api from '../../lib/api-client'
import {
  parseEdgeList,
  buildInvitationReplyArr,
  translateFieldSpec,
  translateSignatures,
} from '../../lib/edge-utils'
import { referrerLink } from '../../lib/banner-links'

const Browse = ({ appContext }) => {
  const { user, accessToken } = useLoginRedirect()
  const [version, setVersion] = useState(1)
  const [invitations, setInvitations] = useState(null)
  const [titleInvitation, setTitleInvitation] = useState(null)
  const [maxColumns, setMaxColumns] = useState(-1)
  const [showCounter, setShowCounter] = useState(true)
  const [error, setError] = useState(null)
  const { isReady, query } = useRouter()
  const { setBannerHidden, setBannerContent, setLayoutOptions } = appContext

  const notFoundError = {
    name: 'Not Found',
    message: 'Could not load edge explorer. Invitation not found.',
    statusCode: 404,
  }
  const forbiddenError = {
    name: 'Forbidden',
    message: 'You do not have permission to view this invitation.',
    statusCode: 403,
  }
  const invalidError = {
    name: 'Not Found',
    message: 'Could not load edge explorer. Invalid edge invitation.',
    statusCode: 400,
  }
  const unknownError = {
    name: 'Server Error',
    message: 'Could not load edge explorer.',
    statusCode: 500,
  }

  const loadAllInvitations = async () => {
    const startInvitations = parseEdgeList(query.start, 'start')
    const traverseInvitations = parseEdgeList(query.traverse, 'traverse')
    const editInvitations = parseEdgeList(query.edit, 'edit')
    const browseInvitations = parseEdgeList(query.browse, 'browse')
    const hideInvitations = parseEdgeList(query.hide, 'hide')
    const allInvitations = traverseInvitations.concat(
      startInvitations,
      editInvitations,
      browseInvitations,
      hideInvitations
    )
    if (allInvitations.length === 0) {
      setError(invalidError)
      return
    }

    // Use the first traverse invitation as the main group ID
    setTitleInvitation(traverseInvitations[0])
    setMaxColumns(Math.max(Number.parseInt(query.maxColumns, 10), -1) || -1)
    setShowCounter(query.showCounter ? query.showCounter === 'true' : true)

    const apiVersion = Number.parseInt(query.version, 10)
    setVersion(apiVersion)
    const idsToLoad = uniq(allInvitations.map((i) => i.id)).filter((id) => id !== 'staticList')
    try {
      const apiRes = await api.get(
        '/invitations',
        {
          ids: idsToLoad.join(','),
          expired: true,
          type: apiVersion === 2 ? 'edge' : 'edges',
        },
        { accessToken, version: apiVersion }
      )
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
          // Filter out invalid edit or browse invitations, but don't fail completely
          if (invObj.category === 'edit' || invObj.category === 'browse') {
            // eslint-disable-next-line no-console
            console.error(
              `${invObj.category} invitation ${invObj.id} does not exist or is expired`
            )
            // eslint-disable-next-line no-param-reassign
            invObj.invalid = true
          } else {
            setError({
              name: 'Not Found',
              message: `Could not load edge explorer. Invitation not found: ${invObj.id}`,
              statusCode: 404,
            })
            allValid = false
          }
          return
        }

        const readers = buildInvitationReplyArr(fullInvitation, 'readers', user.profile.id)
        const writers =
          buildInvitationReplyArr(fullInvitation, 'writers', user.profile.id) || readers
        const signatures = translateSignatures(fullInvitation, apiVersion)
        const nonreaders = buildInvitationReplyArr(
          fullInvitation,
          'nonreaders',
          user.profile.id
        )
        Object.assign(invObj, {
          head: translateFieldSpec(fullInvitation, 'head', apiVersion),
          tail: translateFieldSpec(fullInvitation, 'tail', apiVersion),
          weight: translateFieldSpec(fullInvitation, 'weight', apiVersion),
          defaultWeight: translateFieldSpec(fullInvitation, 'weight', apiVersion)?.default,
          label: translateFieldSpec(fullInvitation, 'label', apiVersion),
          defaultLabel: translateFieldSpec(fullInvitation, 'label', apiVersion)?.default,
          readers,
          writers,
          signatures,
          nonreaders,
          domain: fullInvitation?.domain,
        })
      })
      if (!allValid) {
        return
      }

      // user domain of first traverse invitation to look up submission name
      const domainGroupId = apiRes.invitations.find(
        (p) => p.id === traverseInvitations[0].id
      )?.domain
      const domainContent = domainGroupId
        ? (await api.get('/groups', { id: domainGroupId, select: 'content' }, { accessToken }))
            ?.groups?.[0]?.content
        : null

      setInvitations({
        startInvitation: startInvitations[0],
        traverseInvitations,
        editInvitations: editInvitations
          .filter((inv) => !inv.invalid)
          .map((p) => ({ ...p, submissionName: domainContent?.submission_name?.value })),
        browseInvitations: browseInvitations.filter((inv) => !inv.invalid),
        hideInvitations,
        allInvitations: allInvitations.filter((inv) => !inv.invalid),
      })
    } catch (apiError) {
      if (typeof apiError === 'object' && apiError.name) {
        if (apiError.name === 'NotFoundError') {
          setError(notFoundError)
        } else if (apiError.name === 'ForbiddenError') {
          setError(forbiddenError)
        }
      } else if (typeof apiError === 'string' && apiError.startsWith('Invitation Not Found')) {
        setError(notFoundError)
      }
      setError(unknownError)
    }
  }

  useEffect(() => {
    if (!user || !isReady) return

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

    loadAllInvitations()
  }, [user, isReady, query])

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
          version={version}
          startInvitation={invitations.startInvitation}
          traverseInvitations={invitations.traverseInvitations}
          editInvitations={invitations.editInvitations}
          browseInvitations={invitations.browseInvitations}
          hideInvitations={invitations.hideInvitations}
          maxColumns={maxColumns}
          showCounter={showCounter}
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
