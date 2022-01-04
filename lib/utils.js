/* eslint-disable no-else-return */

import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import isObject from 'lodash/isObject'
import isNil from 'lodash/isNil'
import map from 'lodash/map'
import countBy from 'lodash/countBy'
import sortBy from 'lodash/sortBy'
import findIndex from 'lodash/findIndex'
import upperFirst from 'lodash/upperFirst'
import omit from 'lodash/omit'
import cloneDeep from 'lodash/cloneDeep'
import deburr from 'lodash/deburr'

/**
 * Get the human readable version of a group or profile id
 *
 * @param {string} id - group or profile id to convert
 * @param {boolean} [onlyLast] - don't include Paper# token in output
 */
export function prettyId(id, onlyLast) {
  const lowercaseExceptions = [
    'conference',
    'workshop',
    'submission',
    'recommendation',
    'paper',
    'review',
    'reviewer',
    'reviewers',
    'official',
    'public',
    'meta',
    'comment',
    'question',
    'acceptance',
    'pcs',
    'affinity',
    'bid',
    'tpms',
  ]

  if (!id) {
    return ''
  } else if (id.indexOf('~') === 0 && id.length > 1) {
    return id.substring(1).replace(/_|\d+/g, ' ').trim()
  } else if (id === 'everyone') {
    return 'Everyone'
  } else if (id === '(anonymous)' || id === '(guest)') {
    return id
  } else {
    let tokens = id.split('/')
    if (onlyLast) {
      const sliceIndex = findIndex(tokens, token => token.match(/^[pP]aper\d+$/))
      tokens = tokens.slice(sliceIndex === -1 ? -1 : sliceIndex + 1)
    }

    const transformedId = tokens
      .map((token) => {
        // API v2 tokens can include strings like ${note.number}
        if (token.includes('${')) {
          return token.replace(/\$\{(\S+)\}/g, (match, p1) => ` {${p1.split('.').pop()}}`)
            .replace(/_/g, ' ')
        }

        let transformedToken = token
          .replace(/^\./g, '') // journal names start with '.'
          .replace(/\..+/g, '') // remove text after dots, ex: uai.org
          .replace(/^-$/g, '') // remove dashes
          .replace(/_/g, ' ') // replace undescores with spaces

        // if the letters in the token are all lowercase, replace it with empty string
        const lettersOnly = token.replace(/\d|\W/g, '')
        if (lettersOnly && lettersOnly === lettersOnly.toLowerCase()
          && lowercaseExceptions.indexOf(token) < 0) {
          transformedToken = ''
        }

        return transformedToken
      })
      .filter(formattedToken => formattedToken)
      .join(' ')

    return transformedId || id
  }
}

/**
 * Get the human readable version of an invitation id
 *
 * @param {string} id - invitation id to convert
 */
export function prettyInvitationId(id) {
  if (!id) {
    return ''
  }

  // Only take last 2 parts of the invitation
  const tokens = id.split('/').slice(-2)

  return tokens
    // eslint-disable-next-line arrow-body-style
    .map((token) => {
      return token
        .replace(/^-$/g, '') // remove dashes
        .replace(/^.*\d$/g, '') // remove tokens ending with a digit
        .replace(/_/g, ' ') // replace undescores with spaces
        .trim()
    })
    .filter(formattedToken => formattedToken)
    .join(' ')
}

/**
 * Get the human readable version of a note content object's field
 *
 * @param {string} fieldName - content field to convert
 */
export function prettyField(fieldName) {
  return fieldName
    .replace(/_/g, ' ')
    .split(' ')
    .map(upperFirst)
    .join(' ')
    .trim()
}

/**
 * Get the human readable version of a note content object's field
 *
 * @param {string} fieldName - content field to convert
 */
