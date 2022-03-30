import { useEffect } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebfieldContainer from '../../components/WebfieldContainer'
import withError from '../../components/withError'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { auth } from '../../lib/auth'
import { prettyId } from '../../lib/utils'
import { groupModeToggle } from '../../lib/banner-links'

const Group = ({ groupId, webfieldCode, writable, appContext }) => {
  const { user, userLoading } = useUser()
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
    if (clientJsLoading || userLoading) return

    window.user = user || { id: `guest_${Date.now()}`, profile: {}, isGuest: true }

    const script = document.createElement('script')
    script.innerHTML = webfieldCode
    document.body.appendChild(script)

    // eslint-disable-next-line consistent-return
    return () => {
      document.body.removeChild(script)
      window.user = null
    }
  }, [clientJsLoading, userLoading, user?.id, webfieldCode])

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

  const generateWebfieldCode = (group) => {
    const webfieldCode = group.web || `
Webfield.ui.setup($('#group-container'), '${group.id}');
Webfield.ui.header('${prettyId(group.id)}')
  .append('<p><em>Nothing to display</em></p>');`

    const groupObjSlim = { id: group.id }
    return `// Webfield Code for ${groupObjSlim.id}
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
// START GROUP CODE
${webfieldCode}
// END GROUP CODE
});
//# sourceURL=webfieldCode.js`
  }

  const { token } = auth(ctx)
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

    return {
      groupId: group.id,
      webfieldCode: generateWebfieldCode(group),
      writable: group.details?.writable ?? false,
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
