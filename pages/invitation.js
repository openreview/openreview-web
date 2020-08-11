/* eslint-disable global-require */

import { useEffect } from 'react'
import omit from 'lodash/omit'
import without from 'lodash/without'
import Head from 'next/head'
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
  }, [])

  useEffect(() => {
    if (clientJsLoading) return

    window.moment = require('moment')
    require('moment-timezone')
    window.datetimepicker = require('../client/bootstrap-datetimepicker-4.17.47.min')

    // Trigger function set up in getInitialProps to run webfield code
    window.runWebfield()

    // Hide edit mode banner when navigating away from the page
    // eslint-disable-next-line consistent-return
    return () => {
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

      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: webfieldCode }}
      />
    </>
  )
}

Invitation.getInitialProps = async (ctx) => {
  if (!ctx.query.id) {
    return { statusCode: 400, message: 'Invitation ID is required' }
  }
  const { user, token } = auth(ctx)
  const invitationRes = await api.get('/invitations', { id: ctx.query.id }, { accessToken: token })
  const invitation = invitationRes.invitations?.length && invitationRes.invitations[0]
  if (!invitation) {
    return { statusCode: 404, message: 'Invitation not found' }
  }

  const invitationTitle = prettyId(invitation.id)
  const invitationObjSlim = omit(invitation, 'web', 'process', 'details')
  const isInvitationWritable = invitation.details && invitation.details.writable
  const editModeEnabled = ctx.query.mode === 'edit'
  const infoModeEnabled = ctx.query.mode === 'info'
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
    var $noteEditor;
    view.mkNoteEditor(
      {
        parent: args.parent,
        content: args
      },
      invitation,
      user,
      {
        onNoteEdited: function(note) {
          $('#invitation-container').empty();

          ${webfieldCode}
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

            $noteEditor.removeClass('note_editor');  // remove class so top border is visible
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
  const inlineJsCode = `
    window.user = ${JSON.stringify(userOrGuest)};
    function runWebfield() {
      var args = ${JSON.stringify(ctx.query)};
      var invitation = ${JSON.stringify(invitationObjSlim)};
      var user = ${JSON.stringify(userOrGuest)};
      var document = null;
      var window = null;

      $('#invitation-container').empty();

      ${editorCode || infoCode || noteEditorCode || webfieldCode}

      ${showModeBanner ? 'Webfield.editModeBanner(invitation.id, args.mode);' : ''}
    }`

  return {
    invitationId: invitation.id,
    webfieldCode: inlineJsCode,
    query: ctx.query,
  }
}

Invitation.bodyClass = 'invitation'

export default withError(Invitation)
