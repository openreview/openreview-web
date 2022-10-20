/* globals promptError: false */
import { useEffect, useState } from 'react'
import without from 'lodash/without'
import Head from 'next/head'
import Router from 'next/router'
import dynamic from 'next/dynamic'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebfieldContainer from '../../components/WebfieldContainer'
import withError from '../../components/withError'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { auth } from '../../lib/auth'
import { prettyId } from '../../lib/utils'
import { invitationModeToggle } from '../../lib/banner-links'
import { generateInvitationWebfieldCode, parseComponentCode } from '../../lib/webfield-utils'
import WebFieldContext from '../../components/WebFieldContext'

const Invitation = ({ invitationId, webfieldCode, writable, componentObj, appContext }) => {
  const { user, userLoading } = useUser()
  const [WebComponent, setWebComponent] = useState(null)
  const [webComponentProps, setWebComponentProps] = useState({})
  const { setBannerHidden, setEditBanner, clientJsLoading } = appContext
  const invitationTitle = prettyId(invitationId)

  useEffect(() => {
    // Show edit banner
    setBannerHidden(true)
    if (writable) {
      setEditBanner(invitationModeToggle('view', invitationId))
    }
  }, [invitationId, writable])

  useEffect(() => {
    if (clientJsLoading || userLoading || !webfieldCode) return

    window.user = user || {
      id: `guest_${Date.now()}`,
      profile: { id: 'guest' },
      isGuest: true,
    }

    const script = document.createElement('script')
    script.innerHTML = webfieldCode
    document.body.appendChild(script)

    // eslint-disable-next-line consistent-return
    return () => {
      document.body.removeChild(script)
      window.user = null
    }
  }, [clientJsLoading, userLoading, user?.id, webfieldCode])

  useEffect(() => {
    if (!componentObj) return

    setWebComponent(
      dynamic(() =>
        import(`../../components/webfield/${componentObj.component}`).catch(() => {
          promptError(`Error loading ${componentObj.component}`)
        })
      )
    )

    const componentProps = {}
    Object.keys(componentObj.properties).forEach((propName) => {
      const prop = componentObj.properties[propName]
      if (typeof prop === 'object' && prop.component) {
        componentProps[propName] = dynamic(() =>
          import(`../../components/webfield/${prop.component}`)
        )
      } else {
        componentProps[propName] = prop
      }
    })
    setWebComponentProps(componentProps)
  }, [componentObj])

  return (
    <>
      <Head>
        <title key="title">{`${invitationTitle} | OpenReview`}</title>
        <meta name="description" content="" />
        <meta property="og:title" key="og:title" content={invitationTitle} />
        <meta property="og:description" key="og:description" content="" />
      </Head>

      {webfieldCode ? (
        <WebfieldContainer id="invitation-container" />
      ) : (
        <WebFieldContext.Provider value={webComponentProps}>
          <div id="invitation-container">
            {WebComponent && webComponentProps ? (
              <WebComponent appContext={appContext} />
            ) : (
              <LoadingSpinner />
            )}
          </div>
        </WebFieldContext.Provider>
      )}
    </>
  )
}

Invitation.getInitialProps = async (ctx) => {
  if (!ctx.query.id) {
    return { statusCode: 400, message: 'Invitation ID is required' }
  }

  // TODO: remove this when migration away from mode param is complete
  const redirectToEditOrInfoMode = (mode) => {
    const redirectUrl = `/invitation/${mode}?id=${ctx.query.id}`
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: redirectUrl }).end()
    } else {
      Router.replace(redirectUrl)
    }
  }

  if (ctx.query.mode === 'edit' || ctx.query.mode === 'info') {
    redirectToEditOrInfoMode(ctx.query.mode)
  }

  const { token: accessToken, user } = auth(ctx)

  try {
    const invitation = await api.getInvitationById(ctx.query.id, accessToken)
    if (!invitation) {
      return { statusCode: 404, message: `The Invitation ${ctx.query.id} was not found` }
    }

    const isWebfieldComponent = invitation.web?.startsWith('// Webfield component')

    // Get venue group to pass to pass to webfield component
    let domainGroup = null
    if (isWebfieldComponent && invitation.domain) {
      const apiRes = await api.get('/groups', { id: invitation.domain }, { accessToken })
      domainGroup = apiRes.groups?.length > 0 ? apiRes.groups[0] : null
    }

    return {
      invitationId: invitation.id,
      ...(isWebfieldComponent
        ? { componentObj: parseComponentCode(invitation, domainGroup, user, ctx.query) }
        : { webfieldCode: generateInvitationWebfieldCode(invitation, ctx.query) }),
      writable: invitation.details?.writable ?? false,
    }
  } catch (error) {
    if (error.name === 'ForbiddenError') {
      if (!accessToken) {
        if (ctx.req) {
          ctx.res
            .writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` })
            .end()
        } else {
          Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
        }
        return {}
      }
      return { statusCode: 403, message: "You don't have permission to read this invitation" }
    }
    return { statusCode: error.status || 500, message: error.message }
  }
}

Invitation.bodyClass = 'invitation'

export default withError(Invitation)
