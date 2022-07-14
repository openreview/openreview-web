/* globals view2: false */
import omit from 'lodash/omit'
import without from 'lodash/without'
import { getNumberFromGroup, prettyId } from './utils'

/**
 * Parse component code into a JS object
 *
 * @param {object} entity - entity object
 * @param {object} user - user object
 * @param {object} args - url query parameters
 * @returns object
 */
export function parseComponentCode(entity, user, args) {
  if (!entity.web) return null

  // TODO: run this code in a web worker
  try {
    // eslint-disable-next-line no-new-func
    const componentConfig = Function(
      'entity',
      'user',
      'args',
      `'use strict'; ${entity.web.replace('// Webfield component', '')}`
    )(entity, user, args)

    if (typeof componentConfig !== 'object') {
      return null
    }
    return {
      ...componentConfig,
      properties: {
        ...componentConfig.properties,
        entity: (({ web, members, ...rest }) => rest)(entity),
        args,
      },
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    throw new Error('web is invalid')
  }
}

/**
 * Generate complete code to run from a basic group webfield string
 *
 * @param {object} group - group object
 * @param {object} user - user object
 * @param {object} args - url query parameters
 * @returns string
 */
export function generateGroupWebfieldCode(group, args) {
  if (!group.web) return null

  const groupObjSlim = { id: group.id }
  return `// Webfield Code for ${groupObjSlim.id}
$(function() {
var args = ${JSON.stringify(args)};
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
${group.web}
// END GROUP CODE
});
//# sourceURL=webfieldCode.js`
}

/**
 * Generate complete code to run from a basic invitation webfield string
 *
 * @param {object} invitation - invitation object
 * @param {object} user - user object
 * @param {object} query - url query parameters
 * @returns string
 */
export function generateInvitationWebfieldCode(invitation, query) {
  const webfieldCode =
    invitation.web ||
    `
Webfield.ui.setup($('#invitation-container'), '${invitation.id}');
Webfield.ui.header('${prettyId(invitation.id)}')
  .append('<p><em>Nothing to display</em></p>');`

  const invitationTitle = prettyId(invitation.id)
  const invitationObjSlim = omit(invitation, 'web', 'process', 'details', 'preprocess')
  const noteParams = without(Object.keys(query), 'id', 'mode', 'referrer', 't')
  const noteContent =
    invitation.apiVersion === 2
      ? noteParams.reduce((acc, key) => {
          acc[key] = { value: query[key] }
          return acc
        }, {})
      : noteParams.reduce((acc, key) => {
          acc[key] = query[key]
          return acc
        }, {})

  const noteEditorCode =
    noteParams.length &&
    `
var runWebfield = function(note) {
  ${invitation.web ?? ''}
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
  return `// Webfield Code for ${invitation.id}
  $(function() {
    var args = ${JSON.stringify(query)};
    var invitation = ${JSON.stringify(invitationObjSlim)};
    var noteContent = ${JSON.stringify(noteContent)};
    var document = null;
    var window = null;

    $('#invitation-container').empty();

    ${
      noteEditorCode ||
      `(function(note) {
  // START INVITATION CODE
  ${webfieldCode}
  // END INVITATION CODE
    })(null);`
    }
  });
  //# sourceURL=webfieldCode.js`
}

/**
 * complete the invitation message by replacing {{}} with args
 *
 * @param {string} invitationMessage - markdown message to show in recuritment form
 * @param {object} args - url query args
 * @returns string
 */
export function translateInvitationMessage(invitationMessage, args) {
  if (!args || Object.values(args).some((p) => typeof p !== 'string')) return invitationMessage
  return invitationMessage.replace(/\{\{([^}]+)\}\}/g, (match, key) => args[key] ?? match)
}

/**
 * filter invitations for console tasks tab
 * modified from getAssignedInvitations.filterInviteeAndNumbers in webfield-v2.js
 *
 * @param {object} inv - invitation to filter
 * @param {string} roleName - revirew/ac/ae...
 * @param {string} submissionName
 * @param {Array} submissionNumbers - number of assigned submissions in console
 * @returns string
 */
export function filterAssignedInvitations(inv, roleName, submissionName, submissionNumbers) {
  var number = getNumberFromGroup(inv.id.split('/-/')[0], submissionName)
  var invMatchesNumber =
    !(number && submissionNumbers) || submissionNumbers.find((p) => p == number) // submissionNumbers could be string
  return (
    (inv.id.includes(roleName) || inv.invitees?.some((p) => p.includes(roleName))) &&
    invMatchesNumber
  )
}
