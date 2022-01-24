import { useState, useEffect } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import dynamic from 'next/dynamic'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebfieldContainer from '../../components/WebfieldContainer'
import withError from '../../components/withError'
import api from '../../lib/api-client'
import { auth } from '../../lib/auth'
import { prettyId } from '../../lib/utils'
import { generateWebfieldCode, parseComponentCode } from '../../lib/webfield-utils'

const fullWidthGroups = ['.TMLR/Editors_In_Chief']

const Group = ({ groupId, webfieldCode, componentObj, appContext }) => {
  const { setBannerHidden, clientJsLoading, setLayoutOptions } = appContext
  const groupTitle = prettyId(groupId)
  const [GroupComponent, setGroupComponent] = useState(null)
  const [groupComponentProps, setGroupComponentProps] = useState({})

  useEffect(() => {
    setBannerHidden(true)

    if (fullWidthGroups.includes(groupId)) {
      setLayoutOptions({ fullWidth: true, minimalFooter: true })
    }
  }, [groupId])

  useEffect(() => {
    if (clientJsLoading || !webfieldCode) return

    const script = document.createElement('script')
    script.innerHTML = webfieldCode
    document.body.appendChild(script)

    // eslint-disable-next-line consistent-return
    return () => {
      document.body.removeChild(script)

      // Hide edit mode banner
      if (document.querySelector('#flash-message-container .profile-flash-message')) {
        document.getElementById('flash-message-container').style.display = 'none'
      }
    }
  }, [clientJsLoading, webfieldCode])

  useEffect(() => {
    if (!componentObj) return

    setGroupComponent(dynamic(
      () => import(`../../components/Group/${componentObj.component}`),
      { loading: () => <p>Loading...</p> }
    ))

    const componentProps = {}
    Object.keys(componentObj.properties).forEach((propName) => {
      const prop = componentObj.properties[propName]
      if (typeof prop === 'object' && prop.component && prop.properties) {
        const Sub = dynamic(
          () => import(`../../components/Group/${prop.component}`)
        )
        componentProps[propName] = <Sub {...prop.properties} />
      } else {
        componentProps[propName] = prop
      }
    })
    setGroupComponentProps(componentProps)
  }, [componentObj])

  return (
    <>
      <Head>
        <title key="title">{`${groupTitle} | OpenReview`}</title>
        <meta name="description" content={`Welcome to the OpenReview homepage for ${groupTitle}`} />
        <meta property="og:title" key="og:title" content={groupTitle} />
        <meta property="og:description" key="og:description" content={`Welcome to the OpenReview homepage for ${groupTitle}`} />
      </Head>

      {clientJsLoading && (
        <LoadingSpinner />
      )}

      {webfieldCode && (
        <WebfieldContainer id="group-container" />
      )}
      {GroupComponent && groupComponentProps && (
        <div id="group-container">
          <GroupComponent {...groupComponentProps } />
        </div>
      )}
    </>
  )
}

Group.getInitialProps = async (ctx) => {
  if (!ctx.query.id) {
    return { statusCode: 400, message: 'Group ID is required' }
  }

  const redirectToEditOrInfoMode = (mode) => {
    const redirectUrl = `/group/${mode}?id=${encodeURI(ctx.query.id)}`
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: redirectUrl }).end()
    } else {
      Router.replace(redirectUrl)
    }
  }

  // TODO: remove this redirect when all group editor links have been changed
  if (ctx.query.mode === 'edit' || ctx.query.mode === 'info') {
    redirectToEditOrInfoMode(ctx.query.mode)
  }

  const { user, token } = auth(ctx)
  try {
    const { groups } = await api.get('/groups', { id: ctx.query.id }, { accessToken: token })
    const group = groups?.length > 0 ? groups[0] : null
    if (!group) {
      return { statusCode: 404, message: `The Group ${ctx.query.id} was not found` }
    }

    if (!group.web) {
      redirectToEditOrInfoMode('info')
    }
    // Old HTML webfields are no longer supported
    if (group.web?.includes('<script type="text/javascript">')) {
      return {
        statusCode: 400,
        message: 'This group is no longer accessible. Please contact info@openreview.net if you require access.',
      }
    }

    let webfieldCode
    let componentObj
    if (group.component) {
      componentObj = parseComponentCode(group, user, ctx.query)
    } else {
      webfieldCode = generateWebfieldCode(group, user, ctx.query)
    }

    return {
      groupId: group.id,
      webfieldCode,
      componentObj,
      query: ctx.query,
    }
  } catch (error) {
    if (error.name === 'ForbiddenError') {
      if (!token) {
        if (ctx.req) {
          ctx.res.writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` }).end()
        } else {
          Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
        }
        return {}
      }
      return { statusCode: 403, message: 'You don\'t have permission to read this group' }
    }
    return { statusCode: error.status || 500, message: error.message }
  }
}

Group.bodyClass = 'group'

export default withError(Group)
