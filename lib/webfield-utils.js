/* globals view2: false */
import omit from 'lodash/omit'
import without from 'lodash/without'
import { getNumberFromGroup, prettyId } from './utils'

/**
 * Parse component code into a JS object
 *
 * @param {object} entity - entity object
 * @param {object} domain - domain group object
 * @param {object} user - user object
 * @param {object} args - url query parameters
 * @returns object
 */
export function parseComponentCode(entity, domain, user, args) {
  if (!entity.web) return null

  // TODO: run this code in a web worker
  try {
    // eslint-disable-next-line no-new-func
    const componentConfig = Function(
      'entity',
      'domain',
      'user',
      'args',
      `'use strict';\n${entity.web.replace('// Webfield component', '')}`
    )(entity, domain, user, args)

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
  const number = getNumberFromGroup(inv.id.split('/-/')[0], submissionName)
  const invMatchesNumber =
    // submissionNumbers could be string
    // eslint-disable-next-line eqeqeq
    !(number && submissionNumbers) || submissionNumbers.find((p) => p == number)
  return (
    (inv.id.includes(roleName) || inv.invitees?.some((p) => p.includes(roleName))) &&
    invMatchesNumber
  )
}

/**
 * filter note invitations in console tasks tab for replyto
 *
 * @param {object} invitation - invitation to filter
 * @param {string} apiVersion
 * @returns boolean
 */
export function filterHasReplyTo(invitation, apiVersion) {
  if (!invitation.noteInvitation) return true
  return apiVersion === 2
    ? typeof invitation.edit?.note?.replyto === 'string' ||
        invitation.edit?.note?.replyto?.param?.const ||
        typeof invitation.edit?.note?.id === 'string' ||
        invitation.edit?.note?.id?.param?.const
    : invitation.reply.replyto || invitation.reply.referent
}

// #region console query search related functions
class TreeNode {
  constructor(value, left, right) {
    this.value = value
    this.left = left
    this.right = right
  }
}

// find index of match right bracket
// eslint-disable-next-line consistent-return
const getRightBracketIndex = (remainingQuery) => {
  let bracketLevel = 0
  let middleOfOperand = false
  const tokens = [...remainingQuery]
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i]
    if (t === ')') {
      if (bracketLevel === 0) {
        return i
        // eslint-disable-next-line no-else-return
      } else {
        bracketLevel -= 1
      }
    }
    if (t === '(') {
      if (!middleOfOperand) {
        bracketLevel += 1
      }
    }
    if (t === '"') {
      middleOfOperand = !middleOfOperand
    }
  }
}

// parse search query to a tree
const queryToTree = (queryParam) => {
  let currentOperand = null
  let middleOfOperand = false
  let stuffInBrackets = ''
  const query = queryParam.trim()
  const tokens = [...query]
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i]
    if (t === 'A') {
      if (`A${tokens[i + 1]}${tokens[i + 2]}` === 'AND') {
        if (middleOfOperand) {
          currentOperand += 'AND'
          i += 2
          continue // eslint-disable-line no-continue
        } else {
          // eslint-disable-next-line no-lonely-if
          if (stuffInBrackets.length) {
            return new TreeNode(
              'AND',
              queryToTree(stuffInBrackets),
              queryToTree(query.slice(i + 3))
            )
            // eslint-disable-next-line no-else-return
          } else {
            return new TreeNode('AND', currentOperand, queryToTree(query.slice(i + 3)))
          }
        }
      } else {
        currentOperand ? (currentOperand += t) : (currentOperand = t) // eslint-disable-line no-unused-expressions
        continue // eslint-disable-line no-continue
      }
    }
    if (t === 'O') {
      if (`O${tokens[i + 1]}` === 'OR') {
        if (middleOfOperand) {
          currentOperand += 'OR'
          i += 1
          continue // eslint-disable-line no-continue
        } else {
          // eslint-disable-next-line no-lonely-if
          if (stuffInBrackets.length) {
            return new TreeNode(
              'OR',
              queryToTree(stuffInBrackets),
              queryToTree(query.slice(i + 2))
            )
            // eslint-disable-next-line no-else-return
          } else {
            return new TreeNode('OR', currentOperand, queryToTree(query.slice(i + 2)))
          }
        }
      } else {
        currentOperand ? (currentOperand += t) : (currentOperand = t) // eslint-disable-line no-unused-expressions
        continue // eslint-disable-line no-continue
      }
    } else if (t === '(') {
      if (middleOfOperand) {
        currentOperand += t
      } else {
        const lengthToRightBracket = getRightBracketIndex(query.slice(i + 1))
        stuffInBrackets = query.slice(i + 1, i + lengthToRightBracket + 1)
        i = i + lengthToRightBracket + 1
        if (i === query.length - 1) return queryToTree(query.slice(1, -1)) // no more expression
        continue // eslint-disable-line no-continue
      }
    } else if (t === '"' || t === "'") {
      middleOfOperand = !middleOfOperand
    } else {
      currentOperand ? (currentOperand += t) : (currentOperand = t) // eslint-disable-line no-unused-expressions
    }
  }
  return currentOperand
}

