/* globals view2: false */
import omit from 'lodash/omit'
import without from 'lodash/without'
import * as utils from './utils'
import api from './api-client'

/**
 * Parse component code into a JS object
 *
 * @param {object} entity - entity object
 * @param {object} domain - domain group object
 * @param {object} user - user object
 * @param {object} args - url query parameters
 * @returns object
 */
export async function parseComponentCode(entity, domain, user, args, accessToken) {
  if (!entity.web) return null
  const apiGetWithAccessToken = async (path, data, options) =>
    api.get(path, data, { ...options, accessToken })

  // TODO: run this code in a web worker
  try {
    // eslint-disable-next-line no-new-func
    const componentConfig = await Function(
      'entity',
      'domain',
      'user',
      'args',
      'utils',
      'get',
      `'use strict';\n${entity.web.replace('// Webfield component', '')}`
    )(entity, domain, user, args, utils, apiGetWithAccessToken)

    if (typeof componentConfig !== 'object') {
      return null
    }
    return {
      ...componentConfig,
      properties: {
        ...componentConfig.properties,
        entity: (({ web, members, ...rest }) => rest)(entity),
        args,
        domainContent: domain?.content || {},
      },
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error loading web of ${entity.id}`, error)
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
var OpenBanner ={
  hide: () => {},
  show: () => {},
  welcome: () => {},
  venueHomepageLink: () => {},
  referrerLink: () => {},
  set: () => {},
  clear: () => {},
  forumLink: () => {},
  breadcrumbs: () => {},
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
Webfield.ui.header('${utils.prettyId(invitation.id)}')
  .append('<p><em>Nothing to display</em></p>');`

  const invitationTitle = utils.prettyId(invitation.id)
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
    var OpenBanner ={
      hide: () => {},
      show: () => {},
      welcome: () => {},
      venueHomepageLink: () => {},
      referrerLink: () => {},
      set: () => {},
      clear: () => {},
      forumLink: () => {},
      breadcrumbs: () => {},
    };


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
  return invitationMessage.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    if (key === 'inviter') {
      return utils.prettyId(args[key] ?? match)
    }
    return args[key] ?? match
  })
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
  const number = utils.getNumberFromGroup(inv.id.split('/-/')[0], submissionName)
  const invMatchesNumber =
    // submissionNumbers could be string
    // eslint-disable-next-line eqeqeq
    !(number && submissionNumbers) || submissionNumbers.find((p) => p == number)
  const roleNames = [roleName, ...(roleName.endsWith('s') ? [roleName.slice(0, -1)] : [])]
  return (
    roleNames.some((p) => inv.id.includes(`/${p}`)) ||
    (inv.invitees?.some((p) => roleNames.find((q) => p.includes(`/${q}`))) && invMatchesNumber)
  )
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
  if (Array.isArray(propertyValue)) {
    if (propertyValue.some((p) => p.type === 'profile')) {
      // eslint-disable-next-line no-param-reassign
      propertyValue = [
        ...Object.values(propertyValue).map((p) => p.preferredName),
        ...Object.values(propertyValue).map((p) => p.preferredId),
      ]
      // eslint-disable-next-line no-param-reassign
      if (operator !== '==') targetValue = targetValue.toString().toLowerCase()
    } else if (propertyValue.some((p) => p.type === 'authorObj')) {
      // eslint-disable-next-line no-param-reassign
      propertyValue = [
        ...Object.values(propertyValue).map((p) => p.username),
        ...Object.values(propertyValue).map((p) => p.fullname),
      ] // eslint-disable-next-line no-param-reassign
      if (operator !== '==') targetValue = targetValue.toString().toLowerCase()
    }
  }
  if (
    !(typeof propertyValue === 'number' && typeof targetValue === 'number') &&
    !Array.isArray(propertyValue)
  ) {
    if (operator !== '==') {
      // eslint-disable-next-line no-param-reassign
      propertyValue = propertyValue.toString().toLowerCase()
      // eslint-disable-next-line no-param-reassign
      targetValue = targetValue.toString().toLowerCase()
    }
    isString = true
  }
  const allowGreaterLessComparison = !(
    typeof propertyValue === 'string' && typeof targetValue === 'string'
  )
  switch (operator) {
    case '==':
      if (Array.isArray(propertyValue))
        return propertyValue.some((p) => p?.toString() === targetValue.toString())
      return propertyValue === targetValue
    case '=':
      if (Array.isArray(propertyValue))
        return propertyValue.some((p) =>
          p?.toString().toLowerCase().includes(targetValue.toString().toLowerCase())
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

  let valuePath
  let convertedValue
  if (propertiesAllowed[value]) {
    valuePath =
      propertiesAllowed[property].length === 0
        ? [value]
        : propertiesAllowed[value].map((p) => p.split('.'))
  } else {
    convertedValue = Number.isNaN(Number(value)) ? value : Number(value)
  }
  return collections.filter((p) => {
    if (propertyPath.length === 1) {
      if (!valuePath) {
        return evaluateOperator(
          filterOperator,
          propertyPath[0].reduce((r, s) => r?.[s], p),
          convertedValue
        )
      }
      if (valuePath?.length === 1) {
        return evaluateOperator(
          filterOperator,
          propertyPath[0].reduce((r, s) => r?.[s], p) ?? 0,
          valuePath[0].reduce((r, s) => r?.[s], p) ?? 0
        )
      }
      // valuePath?.length>1
      return valuePath
        .map((q) => q.reduce((r, s) => r?.[s], p))
        .some((t) =>
          evaluateOperator(
            filterOperator,
            propertyPath[0].reduce((r, s) => r?.[s], p),
            t
          )
        )
    }
    if (propertyPath.length > 1 && valuePath?.length > 1) {
      // any match between property and value
      return propertyPath
        .map((q) => q.reduce((r, s) => r?.[s], p))
        .some((t) =>
          valuePath
            .map((q) => q.reduce((r, s) => r?.[s], p))
            .some((u) => evaluateOperator(filterOperator, t, u))
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
 * get link to edge browser
 *
 * @param {string} startQuery
 * @param {Array} invitations - all invitation in console
 * @param {string} invGroup
 * @param {string} invName
 * @param {string} scoresName
 * @param {string} apiVersion
 * @returns string
 */
export function buildEdgeBrowserUrl(
  startQuery,
  invitations,
  invGroup,
  invName,
  scoresName,
  apiVersion = 2
) {
  const invitationId = `${invGroup}/-/${invName}`
  const referrerUrl = `/group${window.location.search}${window.location.hash}`
  const conflictInvitationId = invitations.find((p) => p.id === `${invGroup}/-/Conflict`)?.id
  const scoresInvitationId = invitations.find(
    (p) => p.id === `${invGroup}/-/${scoresName}`
  )?.id

  // Right now this is only showing bids, affinity scores, and conflicts as the
  // other scores invitations + labels are not available in the PC console
  return `/edges/browse${
    startQuery ? `?start=${invitationId},${startQuery}&` : '?'
  }traverse=${invitationId}&edit=${invitationId}&browse=${invitationId}${
    scoresInvitationId ? `;${scoresInvitationId}` : ''
  }${conflictInvitationId ? `;${conflictInvitationId}` : ''}${
    apiVersion === 2 ? '&version=2' : ''
  }&referrer=${encodeURIComponent(`[PC Console](${referrerUrl})`)}`
}

/**
 * get a link to user profile or group page for webfield console
 *
 * @param {string} id could be tilde id or email or group id
 * @returns string
 */
export function getProfileLink(id) {
  if (!id) return null
  if (id.startsWith('~')) return `/profile?id=${id}`
  if (utils.isValidEmail(id)) return `/profile?email=${id}`
  return `/group?id=${id}`
}

/**
 * get const value from invitation content field description
 *
 *
 * @param fieldDescription
 * @returns string
 */
export function getFieldConstValue(fieldDescription) {
  const isConst = (value) => Array.isArray(value) || typeof value === 'string'
  if (!fieldDescription) return null
  if (isConst(fieldDescription)) return fieldDescription
  if (isConst(fieldDescription?.value)) return fieldDescription.value
  if (isConst(fieldDescription?.value?.param?.const)) return fieldDescription.value.param.const
  return null
}

/**
 * get value (label or weight) from an edge based on name
 *
 * @param {object} edge
 * @returns {string|number}
 */
export function getEdgeValue(edge) {
  if (edge.weight == null) return edge.label
  if (edge.label == null) return edge.weight
  return `${edge.label} (${edge.weight})`
}

/**
 * get field name from error path
 *
 * @param {string} errorPath
 * @returns {string}
 */
export function getErrorFieldName(errorPath) {
  if (errorPath === 'signatures') return { fieldName: 'editSignatureInputValues' }
  if (errorPath === 'note/signatures') return { fieldName: 'noteSignatureInputValues' }
  if (errorPath === 'readers') return { fieldName: 'editReaderValues' }
  if (errorPath === 'note/readers') return { fieldName: 'noteReaderValues' }
  if (errorPath === 'note/license') return { fieldName: 'noteLicenseValue' }
  if (errorPath === 'note/pdate') return { fieldName: 'notePDateValue' }
  if (errorPath === 'note/cdate') return { fieldName: 'noteCDateValue' }
  if (errorPath === 'note/mdate') return { fieldName: 'noteMDateValue' }

  if (!errorPath.includes('/')) return { fieldName: errorPath }
  const lastToken = errorPath.split('/').pop()
  if (lastToken === 'value') {
    const fieldName = errorPath.split('/').slice(-2, -1)[0]
    return errorPath.startsWith('note') ? { fieldName } : { fieldName: `content.${fieldName}` }
  }
  if (!Number.isNaN(Number(lastToken))) {
    const fieldName = errorPath.split('/').slice(-3, -2)[0]
    return errorPath.startsWith('note') ? { fieldName } : { fieldName: `content.${fieldName}` }
  }
  if (errorPath.startsWith('note/content')) {
    const tokens = errorPath.split('/')
    const fieldName = tokens[2]
    const index = Number(tokens[4])
    return Number.isFinite(index) ? { fieldName, index } : { fieldName }
  }
  return { fieldName: lastToken }
}

/**
 * convert the value from editor control to the type specified in schema
 *
 * @param {integer|float|string|boolean} value
 * @param {string} targetType
 * @returns {integer|float|string|boolean}
 */
export function convertToType(value, targetType) {
  switch (targetType) {
    case 'integer':
      return parseInt(value, 10)
    case 'float':
      return parseFloat(value)
    case 'string':
      return value.toString()
    case 'boolean':
      return value === 'true'
    default:
      return value
  }
}

/**
 * check if the error invalid value is {delete:true}
 *
 * @param {any} invalidValue
 * @returns {boolean}
 */
export function isNonDeletableError(invalidValue) {
  if (!invalidValue || typeof invalidValue !== 'object') return false
  return JSON.stringify(invalidValue) === JSON.stringify({ delete: true })
}

/**
 * Converts a value to string.
 *
 * @param {any} valueToCast - The value to be converted.
 * @returns {string|undefined} - The converted value.
 */
export function convertToString(valueToCast) {
  if (typeof valueToCast !== 'string' && !Array.isArray(valueToCast)) return undefined
  return Array.isArray(valueToCast) ? valueToCast.join(',') : valueToCast
}

/**
 * Converts a value to array.
 *
 * @param {any} valueToCast - The value to be converted.
 * @returns {string[]|undefined} - The converted value.
 */
export function convertToArray(valueToCast) {
  if (typeof valueToCast !== 'string' && !Array.isArray(valueToCast)) return undefined
  return Array.isArray(valueToCast) ? valueToCast : valueToCast.split(',')
}
