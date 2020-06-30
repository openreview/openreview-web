/* eslint-disable global-require */
/* globals $: false */

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

  useEffect(() => {
    setBannerHidden(true)
  }, [])

  useEffect(() => {
    if (clientJsLoading) return

    window.MathJax = require('../lib/mathjax-config')
    require('mathjax/es5/tex-chtml')
    window.moment = require('moment')
    require('moment-timezone')

    const script = document.createElement('script')
    script.innerHTML = `window.user = ${JSON.stringify(user)}; ${webfieldCode}`
    document.body.appendChild(script)

    // Code to run after webfield has loaded
    setTimeout(() => {
      $('#notes').on('click', 'a[href^="/forum"]', function onClick() {
        router.push($(this).attr('href')).then(() => window.scrollTo(0, 0))
        return false
      })
    }, 500)

    // eslint-disable-next-line consistent-return
    return () => {
      document.body.removeChild(script)
    }
  }, [clientJsLoading])

  return (
    <div id="group-container">
      <Head>
        <title key="title">{`${prettyId(groupId)} | OpenReview`}</title>
      </Head>

      {clientJsLoading && (
        <LoadingSpinner />
      )}
    </div>
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