// combind two collections by operator AND(intersection) or OR(unique union)
const combineResults = (collection1, collection2, operator, uniqueIdentifier) => {
  if (!collection1) {
    if (!collection2) {
      return []
    }
    return collection2
  }
  if (!collection2) return collection1
  const propertyPath = uniqueIdentifier.includes('.')
    ? uniqueIdentifier.split('.')
    : [uniqueIdentifier]
  switch (operator) {
    case 'OR':
      return [...new Set([...collection1, ...collection2])]
    case 'AND': {
      const collection2UniqueIdentifiers = collection2.map((p) =>
        propertyPath.reduce((r, s) => r?.[s], p)
      )
      return collection1.filter((p) =>
        collection2UniqueIdentifiers.includes(propertyPath.reduce((r, s) => r?.[s], p))
      )
    }
    default:
      return []
  }
}

// extract property to search, the expected value and how the value should be compared
// like =,>,< from string of filtering criteria
const operandToPropertyValue = (operandPram, filterOperators) => {
  const operand = operandPram.trim()
  const filterOperator = filterOperators.find((p) => operand.includes(p))
  if (!filterOperator) throw new Error('operator is invalid')
  const [property, value] = operand.split(filterOperator)
  return {
    property: property.trim(),
    value: value.replace(/"/g, '').trim(),
    filterOperator,
  }
}

const evaluateOperator = (operator, propertyValue, targetValue) => {
  // propertyValue can be number/array/string/obj
  let isString = false
  if (
    propertyValue === null ||
    propertyValue === undefined ||
    targetValue === null ||
    targetValue === undefined
  )
    return false
  // eslint-disable-next-line no-param-reassign
  if (typeof targetValue === 'number' && propertyValue === 'N/A') propertyValue = 0
  if (Array.isArray(propertyValue) && propertyValue.some((p) => p.type === 'reviewer')) {
    // eslint-disable-next-line no-param-reassign
    propertyValue = [
      ...Object.values(propertyValue).map((p) => p.preferredName),
      ...Object.values(propertyValue).map((p) => p.preferredEmail),
    ]
    // eslint-disable-next-line no-param-reassign
    targetValue = targetValue.toString().toLowerCase()
  }
  if (
    !(typeof propertyValue === 'number' && typeof targetValue === 'number') &&
    !Array.isArray(propertyValue)
  ) {
    // eslint-disable-next-line no-param-reassign
    propertyValue = propertyValue.toString().toLowerCase()
    // eslint-disable-next-line no-param-reassign
    targetValue = targetValue.toString().toLowerCase()
    isString = true
  }
  const allowGreaterLessComparison = !(
    typeof propertyValue === 'string' && typeof targetValue === 'string'
  )
  switch (operator) {
    case '=':
      if (Array.isArray(propertyValue))
        return propertyValue.some((p) =>
          p.toString().toLowerCase().includes(targetValue.toString().toLowerCase())
        )
      return isString ? propertyValue.includes(targetValue) : propertyValue === targetValue
    case '>':
      if (allowGreaterLessComparison) return propertyValue > targetValue
      throw new Error('operator is invalid')
    case '<':
      if (allowGreaterLessComparison) return propertyValue < targetValue
      throw new Error('operator is invalid')
    case '>=':
      if (allowGreaterLessComparison) return propertyValue >= targetValue
      throw new Error('operator is invalid')
    case '<=':
      if (allowGreaterLessComparison) return propertyValue <= targetValue
      throw new Error('operator is invalid')
    case '!=':
      if (Array.isArray(propertyValue))
        return !propertyValue.some((p) =>
          p.toString().toLowerCase().includes(targetValue.toString().toLowerCase())
        )
      return propertyValue !== targetValue
    default:
      throw new Error('operator is invalid')
  }
}

// filter a collection by 1 filter criteria
const filterOneOperand = (collections, operand, filterOperators, propertiesAllowed) => {
  if (!operand || operand.trim().length === 0) return null
  const { property, value, filterOperator } = operandToPropertyValue(operand, filterOperators)
  if (!propertiesAllowed[property]) throw new Error('property is invalid')
  const propertyPath =
    propertiesAllowed[property].length === 0
      ? [property] // not a nested property
      : propertiesAllowed[property].map((p) => p.split('.')) // has dot or match multiple properties

  const convertedValue = Number.isNaN(Number(value)) ? value : Number(value)
  return collections.filter((p) => {
    if (propertyPath.length === 1) {
      return evaluateOperator(
        filterOperator,
        propertyPath[0].reduce((r, s) => r?.[s], p),
        convertedValue
      )
    }
    return propertyPath
      .map((q) => q.reduce((r, s) => r?.[s], p))
      .some((t) => evaluateOperator(filterOperator, t, convertedValue))
  })
}

const filterTreeNode = (
  collections,
  treeNode,
  filterOperators,
  propertiesAllowed,
  uniqueIdentifier
) => {
  if (treeNode instanceof TreeNode) {
    return combineResults(
      filterTreeNode(
        collections,
        treeNode.left,
        filterOperators,
        propertiesAllowed,
        uniqueIdentifier
      ),
      filterTreeNode(
        collections,
        treeNode.right,
        filterOperators,
        propertiesAllowed,
        uniqueIdentifier
      ),
      treeNode.value,
      uniqueIdentifier
    )
  }
  // single expression
  return filterOneOperand(collections, treeNode, filterOperators, propertiesAllowed)
}

/**
 * complete the invitation message by replacing {{}} with args
 *
 * @param {Array} collections - the table rows to filter
 * @param {string} filterString - the raw query string
 * @param {Array} filterOperators - the operstors to compare two values, >,<,=,!= etc.
 * @param {object} propertiesAllowed - mapping between the search keyword and corresponding values to search
 * @param {string} uniqueIdentifier - key to combine results from multiple sub query
 * @returns string
 */
export function filterCollections(
  collections,
  filterString,
  filterOperators,
  propertiesAllowed,
  uniqueIdentifier
) {
  try {
    const syntaxTree = queryToTree(filterString)
    const filterResult = filterTreeNode(
      collections,
      syntaxTree,
      filterOperators,
      propertiesAllowed,
      uniqueIdentifier
    )
    return { filteredRows: filterResult }
  } catch (error) {
    return { filteredRows: collections, queryIsInvalid: true }
  }
}
// #endregion

/**
 * get note content of v1 or v2 note
 * extract actual value out of .value
 *
 * @param {object} note
 * @param {boolean} isV2Note
 * @returns object
 */
export function getNoteContent(note, isV2Note) {
  return isV2Note
    ? Object.entries(note?.content ?? {}).reduce(
        (prev, [key, value]) => ({
          ...prev,
          [key]: value?.value,
        }),
        {}
      )
    : note?.content
}

/**
 * get a link to user profile for webfield console
 *
 * @param {string} profileId
 * @param {string} id could be tilde id or email
 * @returns string
 */
export function getProfileLink(profileId, id) {
  if (profileId) return `/profile?id=${profileId}`
  return id.startsWith('~') ? `/profile?id=${id}` : `/profile?email=${id}`
}
