import { useEffect } from 'react'
import omit from 'lodash/omit'
import without from 'lodash/without'
import Head from 'next/head'
import Router from 'next/router'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebfieldContainer from '../../components/WebfieldContainer'
import withError from '../../components/withError'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { auth } from '../../lib/auth'
import { prettyId } from '../../lib/utils'
import { invitationModeToggle } from '../../lib/banner-links'

const Invitation = ({ invitationId, webfieldCode, writable, appContext }) => {
  const { user, userLoading } = useUser()
  const { setBannerHidden, setEditBanner, clientJsLoading } = appContext
  const invitationTitle = prettyId(invitationId)

  useEffect(() => {
    // Show edit banner
    setBannerHidden(true)
    if (writable) {
      setEditBanner(invitationModeToggle('view', invitationId))
    }
  }, [invitationId, writable])

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

  // TODO: remove this when migration away from mode param is complete
  const redirectToEditOrInfoMode = (mode) => {
    const redirectUrl = `/invitation/${mode}?id=${ctx.query.id}`
    if (ctx.req) {
      ctx.res.writeHead(302, { Location: redirectUrl }).end()
    } else {
      Router.replace(redirectUrl)
    }
  }

  if (ctx.query.mode === 'edit' || ctx.query.mode === 'info') {
    redirectToEditOrInfoMode(ctx.query.mode)
  }

  const { token: accessToken } = auth(ctx)

  const generateWebfieldCode = (invitation, query) => {
    const invitationTitle = prettyId(invitation.id)
    const invitationObjSlim = omit(invitation, 'web', 'process', 'details', 'preprocess')

    const webfieldCode = invitation.web || `
Webfield.ui.setup($('#invitation-container'), '${invitation.id}');
Webfield.ui.header('${prettyId(invitation.id)}')
  .append('<p><em>Nothing to display</em></p>');`

    const noteParams = without(Object.keys(query), 'id', 'mode', 'referrer', 't')
    const noteEditorCode = noteParams.length && `
var runWebfield = function(note) {
  ${webfieldCode}
};

var $noteEditor;
${invitation.apiVersion === 2 ? 'view2' : 'view'}.mkNoteEditor(
  {
    parent: args.parent,
    content: noteContent,
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

    const noteContent = invitation.apiVersion === 2
      ? noteParams.reduce((acc, key) => { acc[key] = { value: query[key] }; return acc }, {})
      : noteParams.reduce((acc, key) => { acc[key] = query[key]; return acc }, {})

    return `// Webfield Code for ${invitation.id}
$(function() {
  var args = ${JSON.stringify(query)};
  var invitation = ${JSON.stringify(invitationObjSlim)};
  var noteContent = ${JSON.stringify(noteContent)};
  var document = null;
  var window = null;

  $('#invitation-container').empty();

  ${noteEditorCode || `(function(note) {
// START INVITATION CODE
${webfieldCode}
// END INVITATION CODE
  })(null);`}
});
//# sourceURL=webfieldCode.js`
  }

  try {
    const invitation = await api.getInvitationById(ctx.query.id, accessToken)
    if (invitation) {
      return {
        invitationId: invitation.id,
        webfieldCode: generateWebfieldCode(invitation, ctx.query),
        writable: invitation.details?.writable ?? false,
      }
    }
    return { statusCode: 404, message: `The Invitation ${ctx.query.id} was not found` }
  } catch (error) {
    if (error.name === 'ForbiddenError') {
      if (!accessToken) {
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