export function prettyContentValue(val) {
  const valType = typeof val
  if (valType === 'string') {
    return val.trim()
  }
  if (valType === 'number' || valType === 'boolean') {
    return val.toString()
  }
  if (Array.isArray(val)) {
    if (isObject(val[0])) {
      return JSON.stringify(val, undefined, 4).replace(/"/g, '')
    } else {
      return val.join(', ')
    }
  }
  if (isObject(val)) {
    return JSON.stringify(val, undefined, 4).replace(/"/g, '')
  }

  // null, undefined, function, symbol, etc.
  return ''
}

/**
 * Get the human readable version of an array of group ids
 *
 * @param {string[]} idList - list of ids to format
 */
export function prettyList(idList) {
  if (!Array.isArray(idList) || !idList.length) {
    return ''
  }

  const prettyArr = idList.map(id => prettyId(id))
  if (prettyArr.length === 1) {
    return prettyArr[0]
  }
  return `${prettyArr.slice(0, -1).join(',')} and ${prettyArr.slice(-1)}`
}

/**
 * Get group ID from given invitation ID
 *
 * @param {string} invitationId
 */
export function getGroupIdfromInvitation(invitationId) {
  // All invitation IDs should have the form group_id/-/invitation_name
  const parts = invitationId.split('/-/')

  if (parts.length === 1) {
    // Invalid invitation
    return null
  }
  return parts[0]
}

/**
 * Get name of conference from raw bibtex string
 *
 * @param {string} bibtex
 */
export function getConferenceName(bibtex) {
  if (!bibtex) return null

  const startPos = bibtex.indexOf('booktitle')
  if (startPos === -1) return null

  return bibtex.substring(
    bibtex.indexOf('{', startPos) + 1,
    bibtex.indexOf('}', startPos),
  )
}

const orderCache = {}

/**
 * Get order of note content fields from invitation reply object
 *
 * @param {object} replyContent - invitation.reply.content
 * @param {string} invitationId - used as a key for the order cache
 */
export function orderReplyFields(replyContent, invitationId) {
  if (invitationId && orderCache[invitationId]) {
    return orderCache[invitationId]
  }

  const orderedFields = map(
    sortBy(
      map(replyContent, (fieldProps, fieldName) => ({
        field: fieldName,
        order: fieldProps.order,
      })),
      ['order'],
    ),
    'field',
  )
  if (invitationId) {
    orderCache[invitationId] = orderedFields
  }

  return orderedFields
}

/**
 * Convert timestamp stored in the database to human readable date
 *
 * @param {number} timestamp - the timestamp to convert
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return null

  const date = new Date(timestamp)
  return date.toLocaleDateString('en-GB', {
    hour: 'numeric',
    minute: 'numeric',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZoneName: 'long',
  })
}

/**
 * Get the formatted display date for a forum based on all the available timestamps
 *
 * @param {timestamp} createdDate
 * @param {timestamp} trueCreatedDate
 * @param {timestamp} modifiedDate
 * @param {timestamp} trueModifiedDate
 * @param {number} createdYear - optional, only available for some notes
 */
export function forumDate(
  createdDate, trueCreatedDate, modifiedDate, trueModifiedDate, createdYear,
) {
  const mdateSettings = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }
  const cdateSettings = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }

  const cdate = createdDate || trueCreatedDate || Date.now()
  const hasYear = (typeof createdYear === 'string' && createdYear.length)
    || (typeof createdYear === 'number' && createdYear > 0)
  const cdateObj = hasYear
    ? new Date(createdYear)
    : new Date(cdate)

  // if the cdateObj lacks the precision to represent days/months,
  // remove them from cdateSettings. For some reason, dates are 1-indexed
  if (cdateObj.getUTCSeconds() === 0
    && cdateObj.getUTCMinutes() === 0
    && cdateObj.getUTCHours() === 0
    && cdateObj.getUTCDate() === 1) {
    delete cdateSettings.day

    if (cdateObj.getUTCMonth() === 0) {
      delete cdateSettings.month
      cdateSettings.timeZone = 'UTC'
    }
  }

  const cdateFormatted = cdateObj.toLocaleDateString('en-US', cdateSettings)
  const mdate = modifiedDate || trueModifiedDate
  const formatDate = d => new Date(d).toLocaleDateString('en-US', mdateSettings)

  let mdateFormatted = ''
  if (hasYear && cdate === mdate) {
    mdateFormatted = ` (imported ${formatDate(cdate)})`
  } else if (cdate < trueCreatedDate && trueCreatedDate === trueModifiedDate) {
    mdateFormatted = ` (imported ${formatDate(mdate)})`
  } else if (mdate && cdate !== mdate) {
    mdateFormatted = ` (edited ${formatDate(mdate)})`
  }

  return cdateFormatted + mdateFormatted
}

