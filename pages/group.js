/* eslint-disable global-require */

import { useEffect, useContext } from 'react'
import omit from 'lodash/omit'
import Head from 'next/head'
import { useRouter } from 'next/router'
import UserContext from '../components/UserContext'
import LoadingSpinner from '../components/LoadingSpinner'
import withError from '../components/withError'
import api from '../lib/api-client'
import { auth } from '../lib/auth'
import { prettyId } from '../lib/utils'

// Page Styles
import '../styles/pages/group.less'

const Group = ({ groupId, webfieldCode, appContext }) => {
  const router = useRouter()
  const { user } = useContext(UserContext)
  const { setBannerHidden, clientJsLoading } = appContext

  const handleLinkClick = (e) => {
    // Intercept clicks on links in webfields and use client side routing
    if (e.target.tagName !== 'A' && e.target.parentElement.tagName !== 'A') return

    const href = e.target.getAttribute('href') || e.target.parentElement.getAttribute('href')
    if (!href) return

    if (href.match(/^\/(forum|group|profile)/)) {
      e.preventDefault()
      // Need to manually scroll to top of page after using router.push,
      // see https://github.com/vercel/next.js/issues/3249
      router.push(e.target.getAttribute('href')).then(() => window.scrollTo(0, 0))
    } else if (href.startsWith('#')) {
      router.replace(window.location.pathname + window.location.search + e.target.getAttribute('href'))
    }
  }

  useEffect(() => {
    setBannerHidden(true)
  }, [])

  useEffect(() => {
    if (clientJsLoading) return

    require('mathjax/es5/tex-chtml-full')
    window.moment = require('moment')
    require('moment-timezone')

    const script = document.createElement('script')
    script.innerHTML = `window.user = ${JSON.stringify(user)}; ${webfieldCode}`
    document.body.appendChild(script)

    // eslint-disable-next-line consistent-return
    return () => {
      document.body.removeChild(script)

      // Hide edit mode banner
      if (document.querySelector('#flash-message-container .profile-flash-message')) {
        document.getElementById('flash-message-container').style.display = 'none'
      }
    }
  }, [clientJsLoading])

  return (
    <>
      <Head>
        <title key="title">{`${prettyId(groupId)} | OpenReview`}</title>
      </Head>

      {clientJsLoading && (
        <LoadingSpinner />
      )}

      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div id="group-container" onClick={handleLinkClick} />
    </>
  )
}

Group.getInitialProps = async (ctx) => {
  const { token } = auth(ctx)
  const groupRes = await api.get('/groups', { id: ctx.query.id }, { accessToken: token })
  const group = groupRes.groups && groupRes.groups.length && groupRes.groups[0]
  if (!group) {
    return {
      statusCode: 404,
      message: 'Group not found',
    }
  }

  const groupTitle = prettyId(group.id)
  const isGroupWritable = group.details && group.details.writable
  const editModeEnabled = ctx.query.mode === 'edit'
  const infoModeEnabled = ctx.query.mode === 'info'
  const showModeBanner = isGroupWritable || infoModeEnabled

  const webfieldCode = group.web || `
    Webfield.ui.setup($('#group-container'), '${group.id}');
    Webfield.ui.header('${prettyId(group.id)}')
      .append('<p><em>Nothing to display</em></p>');`
  const groupObjSlim = omit(group, ['web'])
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
  const inlineJsCode = `
    $(function() {
      var args = ${JSON.stringify(ctx.query)};
      var group = ${JSON.stringify(groupObjSlim)};
      var document = null;
      var window = null;

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
