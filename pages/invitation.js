/* eslint-disable global-require */
/* globals $: false */

import { useEffect, useContext } from 'react'
import omit from 'lodash/omit'
import without from 'lodash/without'
import Head from 'next/head'
import { useRouter } from 'next/router'
import UserContext from '../components/UserContext'
import LoadingSpinner from '../components/LoadingSpinner'
import withError from '../components/withError'
import api from '../lib/api-client'
import { auth, isSuperUser } from '../lib/auth'
import { prettyId } from '../lib/utils'

// Page Styles
import '../styles/pages/invitation.less'

const Invitation = ({ invitationId, webfieldCode, appContext }) => {
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
    window.datetimepicker = require('../client/bootstrap-datetimepicker-4.17.47.min')

    const script = document.createElement('script')
    script.innerHTML = `window.user = ${JSON.stringify(user)};\n${webfieldCode}`
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
    <div id="invitation-container">
      <Head>
        <title key="title">{`${prettyId(invitationId)} | OpenReview`}</title>
      </Head>

      {clientJsLoading && (
        <LoadingSpinner />
      )}
    </div>
  )
}

Invitation.getInitialProps = async (ctx) => {
  const { user, token } = auth(ctx)
  const invitationRes = await api.get('/invitations', { id: ctx.query.id }, { accessToken: token })
  const invitation = invitationRes.invitations?.length && invitationRes.invitations[0]
  if (!invitation) {
    return {
      statusCode: 404,
      message: 'Invitation not found',
    }
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
          history.replaceState({ id: args.id }, 'invitation', '/invitation?id=' + args.id);

          $('#invitation-container').empty();
          runWebfield(replyNote);
        },
        onNoteCancelled: function(result) {
          replaceWithHome();
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
              location = '/';
            }
          } else {
            $noteEditor.find('button:contains("Submit")').click();
          }
        }
      }
    );`

  const inlineJsCode = `
    $(function() {
      var args = ${JSON.stringify(ctx.query)};
      var invitation = ${JSON.stringify(invitationObjSlim)};
      var user = ${JSON.stringify(user)};
      var document = null;
      var window = null;

      $('#invitation-container').empty();

      ${editorCode || infoCode || noteEditorCode || webfieldCode}

      ${showModeBanner ? 'Webfield.editModeBanner(invitation.id, args.mode);' : ''}
    });`

  return {
    invitationId: invitation.id,
    webfieldCode: inlineJsCode,
    query: ctx.query,
  }
}

Invitation.bodyClass = 'invitation'

export default withError(Invitation)
