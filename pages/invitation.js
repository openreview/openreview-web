/* eslint-disable global-require */

import { useEffect } from 'react'
import omit from 'lodash/omit'
import without from 'lodash/without'
import Head from 'next/head'
import Router from 'next/router'
import LoadingSpinner from '../components/LoadingSpinner'
import WebfieldContainer from '../components/WebfieldContainer'
import withError from '../components/withError'
import api from '../lib/api-client'
import { auth, isSuperUser } from '../lib/auth'
import { prettyId } from '../lib/utils'

// Page Styles
import '../styles/pages/invitation.less'

const Invitation = ({ invitationId, webfieldCode, appContext }) => {
  const { setBannerHidden, clientJsLoading } = appContext
  const invitationTitle = prettyId(invitationId)

  useEffect(() => {
    setBannerHidden(true)
  }, [invitationId])

  useEffect(() => {
    if (clientJsLoading) return

    window.moment = require('moment')
    require('moment-timezone')
    window.datetimepicker = require('../client/bootstrap-datetimepicker-4.17.47.min')

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
        <title key="title">{`${invitationTitle} | OpenReview`}</title>
        <meta name="description" content="" />
        <meta property="og:title" key="og:title" content={invitationTitle} />
        <meta property="og:description" key="og:description" content="" />
      </Head>

      {clientJsLoading && (
        <LoadingSpinner />
      )}

      <WebfieldContainer id="invitation-container" />
    </>
  )
}

Invitation.getInitialProps = async (ctx) => {
  if (!ctx.query.id) {
    return { statusCode: 400, message: 'Invitation ID is required' }
  }

  const generateWebfieldCode = (invitation, user, mode) => {
    const invitationTitle = prettyId(invitation.id)
    const invitationObjSlim = omit(invitation, 'web', 'process', 'details')
    const isInvitationWritable = invitation.details && invitation.details.writable
    const editModeEnabled = mode === 'edit'
    const infoModeEnabled = mode === 'info'
    const showModeBanner = isInvitationWritable || infoModeEnabled

    const webfieldCode = invitation.web || `
Webfield.ui.setup($('#invitation-container'), '${invitation.id}');
Webfield.ui.header('${prettyId(invitation.id)}')
  .append('<p><em>Nothing to display</em></p>');`

    const editorCode = isInvitationWritable && editModeEnabled && `
Webfield.ui.setup('#invitation-container', invitation.id);
Webfield.ui.header('${invitationTitle}');
Webfield.ui.invitationEditor(invitation, {
  container: '#notes',
  showProcessEditor: ${isSuperUser(user) ? 'true' : 'false'}
});`

    const infoCode = (infoModeEnabled || !invitation.web) && `
Webfield.ui.setup('#invitation-container', invitation.id);
Webfield.ui.header('${invitationTitle}');
Webfield.ui.invitationInfo(invitation, {
  container: '#notes'
});`

    const noteParams = without(Object.keys(ctx.query), 'id', 'mode', 'referrer')
    const noteEditorCode = noteParams.length && `
var runWebfield = function(note) {
  ${webfieldCode}
};

var $noteEditor;
view.mkNoteEditor(
  {
    parent: args.parent,
    content: args
  },
  invitation,
  user,
  {
    onNoteEdited: function(replyNote) {
      $('#invitation-container').empty();
      history.replaceState({}, '', '/invitation?id=' + invitation.id)
      runWebfield(replyNote);
    },
    onNoteCancelled: function(result) {
      location.href = '/';
    },
    onError: function(errors) {
      // If there were errors with the submission display the error and the form
      var errorMsg = (errors && errors.length) ? errors[0] : 'Something went wrong';
      promptError(errorMsg);

      if ($noteEditor) {
        Webfield.ui.setup('#invitation-container', '${invitation.id}');
        Webfield.ui.header('${invitationTitle}');

        $('#invitation').append($noteEditor);
      }
    },
    onCompleted: function(editor) {
      $noteEditor = editor;

      view.hideNoteEditorFields(editor, ['key', 'user']);

      // Second confirmation step for invitations that contains a response parameter
      if (args.response) {
        response = 'unknown';
        if (args.response === 'Yes') {
          response = 'accept';
        } else if (args.response === 'No') {
          response = 'decline';
        }
        if (confirm('You have chosen to ' + response + ' this invitation. Do you want to continue?')) {
          $noteEditor.find('button:contains("Submit")').click();
        } else {
          location.href = '/';
        }
      } else {
        $noteEditor.find('button:contains("Submit")').click();
      }
    }
  }
);`

    const userOrGuest = user || { id: `guest_${Date.now()}`, isGuest: true }
    return `// Webfield Code for ${invitation.id}
window.user = ${JSON.stringify(userOrGuest)};
$(function() {
  var args = ${JSON.stringify(ctx.query)};
  var invitation = ${JSON.stringify(invitationObjSlim)};
  var user = ${JSON.stringify(userOrGuest)};
  var document = null;
  var window = null;

  $('#invitation-container').empty();
  ${showModeBanner ? 'Webfield.editModeBanner(invitation.id, args.mode);' : ''}

  ${editorCode || infoCode || noteEditorCode || webfieldCode}
});
//# sourceURL=webfieldCode.js`
  }

  const { user, token } = auth(ctx)
  try {
    const { invitations } = await api.get('/invitations', { id: ctx.query.id }, { accessToken: token })
    const invitation = invitations?.length > 0 ? invitations[0] : null
    if (!invitation) {
      return { statusCode: 404, message: 'Invitation not found' }
    }

    return {
      invitationId: invitation.id,
      webfieldCode: generateWebfieldCode(invitation, user, ctx.query.mode),
      query: ctx.query,
    }
  } catch (error) {
    if (error.name === 'forbidden') {
      if (!token) {
        if (ctx.req) {
          ctx.res.writeHead(302, { Location: `/login?redirect=${encodeURIComponent(ctx.asPath)}` }).end()
        } else {
          Router.replace(`/login?redirect=${encodeURIComponent(ctx.asPath)}`)
        }
        return {}
      }
      return { statusCode: 403, message: 'You don\'t have permission to read this invitation' }
    }
    return { statusCode: error.status || 500, message: error.message }
  }
}

Invitation.bodyClass = 'invitation'

export default withError(Invitation)
