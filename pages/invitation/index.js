/* globals promptError: false */
import { useEffect, useState } from 'react'
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
      if (prop?.component) {
        componentProps[propName] = dynamic(
          () => import(`../../components/webfield/${prop.component}`)
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

  const { token: accessToken, user } = auth(ctx)

  let invitation
  try {
    invitation = await api.getInvitationById(
      ctx.query.id,
      accessToken,
      null,
      null,
      ctx.req?.headers['x-forwarded-for']
    )
    if (!invitation) {
      return { statusCode: 404, message: `The Invitation ${ctx.query.id} was not found` }
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

  const isWebfieldComponent = invitation.web?.startsWith('// Webfield component')

  // Get venue group to pass to pass to webfield component
  let domainGroup = null
  if (isWebfieldComponent && invitation.domain) {
    try {
      const apiRes = await api.get(
        '/groups',
        { id: invitation.domain },
        { accessToken, remoteIpAddress: ctx.req?.headers['x-forwarded-for'] }
      )
      domainGroup = apiRes.groups?.length > 0 ? apiRes.groups[0] : null
    } catch (error) {
      domainGroup = null
    }
  }

  return {
    invitationId: invitation.id,
    ...(isWebfieldComponent
      ? {
          componentObj: await parseComponentCode(
            invitation,
            domainGroup,
            user,
            ctx.query,
            accessToken
          ),
        }
      : { webfieldCode: generateInvitationWebfieldCode(invitation, ctx.query) }),
    writable: invitation.details?.writable ?? false,
  }
}

Invitation.bodyClass = 'invitation'

export default withError(Invitation)
