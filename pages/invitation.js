/* eslint-disable global-require */

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

    window.moment = require('moment')
    require('moment-timezone')
    window.datetimepicker = require('../client/bootstrap-datetimepicker-4.17.47.min')

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
        <title key="title">{`${prettyId(invitationId)} | OpenReview`}</title>
      </Head>

      {clientJsLoading && (
        <LoadingSpinner />
      )}

      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div id="invitation-container" onClick={handleLinkClick} />
    </>
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
            var accept = window.confirm('You have chosen to ' + response + ' this invitation. Do you want to continue?' );
            if (accept) {
              $noteEditor.find('button:contains("Submit")').click();
            } else {
              window.location = '/';
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
