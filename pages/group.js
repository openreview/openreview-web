import { useEffect } from 'react'
import omit from 'lodash/omit'
import Head from 'next/head'
import LoadingSpinner from '../components/LoadingSpinner'
import WebfieldContainer from '../components/WebfieldContainer'
import withError from '../components/withError'
import api from '../lib/api-client'
import { auth } from '../lib/auth'
import { prettyId } from '../lib/utils'

// Page Styles
import '../styles/pages/group.less'

const Group = ({ groupId, webfieldCode, appContext }) => {
  const { setBannerHidden, clientJsLoading } = appContext
  const groupTitle = prettyId(groupId)

  useEffect(() => {
    setBannerHidden(true)
  }, [])

  useEffect(() => {
    if (clientJsLoading) return

    // eslint-disable-next-line global-require
    window.moment = require('moment')
    // eslint-disable-next-line global-require
    require('moment-timezone')

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
  const { user, token } = auth(ctx)
  const groupRes = await api.get('/groups', { id: ctx.query.id }, { accessToken: token })
  const group = groupRes.groups?.length > 0 ? groupRes.groups[0] : null
  if (!group) {
    return { statusCode: 404, message: 'Group not found' }
  }

  // Old HTML webfields are no longer supported
  if (group.web?.includes('<script type="text/javascript">')) {
    return {
      statusCode: 400,
      message: 'This group is no longer accessible. Please contact info@openreview.net if you require access.',
    }
  }

  const groupTitle = prettyId(group.id)
  const isGroupWritable = group.details?.writable
  const editModeEnabled = ctx.query.mode === 'edit'
  const infoModeEnabled = ctx.query.mode === 'info'
  const showModeBanner = isGroupWritable || infoModeEnabled

  const webfieldCode = group.web || `
    Webfield.ui.setup($('#group-container'), '${group.id}');
    Webfield.ui.header('${prettyId(group.id)}')
      .append('<p><em>Nothing to display</em></p>');`

  const editorCode = isGroupWritable && editModeEnabled && `
    Webfield.ui.setup('#group-container', group.id);
    Webfield.ui.header('${groupTitle}');
    Webfield.ui.groupEditor(group, {
      container: '#notes'
    });`

  const infoCode = (infoModeEnabled || !group.web) && `
    Webfield.ui.setup('#group-container', group.id);
    Webfield.ui.header('${groupTitle}');
    Webfield.ui.groupInfo(group, {
      container: '#notes'
    });`

  const userOrGuest = user || { id: `guest_${Date.now()}`, isGuest: true }
  const groupObjSlim = omit(group, ['web'])
  const inlineJsCode = `
    window.user = ${JSON.stringify(userOrGuest)};
    $(function() {
      var args = ${JSON.stringify(ctx.query)};
      var group = ${JSON.stringify(groupObjSlim)};
      var document = null;
      var window = null;
      var model = {
        tokenPayload: function() {
          return { user: user }
        }
      };

      $('#group-container').empty();

      ${editorCode || infoCode || webfieldCode}

      ${showModeBanner ? 'Webfield.editModeBanner(group.id, args.mode);' : ''}
    });`

  return {
    groupId: group.id,
    webfieldCode: inlineJsCode,
    query: ctx.query,
  }
}

Group.bodyClass = 'group'

export default withError(Group)
