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
import { groupModeToggle } from '../../lib/banner-links'
import { generateGroupWebfieldCode, parseComponentCode } from '../../lib/webfield-utils'
import WebFieldContext from '../../components/WebFieldContext'

const Group = ({ groupId, webfieldCode, writable, componentObj, appContext }) => {
  const { user, userLoading } = useUser()
  const [WebComponent, setWebComponent] = useState(null)
  const [webComponentProps, setWebComponentProps] = useState({})
  const { setBannerHidden, setEditBanner, clientJsLoading, setLayoutOptions } = appContext
  const groupTitle = prettyId(groupId)

  useEffect(() => {
    // Show edit banner
    setBannerHidden(true)
    if (writable) {
      setEditBanner(groupModeToggle('view', groupId))
    }

    if (groupId.endsWith('Editors_In_Chief') || groupId.endsWith('Action_Editors')) {
      setLayoutOptions({ fullWidth: true, minimalFooter: true })
    }
  }, [groupId, writable])

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
        import(`../../components/webfield/${componentObj.component}`).catch((e) => {
          promptError(`Error loading ${componentObj.component}: ${e.message}`)
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
        <title key="title">{`${groupTitle} | OpenReview`}</title>
        <meta
          name="description"
          content={`Welcome to the OpenReview homepage for ${groupTitle}`}
        />
        <meta property="og:title" key="og:title" content={groupTitle} />
        <meta
          property="og:description"
          key="og:description"
          content={`Welcome to the OpenReview homepage for ${groupTitle}`}
        />
      </Head>

      {webfieldCode ? (
        <WebfieldContainer id="group-container" />
      ) : (
        <WebFieldContext.Provider value={webComponentProps}>
          <div id="group-container">
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

Group.getInitialProps = async (ctx) => {
  if (!ctx.query.id) {
    return { statusCode: 400, message: 'Group ID is required' }
  }

  const { token: accessToken, user } = auth(ctx)

  let group
  try {
    const { groups } = await api.get(
      '/groups',
      { id: ctx.query.id },
      { accessToken, remoteIpAddress: ctx.req?.headers['x-forwarded-for'] }
    )
    group = groups?.length > 0 ? groups[0] : null
    if (!group) {
      return { statusCode: 404, message: `The Group ${ctx.query.id} was not found` }
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
      return { statusCode: 403, message: "You don't have permission to read this group" }
    }
    return { statusCode: error.status || 500, message: error.message }
  }

  if (!group.web) {
    group.web = `// Webfield component
return {
  component: 'GroupDirectory',
  properties: {
    title: domain?.content?.title?.value,
    subtitle: domain?.content?.subtitle?.value,
  }
}`
  }

  // Old HTML webfields are no longer supported
  if (group.web.includes('<script type="text/javascript">')) {
    return {
      statusCode: 400,
      message:
        'This group is no longer accessible. Please contact info@openreview.net if you require access.',
    }
  }

  const isWebfieldComponent = group.web.startsWith('// Webfield component')

  // Get venue group to pass to pass to webfield component
  let domainGroup = null
  if (isWebfieldComponent && group.domain !== group.id) {
    try {
      const apiRes = await api.get(
        '/groups',
        { id: group.domain },
        { accessToken, remoteIpAddress: ctx.req?.headers['x-forwarded-for'] }
      )
      domainGroup = apiRes.groups?.length > 0 ? apiRes.groups[0] : null
    } catch (error) {
      domainGroup = null
    }
  } else if (isWebfieldComponent && group.domain === group.id) {
    domainGroup = group
  }

  return {
    groupId: group.id,
    ...(isWebfieldComponent
      ? {
          componentObj: await parseComponentCode(
            group,
            domainGroup,
            user,
            ctx.query,
            accessToken
          ),
        }
      : { webfieldCode: generateGroupWebfieldCode(group, ctx.query) }),
    writable: group.details?.writable ?? false,
  }
}

Group.bodyClass = 'group'

export default withError(Group)