/**
 * Generate a title for a note based on just the note invitation and signatures
 *
 * @param {string} invitationId - invitation ID of note
 * @param {string[]} signatures - note signatures
 */
export function buildNoteTitle(invitationId, signatures) {
  const formattedInvitation = prettyInvitationId(invitationId)
  const signature = signatures.length === 0 ? '' : prettyId(signatures[0], true)
  const signatureMatches = signature.match(/^(Paper\d+) (.+)$/)
  const invMatches = invitationId.match(/\/(Paper\d+)\//)

  let suffix
  if ((invMatches || signatureMatches)
    && formattedInvitation.toLowerCase().includes('review')) {
    const paper = invMatches ? invMatches[1] : signatureMatches[1]
    const signatureWithoutPaper = signatureMatches ? signatureMatches[2] : signature
    suffix = ` of ${paper} by ${signatureWithoutPaper}`
  } else {
    suffix = ` by ${signature}`
  }
  return formattedInvitation + suffix
}

/**
 * Clone a assignment config note object and update title and status
 *
 * @param {object} note - the assignment note to clone
 */
export function cloneAssignmentConfigNote(note) {
  let titleSplit = (note.content.title || note.content.label).split('-')
  const titleSuffix = parseInt(titleSplit[titleSplit.length - 1], 10)
  if (Number.isNaN(titleSuffix)) {
    titleSplit.push(1)
  } else {
    titleSplit = titleSplit.slice(0, -1)
    titleSplit.push(titleSuffix + 1)
  }

  const clone = omit(cloneDeep(note), ['id', 'cdate', 'forum', 'number', 'tcdate', 'tmdate', '_id'])
  clone.content.status = 'Initialized'
  clone.content.error_message = ''
  clone.content.randomized_fraction_of_opt = ''
  clone.content.title = titleSplit.join('-')
  return clone
}

/**
 * Returns an object with the keys being all the fields that are different between
 * the content objects of the two provided notes.
 *
 * @param {object} leftNote - first note object
 * @param {object} rightNote - second note object
 */
export function noteContentDiff(leftNote, rightNote) {
  const allContentKeys = Array.from(new Set([...Object.keys(leftNote.content), ...Object.keys(rightNote.content)]))
    .filter(key => !key.startsWith('_') && key !== 'pdf' && key !== 'paperhash')

  return allContentKeys.reduce((result, key) => {
    if (!isEqual(leftNote.content[key], rightNote.content[key])) {
      const value1 = isNil(leftNote.content[key]) ? null : leftNote.content[key]
      const value2 = isNil(rightNote.content[key]) ? null : rightNote.content[key]

      // eslint-disable-next-line no-param-reassign
      result[key] = { left: value1, right: value2 }
    }
    return result
  }, {})
}

/**
 * Returns an object with the keys being all the fields that are different between
 * the content objects of the two provided edits.
 *
 * @param {object} leftEdit - first edit object
 * @param {object} rightEdit - second edit object
 */
export function editNoteContentDiff(leftEdit, rightEdit) {
  const dateKeys = ['cdate', 'tcdate', 'mdate', 'tmdate']
  const omitKeys = ['mdate', 'tmdate', 'note.content.pdf', 'note.content.paperhash']

  const getAllKeys = (fieldValue, prefixParam = null) => {
    const keys = []
    Object.keys(fieldValue ?? {}).forEach((key) => {
      const prefix = prefixParam ? `${prefixParam}.${key}` : key
      if (typeof fieldValue[key] === 'object' && !Array.isArray(fieldValue[key])) {
        keys.push(...getAllKeys(fieldValue[key], prefix))
        return
      }
      keys.push(prefix)
    })
    return keys
  }

  const formatValue = (key, value) => {
    if (isNil(value)) return null
    if (key.split('.').some(p => dateKeys.includes(p))) return formatTimestamp(value)
    return value
  }

  const constructDiff = keys => keys.reduce((result, key) => {
    let leftValue = key.split('.').reduce((p, q) => p?.[q], leftEdit)
    let rightValue = key.split('.').reduce((p, q) => p?.[q], rightEdit)
    if (Array.isArray(leftValue)) leftValue = leftValue.sort()
    if (Array.isArray(rightValue)) rightValue = rightValue.sort()

    if (!isEqual(leftValue, rightValue)) {
      // eslint-disable-next-line no-param-reassign
      result[key] = { left: formatValue(key, leftValue), right: formatValue(key, rightValue) }
    }
    return result
  }, {})

  const allKeys = Array.from(new Set([...getAllKeys(leftEdit), ...getAllKeys(rightEdit)]))
    .map(p => p.toLowerCase())
    .filter(key => !key.startsWith('_') && omitKeys.includes(key) === false)

  const editNoteDifference = constructDiff(allKeys.filter(p => p.startsWith('note.') && !p.startsWith('note.content.')))
  const editNoteContentDifference = constructDiff(allKeys.filter(p => p.startsWith('note.content.')))
  const otherEditDifference = constructDiff(allKeys.filter(p => !p.startsWith('note.')))
  return { edit: otherEditDifference, editNote: editNoteDifference, editNoteContent: editNoteContentDifference }
}

/**
 * General utility function to pluralize any english word. Based on answer here:
 * https://stackoverflow.com/a/27194360/125836
 *
 * @param {string} word - word or phrase to pluralize
 */
export function pluralizeString(word) {
  if (typeof word !== 'string') return null

  const plural = {
    '(quiz)$': '$1zes',
    '^(ox)$': '$1en',
    '([m|l])ouse$': '$1ice',
    '(matr|vert|ind)ix|ex$': '$1ices',
    '(x|ch|ss|sh)$': '$1es',
    '([^aeiouy]|qu)y$': '$1ies',
    '(hive)$': '$1s',
    '(?:([^f])fe|([lr])f)$': '$1$2ves',
    '(shea|lea|loa|thie)f$': '$1ves',
    sis$: 'ses',
    '([ti])um$': '$1a',
    '(tomat|potat|ech|her|vet)o$': '$1oes',
    '(bu)s$': '$1ses',
    '(alias)$': '$1es',
    '(octop)us$': '$1i',
    '(ax|test)is$': '$1es',
    '(us)$': '$1es',
    '([^s]+)$': '$1s',
  }
  const irregular = {
    move: 'moves',
    foot: 'feet',
    goose: 'geese',
    sex: 'sexes',
    child: 'children',
    man: 'men',
    tooth: 'teeth',
    person: 'people',
  }
  const uncountable = [
    'sheep',
    'fish',
    'deer',
    'moose',
    'series',
    'species',
    'money',
    'rice',
    'information',
    'equipment',
    'bison',
    'cod',
    'offspring',
    'pike',
    'salmon',
    'shrimp',
    'swine',
    'trout',
    'aircraft',
    'hovercraft',
    'spacecraft',
    'sugar',
    'tuna',
    'you',
    'wood',
  ]

  if (uncountable.includes(word.toLowerCase())) {
    return word
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const w in irregular) {
    if (Object.prototype.hasOwnProperty.call(irregular, w)) {
      const pattern = new RegExp(`${w}$`, 'i')
      const replace = irregular[w]
      if (pattern.test(word)) {
        return word.replace(pattern, replace)
      }
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const reg in plural) {
    if (Object.prototype.hasOwnProperty.call(plural, reg)) {
      const pattern = new RegExp(reg, 'i')
      if (pattern.test(word)) {
        return word.replace(pattern, plural[reg])
      }
    }
  }

  return word
}

/**
 * @param {string} word - word to remove accent from
 * @param {boolean} toLowercase - whether to return lowercase or not
 */
export function deburrString(word, toLowercase = false) {
  return deburr(toLowercase ? word.toLowerCase() : word)
}

/**
 * @param {number} count
 * @param {string} singular - the singular form
 * @param {string} plural - the plural form
 * @param {boolean} include - include the number in the output
 * @return {string}
 */
export function inflect(count, singular, plural, include) {
  const validCount = typeof count === 'number' ? count : 0
  const word = validCount === 1 ? singular : plural
  if (!include) {
    return word
  }
  return `${validCount} ${word}`
}

/**
 * Takes 3 arrays of invitations (note, tag and edge invitations) and returns an object
 * with formatted invitations grouped by group name
 *
 * @param {object[][]} array of invitation arrays
 * @return {object}
 */
export function formatTasksData([noteInvitations, tagInvitations, edgeInvitations]) {
  const groupedInvitations = {}
  const dateOptions = {
    hour: 'numeric', minute: 'numeric', day: '2-digit', month: 'short', year: 'numeric', timeZoneName: 'long',
  }

  // Helper functions
  const getDueDateStatus = (date) => {
    const day = 24 * 60 * 60 * 1000
    const diff = Date.now() - date.getTime()

    if (diff > 0) {
      return 'expired'
    }
    if (diff > -3 * day) {
      return 'warning'
    }
    return ''
  }

  const getGroupId = (invitationId) => {
    let group = invitationId.split('/-/')[0]
    const exceptions = [
      'Paper', 'Reviewers', 'Area_Chairs', 'Program_Chairs', 'Program_Committee',
      'Senior_Program_Committee', 'Emergency_Reviewers', 'Senior_Area_Chairs',
      'Action_Editors',
    ]
    exceptions.forEach((e) => {
      const index = group.indexOf(`/${e}`)
      if (index > 0) {
        group = group.substring(0, index)
      }
    })
    return group
  }

  const formatInvitation = (invitation) => {
    const inv = { ...invitation }
    const group = getGroupId(inv.id)

    const duedate = new Date(inv.duedate)
    inv.dueDateStr = duedate.toLocaleDateString('en-GB', dateOptions)
    inv.dueDateStatus = getDueDateStatus(duedate)
    inv.groupId = inv.id.split('/-/')[0]

    if (!inv.details) {
      inv.details = {}
    }

    if (inv.noteInvitation) {
      if (inv.details.repliedNotes && inv.details.repliedNotes.length) {
        inv.completed = true
      }
      // can't locate a unique noteId when there are multiple repliedNotes
      inv.noteId = inv.details.repliedNotes?.length === 1 ? inv.details.repliedNotes[0].id : inv.reply.replyto
      if (isEmpty(inv.details.replytoNote)) {
        // Some invitations returned by the API do not contain replytoNote
        inv.details.replytoNote = { forum: inv.reply.forum }
      }
    } else if (inv.tagInvitation) {
      // Get num replied tags or edges
      const repliedCount = (inv.details.repliedTags && inv.details.repliedTags.length)
        || (inv.details.repliedEdges && inv.details.repliedEdges.length)

      const completionCount = inv.taskCompletionCount || inv.minReplies
      if (completionCount && repliedCount && repliedCount >= completionCount) {
        // Temporary special case for Recommendation invitations. Uses hardcoded constant for
        // number of papers assigned.
        if (inv.id.endsWith('Recommendation')) {
          const groupedEdgesCounts = countBy(inv.details.repliedEdges, 'head')
          const allPapersRecommended = Object.keys(groupedEdgesCounts).length >= 20
          inv.completed = allPapersRecommended
            && groupedEdgesCounts.every(count => count >= completionCount)
        } else {
          inv.completed = true
        }
      }
    }

    if (groupedInvitations[group]) {
      groupedInvitations[group].invitations.push(inv)
      if (!inv.completed) {
        groupedInvitations[group].numPending += 1
      } else {
        groupedInvitations[group].numCompleted += 1
      }
    } else {
      groupedInvitations[group] = {
        invitations: [inv],
        numPending: (inv.completed ? 0 : 1),
        numCompleted: (inv.completed ? 1 : 0),
      }
    }
  }

  // Temporary hack:
  // Mark expertise selection task as completed when reviewer profile confirmation
  // or AC profile confirmation tasks are complete
  const temporaryMarkExpertiseCompleted = (invitationsGroup) => {
    const profileConfirmationInv = invitationsGroup.invitations.find(inv => inv.id.endsWith('Profile_Confirmation') || inv.id.endsWith('Registration'))
    const expertiseInv = invitationsGroup.invitations.find(inv => inv.id.endsWith('Expertise_Selection'))
    if (expertiseInv && profileConfirmationInv && profileConfirmationInv.completed) {
      expertiseInv.completed = true
      // eslint-disable-next-line no-param-reassign
      invitationsGroup.numPending -= 1
      // eslint-disable-next-line no-param-reassign
      invitationsGroup.numCompleted += 1
    }
  }

  tagInvitations.concat(edgeInvitations, noteInvitations)
    .sort((a, b) => a.duedate - b.duedate)
    .forEach(formatInvitation)

  Object.keys(groupedInvitations).forEach((group) => {
    temporaryMarkExpertiseCompleted(groupedInvitations[group])
  })

  return groupedInvitations
}

/**
 * Format unix epoch to en-US locale string based on formatter provided
 * default format is in the form of "Jun 08, 2020, 11:59:39 AM"
 *
 * @param {number} timestamp
 * @param {object} option
 */
export function formatDateTime(timestamp, option = {}) {
  if (!timestamp) return null

  const defaultOption = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: undefined,
  }
  // eslint-disable-next-line no-param-reassign
  option = { ...defaultOption, ...option }

  const dateSettings = {
    day: option.day,
    month: option.month,
    year: option.year,
    hour: option.hour,
    minute: option.minute,
    second: option.second,
    ...(option.timeZoneName && { timeZoneName: option.timeZoneName }),
  }
  return new Date(timestamp).toLocaleDateString('en-US', dateSettings)
}

/**
 * Test if a email is valid
 * similar to the one used in view.js but for components to use
 *
 * @param {string} email
 */
export function isValidEmail(email) {
  if (!email) return false
  if (email === process.env.SUPER_USER) return true // to allow su to login
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
  return emailRegex.test(email.toLowerCase())
}

/**
 * check for same password
 *
 * @param {string} newPassword
 * @param {string} confirmPassword
 */
export function isValidPassword(newPassword, confirmPassword) {
  return newPassword && confirmPassword && newPassword === confirmPassword
}

/**
 * Get url based on group id, tilde id, or email
 *
 * @param {string} groupId
 * @param {boolean} editMode - edit mode of group
 */
export function urlFromGroupId(groupId, editMode = false) {
  const commonGroups = ['everyone', '(anonymous)', '(guest)']
  if (!groupId || commonGroups.indexOf(groupId) !== -1) {
    return ''
  } else if (groupId.indexOf('~') === 0) {
    return `/profile?id=${groupId}`
  } else if (groupId.indexOf('@') !== -1) {
    return `/profile?email=${groupId}`
  }
  return `/group${editMode ? '/edit' : ''}?id=${groupId}`
}

/**
 * get version param to pass to API based on group id
 *
 * @param {string} groupId
 */
export function getGroupVersion(groupId) {
  return groupId?.startsWith('.') ? 2 : 1
}

/**
 * Test if a url is valid
 * moved from profile-view
 *
 * @param {string} url
 */
export function isValidURL(url) {
  if (!url) return false
  const urlRegex = /^(?:(?:https?):\/\/)(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i
  return urlRegex.test(url)
}

/**
 * Test if a domain is valid
 * moved from profile-view
 *
 * @param {string} domain
 */
export function isValidDomain(domain) {
  if (!domain) return false
  // eslint-disable-next-line no-useless-escape
  const domainRegex = /^(((?!-))(xn--|_{1,1})?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/
  return domainRegex.test(domain)
}

/**
 * Test if a year is valid
 * moved from profile-view
 *
 * @param {number} year
 */
export function isValidYear(year) {
  if (!Number.isInteger(year)) return false
  const validYearRegex = /^(19|20)\d{2}$/ // 1900~2099
  return validYearRegex.test(year)
}

export const timezoneOptions = [
  { label: '(GMT -12:00) Eniwetok, Kwajalein', value: 'Etc/GMT+12' },
  { label: '(GMT -11:00) Midway Island, Samoa', value: 'Pacific/Samoa' },
  { label: '(GMT -10:00) Hawaii', value: 'Etc/GMT+10' },
  { label: '(GMT -9:00) Alaska', value: 'Etc/GMT+9' },
  { label: '(GMT -8:00) Pacific Time (US &amp; Canada)', value: 'Etc/GMT+8' },
  { label: '(GMT -7:00) Mountain Time (US &amp; Canada)', value: 'Etc/GMT+7' },
  { label: '(GMT -6:00) Central Time (US &amp; Canada), Mexico City', value: 'Etc/GMT+6' },
  { label: '(GMT -5:00) Eastern Time (US &amp; Canada), Bogota, Lima', value: 'Etc/GMT+5' },
  { label: '(GMT -4:30) Caracas', value: 'America/Caracas' },
  { label: '(GMT -4:00) Atlantic Time (Canada), Puerto Rico, La Paz', value: 'Etc/GMT+4' },
  { label: '(GMT -3:30) Newfoundland', value: 'Canada/Newfoundland' },
  { label: '(GMT -3:00) Brazil, Buenos Aires, Georgetown', value: 'America/Argentina/Buenos_Aires' },
  { label: '(GMT -2:00) Mid-Atlantic', value: 'Etc/GMT+2' },
  { label: '(GMT -1:00) Azores, Cape Verde Islands', value: 'Atlantic/Azores' },
  { label: '(GMT) Western Europe Time, London, Lisbon, Casablanca', value: 'UTC' },
  { label: '(GMT +1:00) Brussels, Copenhagen, Madrid, Paris', value: 'Europe/Paris' },
  { label: '(GMT +2:00) Kaliningrad, South Africa', value: 'Europe/Kaliningrad' },
  { label: '(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg', value: 'Europe/Moscow' },
  { label: '(GMT +3:30) Tehran', value: 'Asia/Tehran' },
  { label: '(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi', value: 'Asia/Muscat' },
  { label: '(GMT +4:30) Kabul', value: 'Asia/Kabul' },
  { label: '(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent', value: 'Asia/Yekaterinburg' },
  { label: '(GMT +5:30) Bombay, Calcutta, Madras, New Delhi', value: 'Asia/Calcutta' },
  { label: '(GMT +5:45) Kathmandu, Pokhara', value: 'Asia/Kathmandu' },
  { label: '(GMT +6:00) Almaty, Dhaka, Colombo', value: 'Asia/Dhaka' },
  { label: '(GMT +6:30) Yangon, Mandalay', value: 'Asia/Yangon' },
  { label: '(GMT +7:00) Bangkok, Hanoi, Jakarta', value: 'Asia/Bangkok' },
  { label: '(GMT +8:00) Beijing, Perth, Singapore, Hong Kong', value: 'Asia/Hong_Kong' },
  { label: '(GMT +8:45) Eucla', value: 'Australia/Eucla' },
  { label: '(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk', value: 'Asia/Tokyo' },
  { label: '(GMT +9:30) Adelaide, Darwin', value: 'Australia/Adelaide' },
  { label: '(GMT +10:00) Eastern Australia, Guam, Vladivostok', value: 'Pacific/Guam' },
  { label: '(GMT +10:30) Lord Howe Island', value: 'Australia/Lord_Howe' },
  { label: '(GMT +11:00) Magadan, Solomon Islands, New Caledonia', value: 'Asia/Magadan' },
  { label: '(GMT +11:30) Norfolk Island', value: 'Pacific/Norfolk' },
  { label: '(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka', value: 'Pacific/Fiji' },
  { label: '(GMT +12:45) Chatham Islands', value: 'Pacific/Chatham' },
  { label: '(GMT +13:00) Apia, Nukualofa', value: 'Pacific/Apia' },
  { label: '(GMT +14:00) Line Islands, Tokelau', value: 'Etc/GMT-14' },
]

/**
 * get default timezone label value obj of user...
 *
 */
export function getDefaultTimezone() {
  const offsetMinutes = (new Date()).getTimezoneOffset()
  const userOffsetStr = offsetMinutes === 0
    ? '(GMT)'
    : `(GMT ${offsetMinutes > 0 ? '-' : '+'}${Math.abs(Math.floor(offsetMinutes / 60))}:${offsetMinutes % 60 ? offsetMinutes % 60 : '00'})`
  return timezoneOptions.find(option => option.label.startsWith(userOffsetStr))
}
