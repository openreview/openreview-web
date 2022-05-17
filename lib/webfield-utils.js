/* globals view2: false */
import { cloneDeep, get, intersection, isEmpty, isNil, omit, union, without } from 'lodash'
import { prettyId } from './utils'

/**
 * Parse component code into a JS object
 *
 * @param {object} entity - entity object
 * @param {object} user - user object
 * @param {object} args - url query parameters
 * @returns object
 */
export function parseComponentCode(entity, user, args) {
  if (!entity.webComponent) return null

  // simple config
  if (typeof entity.webComponent === 'object')
    return {
      ...entity.webComponent,
      properties: {
        ...entity.webComponent.properties,
        entity,
        args,
      },
    }

  // TODO: run this code in a web worker
  try {
    // eslint-disable-next-line no-new-func
    const componentConfig = Function(
      'entity',
      'user',
      'args',
      `'use strict'; ${entity.webComponent}`
    )(entity, user, args)
    if (typeof componentConfig !== 'object') {
      return null
    }
    return componentConfig
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return null
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
export function generateGroupWebfieldCode(group, user, args) {
  if (!group.web) return null

  const userOrGuest = user || { id: `guest_${Date.now()}`, isGuest: true }
  const groupObjSlim = { id: group.id }
  return `// Webfield Code for ${groupObjSlim.id}
window.user = ${JSON.stringify(userOrGuest)};
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
${group.details?.writable ? 'Webfield.editModeBanner(group.id, args.mode);' : ''}

${group.web}
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

function getReaders(invitation, readerInputValues, signatures, isEdit = false) {
  let readers
  if (invitation.edit) {
    readers = isEdit ? invitation.edit.readers : invitation.edit.note?.readers
  } else {
    // eslint-disable-next-line prefer-destructuring
    readers = invitation.reply.readers
  }
  let inputValues = [...readerInputValues]

  let invitationValues = []
  if (readers['values-dropdown']) {
    invitationValues = readers['values-dropdown'].map((p) => p.id ?? p)
  } else if (readers['value-dropdown-hierarchy']) {
    invitationValues = readers['value-dropdown-hierarchy']
  } else if (readers['values-checkbox']) {
    invitationValues = readers['values-checkbox']
  } else if (readers.enum) {
    invitationValues = readers.enum.map((p) => p.id ?? p)
  }

  // Add signature if exists in the invitation readers list
  if (signatures && signatures.length && inputValues.includes('everyone') === false) {
    let signatureId = signatures[0]

    // Where the signature is an AnonReviewer and it is not selected in the readers value
    const index = Math.max(
      signatureId.indexOf('AnonReviewer'),
      signatureId.indexOf('Reviewer_')
    )
    if (index >= 0) {
      const reviewersSubmittedId = signatureId.slice(0, index).concat('Reviewers/Submitted')
      const reviewersId = signatureId.slice(0, index).concat('Reviewers')

      if (
        isEmpty(intersection(inputValues, [signatureId, reviewersSubmittedId, reviewersId]))
      ) {
        if (invitationValues.includes(signatureId)) {
          inputValues.push(signatureId)
        } else if (invitationValues.includes(reviewersSubmittedId)) {
          inputValues = union(inputValues, [reviewersSubmittedId])
        } else if (invitationValues.includes(reviewersId)) {
          inputValues = union(inputValues, [reviewersId])
        }
      }
    } else {
      const acIndex = Math.max(
        signatureId.indexOf('Area_Chair1'),
        signatureId.indexOf('Area_Chair_')
      )
      if (acIndex >= 0) {
        signatureId = signatureId.slice(0, acIndex).concat('Area_Chairs')
      }

      if (invitationValues.includes(signatureId)) {
        inputValues = union(inputValues, [signatureId])
      }
    }
  }

  return inputValues
}

function replaceCopiedValues(content, invitationReplyContent, original) {
  Object.entries(invitationReplyContent).forEach(([key, value]) => {
    if (value['value-copied']) {
      // some of the field values are surrounded by curly brackets, remove them
      const field = value['value-copied'].replace(/{|}/g, '')
      // eslint-disable-next-line no-param-reassign
      content[key] = get(value, 'value-copied')
    }

    if (value['values-copied']) {
      // some of the field values are surrounded by curly brackets, remove them
      const values = value['values-copied']
      values.forEach((p) => {
        if (p.startsWith('{')) {
          const field = value.slice(1, -1)
          let fieldValue = get(original, field)
          if (!Array.isArray(fieldValue)) {
            fieldValue = [fieldValue]
          }
          // eslint-disable-next-line no-param-reassign
          content[key] = union(content[key] || [], fieldValue)
        } else {
          // eslint-disable-next-line no-param-reassign
          content[key] = union(content[key] || [], [p])
        }
      })
    }

    if (typeof value === 'object' && !isNil(content)) {
      replaceCopiedValues(content[key], value, original)
    }
  })
}

function getCopiedValues(note, invitationReply) {
  const noteCopy = cloneDeep(note)
  replaceCopiedValues(noteCopy, invitationReply, note)
  return noteCopy
}

/**
 * Generate note to post for recruitment invitation based on form content
 *
 * @param {object} invitation - invitation object
 * @param {object} user - user object
 * @param {object} content - form content
 * @returns object
 */
export function constructRecruitmentResponseNote(invitation, content) {
  if (invitation.apiVersion === 2)
    return view2.constructEdit({
      formData: content,
      invitationObj: invitation,
    })

  const signatures = ['(anonymous)']
  const writers = invitation.reply.writers.values
  const readers = getReaders(invitation, [], signatures)
  const editNote = {
    content,
    readers,
    nonreaders: null,
    signatures,
    writers,
    invitation: invitation.id,
  }
  return getCopiedValues(editNote, invitation.reply)
}
