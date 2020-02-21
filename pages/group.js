import { useEffect, useState, useContext } from 'react'
import omit from 'lodash/omit'
import UserContext from '../components/UserContext'
import LoadingSpinner from '../components/LoadingSpinner'
import withError from '../components/withError'
import api from '../lib/api-client'
import { prettyId } from '../lib/utils'

// Page Styles
import '../styles/pages/group.less'

const Group = ({ webfieldCode, clientJsLoading }) => {
  const { user } = useContext(UserContext)

  useEffect(() => {
    if (clientJsLoading) return

    const script = document.createElement('script')
    script.innerHTML = `window.user = ${JSON.stringify(user)}; ${webfieldCode}`
    document.body.appendChild(script)

    // eslint-disable-next-line consistent-return
    return () => {
      document.body.removeChild(script)
    }
  }, [clientJsLoading])

  return (
    <div id="group-container">
      {clientJsLoading && (
        <LoadingSpinner />
      )}
    </div>
  )
}

Group.getInitialProps = async (ctx) => {
  let group = await api.get('/groups', { id: ctx.query.id })
  group = group.groups && group.groups.length && group.groups[0]
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
    group,
    webfieldCode: inlineJsCode,
    query: ctx.query,
  }
}

const WrappedGroup = withError(Group)
WrappedGroup.title = 'Group'

export default WrappedGroup
