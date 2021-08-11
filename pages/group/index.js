import { useEffect } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebfieldContainer from '../../components/WebfieldContainer'
import withError from '../../components/withError'
import api from '../../lib/api-client'
import { auth } from '../../lib/auth'
import { prettyId } from '../../lib/utils'

// Page Styles
import '../../styles/pages/group.less'

const Group = ({ groupId, webfieldCode, appContext }) => {
  const { setBannerHidden, clientJsLoading } = appContext
  const groupTitle = prettyId(groupId)

  useEffect(() => {
    setBannerHidden(true)
  }, [groupId])

  useEffect(() => {
    if (clientJsLoading) return
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

      <WebfieldContainer id="group-container" />
    </>
  )
}

Group.getInitialProps = async (ctx) => {
  if (!ctx.query.id) {
    return { statusCode: 400, message: 'Group ID is required' }
  }

  const redirectToEditOrInfoMode = (mode) => {
    const redirectUrl = `/group/${mode}?id=${ctx.query.id}`
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

  const generateWebfieldCode = (group, user) => {
    const webfieldCode = group.web || `
Webfield.ui.setup($('#group-container'), '${group.id}');
Webfield.ui.header('${prettyId(group.id)}')
  .append('<p><em>Nothing to display</em></p>');`

    const userOrGuest = user || { id: `guest_${Date.now()}`, isGuest: true }
    const groupObjSlim = { id: group.id }
    return `// Webfield Code for ${groupObjSlim.id}
window.user = ${JSON.stringify(userOrGuest)};
$(function() {
  var args = ${JSON.stringify(ctx.query)};
  var group = ${JSON.stringify(groupObjSlim)};
  var document = null;
  var window = null;

  // TODO: remove these vars when all old webfields have been archived
  var model = {
    tokenPayload: function() {
      return { user: user }
    }
  };
  var controller = {
    get: Webfield.get,
    addHandler: function(name, funcMap) {
      Object.values(funcMap).forEach(function(func) {
        func();
      });
    },
  };

  $('#group-container').empty();
  ${group.details?.writable ? 'Webfield.editModeBanner(group.id, args.mode);' : ''}

  ${webfieldCode}
});
//# sourceURL=webfieldCode.js`
  }

  const { user, token } = auth(ctx)
  try {
    const { groups } = await api.get('/groups', { id: ctx.query.id }, { accessToken: token })
    const group = groups?.length > 0 ? groups[0] : null
    if (!group) {
      return { statusCode: 404, message: 'Group not found' }
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

    return {
      groupId: group.id,
      webfieldCode: generateWebfieldCode(group, user, ctx.query.mode),
      query: ctx.query,
    }
  } catch (error) {
    if (error.name === 'forbidden' || error.name === 'ForbiddenError') {
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
