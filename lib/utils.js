/* eslint-disable no-else-return */
/* globals $,view2: false */

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
import escapeRegExp from 'lodash/escapeRegExp'
import get from 'lodash/get'
import intersection from 'lodash/intersection'
import union from 'lodash/union'
import uniq from 'lodash/uniq'
import Collapse from '../components/Collapse'

/**
 * Get the human readable version of a group or profile id
 *
 * @param {string} id - group or profile id to convert
 * @param {boolean} [onlyLast] - don't include Paper# token in output
 */
export function prettyId(id, onlyLast, includePaperNumber) {
  if (!id || typeof id !== 'string') {
    return ''
  } else if (id.indexOf('~') === 0 && id.length > 1) {
    return id.substring(1).replace(/_|\d+/g, ' ').trim()
  } else if (id === 'everyone') {
    return 'Everyone'
  } else if (id === '(anonymous)' || id === '(guest)') {
    return id
  } else {
    let idString = id
    if (idString.includes('${')) {
      const match = idString.match('{.*}')[0]
      const newMatch = match.replace(/\//g, '.')
      // remove value when it appears at the end of the token
      idString = idString.replace(match, newMatch).replace('.value}', '}')
    }
    let tokens = idString.split('/')
    if (onlyLast) {
      const sliceIndex = findIndex(tokens, (token) => token.match(/^Paper\d+|Submission\d+$/))
      const sliceOffset = includePaperNumber ? 0 : 1
      tokens = tokens.slice(sliceIndex === -1 ? -1 : sliceIndex + sliceOffset)
    }

    const transformedId = tokens
      .map((token) => {
        // API v2 tokens can include strings like ${note.number}
        if (token.includes('${')) {
          return token
            .replace(/\$\{(\S+)\}/g, (match, p1) => ` {${p1.split('.').pop()}}`)
            .replace(/_/g, ' ')
        }

        let transformedToken = token
          .replace(/^\./g, '') // journal names start with '.'
          .replace(/\..+/g, '') // remove text after dots, ex: uai.org
          .replace(/^-$/g, '') // remove dashes
          .replace(/_/g, ' ') // replace undescores with spaces

        // if the letters in the token are all lowercase, replace it with empty string
        const lettersOnly = token.replace(/\d|\W/g, '')
        if (
          lettersOnly &&
          lettersOnly === lettersOnly.toLowerCase() &&
          lettersOnly !== lettersOnly.toUpperCase()
        ) {
          transformedToken = ''
        }

        return transformedToken
      })
      .filter((formattedToken) => formattedToken)
      .join(' ')

    return transformedId || idString
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

  return (
    tokens
      // eslint-disable-next-line arrow-body-style
      .map((token) => {
        let prettyToken = token
        if (token.startsWith('~')) {
          prettyToken = prettyId(token)
        }
        return prettyToken
          .replace(/^-$/g, '') // remove dashes
          .replace(/\.\*/g, '') // remove wildcards
          .replace(/_/g, ' ') // replace undescores with spaces
          .trim()
      })
      .filter((formattedToken) => formattedToken)
      .join(' ')
  )
}

/**
 * Get the human readable version of a note content object's field
 *
 * @param {string} fieldName - content field to convert
 */
export function prettyField(fieldName) {
  if (fieldName === 'pdf') return 'PDF'
  return fieldName?.replace(/_/g, ' ')?.split(' ')?.map(upperFirst)?.join(' ')?.trim()
}

/**
 * Get the human readable version of a note content object's field
 *
 * @param {string} fieldName - content field to convert
 * @param {string} dataType - if field is date convert date
 */
export function prettyContentValue(val, dataType) {
  const valType = typeof val
  if (dataType === 'date') {
    // eslint-disable-next-line no-use-before-define
    return formatDateTime(val, {
      second: undefined,
      locale: 'en-GB',
      timeZoneName: 'short',
      hour12: false,
    })
  }
  if (valType === 'string') {
    return val.trim()
  }
  if (valType === 'number' || valType === 'boolean') {
    return val.toString()
  }
  if (Array.isArray(val)) {
    if (isObject(val[0])) {
      return JSON.stringify(val, undefined, 2).replace(/"/g, '')
    } else {
      return val.join(', ')
    }
  }
  if (isObject(val)) {
    return JSON.stringify(val, undefined, 2).replace(/"/g, '')
  }

  // null, undefined, function, symbol, etc.
  return ''
}

/**
 * Simplified implementation of the Intl.ListFormat
 * replace with Intl.ListFormat when support of old browsers is dropped
 */
class ListFormat {
  constructor(locale, options) {
    this.locale = locale
    this.style = options.style
    this.type = options.type
  }

  conjunctionMap = {
    conjunction: ' and ',
    disjunction: ' or ',
    unit: ', ',
  }

  format(elements) {
    const conjunction = this.conjunctionMap[this.type]
    const last = elements.pop()
    const rest = elements.join(', ')
    return `${rest}${conjunction}${last}`
  }
}

/**
 * Get the human readable version of an array of group ids
 *
 * @param {string[]} idList - list of ids to format
 * @param {string} style - long/short
 * @param {string} type - conjunction/disjunction/unit
 */
export function prettyList(idList, style = 'long', type = 'conjunction', isRawId = true) {
  if (!Array.isArray(idList) || !idList.length) {
    return ''
  }

  const prettyArr = isRawId ? idList.map((id) => prettyId(id, style === 'short')) : idList
  if (prettyArr.length === 1) {
    return prettyArr[0]
  }
  return new ListFormat('en', { style, type }).format(prettyArr)
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
 * @returns {string}
 */
export function getConferenceName(bibtex) {
  if (typeof bibtex !== 'string') return null

  const regex = /\n[ \t]*booktitle[ \t]*=[ \t]*\{(.+)\},?/i
  const match = bibtex.match(regex)
  return match ? match[1].trim().replace(/^Submitted to /, '') : null
}

/**
 * Get name of journal from raw bibtex string
 *
 * @param {string} bibtex
 * @returns {string}
 */
export function getJournalName(bibtex) {
  if (typeof bibtex !== 'string') return null

  const regex = /\n[ \t]*journal[ \t]*=[ \t]*\{(.+)\},?/i
  const match = bibtex.match(regex)
  return match ? match[1].trim().replace(/^Submitted to /, '') : null
}

/**
 * Get name of ISSN number from raw bibtex string
 *
 * @param {string} bibtex
 * @returns {string}
 */
export function getIssn(bibtex) {
  if (typeof bibtex !== 'string') return null

  const regex = /\n[ \t]*issn[ \t]*=[ \t]*\{(.+)\},?/i
  const match = bibtex.match(regex)
  return match ? match[1] : null
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
      ['order']
    ),
    'field'
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
  createdDate,
  trueCreatedDate,
  modifiedDate,
  trueModifiedDate,
  createdYear,
  pdate,
  withTime = false,
  withTimezone = false
) {
  const mdateSettings = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime && { hour: 'numeric', minute: 'numeric' }),
    ...(withTimezone && { timeZoneName: 'long' }),
  }
  const cdateSettings = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime && { hour: 'numeric', minute: 'numeric' }),
    ...(withTimezone && { timeZoneName: 'long' }),
  }

  const cdate = createdDate || trueCreatedDate || Date.now()
  const hasYear =
    (typeof createdYear === 'string' && createdYear.length) ||
    (typeof createdYear === 'number' && createdYear > 0)
  const cdateObj = hasYear ? new Date(createdYear, 0) : new Date(cdate)

  // if the cdateObj lacks the precision to represent days/months,
  // remove them from cdateSettings. For some reason, dates are 1-indexed
  if (
    cdateObj.getUTCSeconds() === 0 &&
    cdateObj.getUTCMinutes() === 0 &&
    cdateObj.getUTCHours() === 0 &&
    cdateObj.getUTCDate() === 1
  ) {
    delete cdateSettings.day

    if (cdateObj.getUTCMonth() === 0) {
      delete cdateSettings.month
      cdateSettings.timeZone = 'UTC'
    }
  }

  const cdateFormatted = cdateObj.toLocaleDateString('en-GB', cdateSettings)
  const mdate = modifiedDate || trueModifiedDate
  const mdateFormatted = mdate
    ? new Date(mdate).toLocaleDateString('en-GB', mdateSettings)
    : ''

  if (pdate) {
    const pdateFormatted = new Date(pdate).toLocaleDateString('en-GB', mdateSettings)
    const secondaryDate = mdate
      ? `Last Modified: ${mdateFormatted}`
      : `Uploaded: ${cdateFormatted}`
    return `Published: ${pdateFormatted}, ${secondaryDate}`
  }

  let mdateStr = ''
  if (hasYear && cdate === mdate) {
    mdateStr = ` (imported: ${new Date(cdate).toLocaleDateString('en-GB', mdateSettings)})`
  } else if (cdate < trueCreatedDate && trueCreatedDate === trueModifiedDate) {
    mdateStr = ` (imported: ${mdateFormatted})`
  } else if (mdate && cdate !== mdate) {
    mdateStr = ` (modified: ${mdateFormatted})`
  }
  return cdateFormatted + mdateStr
}

/**
 * Generate a title for a note based on just the note invitation and signatures
 *
 * @param {string} invitationId - invitation ID of note
 * @param {string[]} signatures - note signatures
 * @param {boolean} isEdit
 */
export function buildNoteTitle(invitationId, signatures, isEdit) {
  const formattedInvitation = prettyInvitationId(invitationId)
  const signature = signatures?.length > 0 ? prettyId(signatures[0], true) : ''
  const signatureMatches = signature.match(/^(Paper\d+|Submission\d+) (.+)$/)
  const invMatches = invitationId.match(/\/(Paper\d+|Submission\d+)\//)
  const editStr = isEdit ? ' Edit' : ''

  let suffix = ''
  if (
    (invMatches || signatureMatches) &&
    formattedInvitation.toLowerCase().includes('review')
  ) {
    const paper = invMatches ? invMatches[1] : signatureMatches[1]
    const signatureWithoutPaper = signatureMatches ? signatureMatches[2] : signature
    const sep = signatureWithoutPaper ? ' by ' : ''
    suffix = ` of ${paper}${sep}${signatureWithoutPaper}`
  } else if (signature) {
    suffix = ` by ${signature}`
  }
  return formattedInvitation + editStr + suffix
}

export function buildNoteUrl(id, forum, content, options = {}) {
  let url = `/forum`

  if (options.usePaperHashUrl && content.paperhash?.value) {
    url += `/${content.paperhash.value}`
  } else {
    url += `?id=${forum}`
  }

  if (id !== forum) {
    url += `?noteId=${id}`
  }

  if (options.referrer) {
    url += `&referrer=${encodeURIComponent(options.referrer)}`
  }

  return url
}

/**
 * Takes a string with the format aaa-bbb-1 and returns a string with the
 * number incremented by 1, e.g. aaa-bbb-2. Also checks for _ and space as separators.
 *
 * @param {string} title - the title to increment
 * @returns {string} the incremented title
 */
function incrementNoteTitle(title) {
  let titleSplit = (title || '').split(/[-_ ]+/)
  const titleSuffix = Number.parseInt(titleSplit[titleSplit.length - 1], 10)
  if (Number.isNaN(titleSuffix)) {
    titleSplit.push(1)
  } else {
    titleSplit = titleSplit.slice(0, -1)
    titleSplit.push(titleSuffix + 1)
  }
  return titleSplit.join('-')
}

/**
 * Clone a assignment config note object and update title and status
 *
 * @param {object} note - the assignment note to clone
 * @returns {object} the cloned note with updated title and status
 */
export function cloneAssignmentConfigNote(note) {
  const clone = cloneDeep(
    omit(note, ['id', 'cdate', 'forum', 'number', 'tcdate', 'tmdate', '_id'])
  )
  clone.content.status = 'Initialized'
  clone.content.error_message = ''
  clone.content.randomized_fraction_of_opt = ''
  clone.content.title = incrementNoteTitle(note.content.title || note.content.label)
  return clone
}

/**
 * Clone a v2 assignment config note object and update title and status
 *
 * @param {object} note - the assignment note to clone
 * @returns {object} the cloned note with updated title and status
 */
export function cloneAssignmentConfigNoteV2(note) {
  const clone = cloneDeep(
    omit(note, ['id', 'cdate', 'forum', 'number', 'tcdate', 'tmdate', '_id'])
  )
  clone.content.status = { ...clone.content.status, value: 'Initialized' }
  clone.content.error_message = { ...clone.content.error_message, value: '' }
  clone.content.randomized_fraction_of_opt = {
    ...clone.content.randomized_fraction_of_opt,
    value: '',
  }
  clone.content.title = {
    ...clone.content.title,
    value: incrementNoteTitle(note.content.title.value || note.content.label.value),
  }
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
  const allContentKeys = Array.from(
    new Set([...Object.keys(leftNote.content), ...Object.keys(rightNote.content)])
  ).filter((key) => !key.startsWith('_') && key !== 'pdf' && key !== 'paperhash')

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
    if (key.split('.').some((p) => dateKeys.includes(p))) return formatTimestamp(value)
    return value
  }

  const constructDiff = (keys) =>
    keys.reduce((result, key) => {
      const leftValue = key.split('.').reduce((p, q) => p?.[q], leftEdit)
      const rightValue = key.split('.').reduce((p, q) => p?.[q], rightEdit)

      if (!isEqual(leftValue, rightValue)) {
        // eslint-disable-next-line no-param-reassign
        result[key] = {
          left: formatValue(key, leftValue),
          right: formatValue(key, rightValue),
        }
      }
      return result
    }, {})

  const allKeys = Array.from(new Set([...getAllKeys(leftEdit), ...getAllKeys(rightEdit)]))
    .map((p) => p.toLowerCase())
    .filter((key) => !key.startsWith('_') && omitKeys.includes(key) === false)

  const editNoteDifference = constructDiff(
    allKeys.filter((p) => p.startsWith('note.') && !p.startsWith('note.content.'))
  )
  const editNoteContentDifference = constructDiff(
    allKeys.filter((p) => p.startsWith('note.content.'))
  )
  const otherEditDifference = constructDiff(allKeys.filter((p) => !p.startsWith('note.')))
  return {
    edit: otherEditDifference,
    editNote: editNoteDifference,
    editNoteContent: editNoteContentDifference,
  }
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
 * Get the singular form of a role name
 *
 * @param {string} roleName - role name to convert
 */
export function getSingularRoleName(roleName) {
  return roleName?.endsWith('s') ? roleName.slice(0, -1) : roleName
}

/**
 * Get the hash fragment format of a role name
 *
 * @param {string} roleName - role name to convert
 */
export function getRoleHashFragment(roleName) {
  return getSingularRoleName(roleName).toLowerCase().replaceAll('_', '-')
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
 * @returns {string}
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
 * with formatted invitations grouped by group name (if skipGrouping is set to false)
 *
 * @param {object[][]} array of invitation arrays
 * @param {boolean} skipGrouping - only do the formatting if set to true
 * @returns {object}
 */
export function formatTasksData(
  [noteInvitations, tagInvitations, edgeInvitations],
  skipGrouping = false
) {
  const groupedInvitations = {}
  const dateOptions = {
    hour: 'numeric',
    minute: 'numeric',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZoneName: 'long',
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

  const noteHasAllRequiredFields = (invitation, note) => {
    const requiredFields = Object.entries(invitation?.edit?.note?.content ?? {}).flatMap(
      ([field, fieldDescription]) => {
        if (
          !fieldDescription.value?.param ||
          fieldDescription.value.param.const ||
          fieldDescription.value?.param?.optional === true
        )
          return []
        return field
      }
    )

    return requiredFields.every((field) => !isNil(note.content?.[field]?.value))
  }

  // eslint-disable-next-line consistent-return
  const formatInvitation = (invitation) => {
    const inv = { ...invitation }
    const group = inv.domain ?? inv.id.split('/-/')[0]

    const duedate = new Date(inv.duedate)
    inv.dueDateStr = duedate.toLocaleDateString('en-GB', dateOptions)
    inv.dueDateStatus = getDueDateStatus(duedate)
    inv.groupId = inv.id.split('/-/')[0]

    if (!inv.details) {
      inv.details = {}
    }

    if (inv.noteInvitation) {
      if (inv.details.repliedNotes?.length > 0) {
        if (
          inv.details.repliedNotes?.some((repliedNote) =>
            noteHasAllRequiredFields(inv, repliedNote)
          )
        ) {
          inv.completed = true
        } else {
          inv.hasMissingFields = true
        }
      } else if (inv.details.repliedEdits?.length > 0) {
        const noteIds = new Set()
        const sortedEdits = inv.details.repliedEdits.sort((a, b) => a.tcdate - b.tcdate)
        sortedEdits.forEach((edit) => {
          if (!edit.note) return
          if (edit.note.ddate) {
            noteIds.delete(edit.note.id)
          } else {
            noteIds.add(edit.note.id)
          }
        })
        const minReplies = inv.minReplies || 1
        inv.completed = noteIds.size >= minReplies
      }
      // can't locate a unique noteId when there are multiple repliedNotes
      inv.noteId =
        inv.details.repliedNotes?.length === 1
          ? inv.details.repliedNotes[0].id
          : inv.edit.note.replyto

      if (isEmpty(inv.details.replytoNote)) {
        // Some invitations returned by the API do not contain replytoNote
        inv.details.replytoNote = {
          forum: inv.edit.note.forum,
        }
      }
    } else if (inv.tagInvitation) {
      // Get num replied tags or edges
      const repliedCount =
        (inv.details.repliedTags && inv.details.repliedTags.length) ||
        (inv.details.repliedEdges && inv.details.repliedEdges.length)

      const completionCount = inv.taskCompletionCount || inv.minReplies
      if (completionCount && repliedCount && repliedCount >= completionCount) {
        inv.completed = true
      }
    }

    if (skipGrouping) return inv

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
        numPending: inv.completed ? 0 : 1,
        numCompleted: inv.completed ? 1 : 0,
      }
    }
  }

  const isNotPublicInvitation = (invitation) =>
    intersection(['everyone', '~', '(guest)', '(anonymous)'], invitation.invitees).length === 0

  if (skipGrouping) {
    return tagInvitations
      .concat(edgeInvitations, noteInvitations)
      .filter(isNotPublicInvitation)
      .sort((a, b) => a.duedate - b.duedate)
      .map((p) => {
        try {
          return formatInvitation(p)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error)
          return null
        }
      })
  }

  tagInvitations
    .concat(edgeInvitations, noteInvitations)
    .filter(isNotPublicInvitation)
    .sort((a, b) => a.duedate - b.duedate)
    .forEach((p) => {
      try {
        formatInvitation(p)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
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
    timeZone: undefined,
    hour12: true,
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
    hour12: option.hour12,
    ...(option.timeZoneName && { timeZoneName: option.timeZoneName }),
    ...(option.timeZone && { timeZone: option.timeZone }),
    ...(option.weekday && { weekday: option.weekday }),
  }
  return new Date(timestamp).toLocaleDateString(option.locale ?? 'en-US', dateSettings)
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
  const emailRegex =
    /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
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
 * Test if a url is valid
 * moved from profile-view
 *
 * @param {string} url
 */
export function isValidURL(url) {
  if (!url) return false
  const urlRegex =
    /^(?:(?:https?):\/\/)(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i
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
  const domainRegex =
    // eslint-disable-next-line no-useless-escape
    /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/
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

// #region util functions for autoComplete
const truncate = (label, boldTerm) => {
  const emphasisRegex = new RegExp(`${boldTerm}.*`, 'i')
  const m = label.match(emphasisRegex)
  const maxCharLength = 85
  let newLabel

  if (m && m.index && label.length > maxCharLength) {
    const beforeTerm = label.split(boldTerm)[0] // the words in the label before the bold term
    const afterTerm = label.split(boldTerm)[1] // the words in the label after the bold term

    const beforeWords = beforeTerm.split(' ')
    const ellipses = beforeWords.length === 1 ? '' : '&hellip;'
    const boldChars = '<strong></strong>'

    let prefix = `${ellipses}${beforeWords[beforeWords.length - 1]}`
    const suffix = afterTerm.slice(
      0,
      maxCharLength - (boldTerm.length - boldChars.length) - prefix.length
    )

    let t = beforeWords.length - 2
    while ((prefix + boldTerm + suffix).length < maxCharLength) {
      prefix = `${ellipses}${beforeWords.slice(t, beforeWords.length - 1).join(' ')} `
      t -= 1
    }

    newLabel = `${prefix}${boldTerm}${suffix}`
  } else {
    newLabel = label
  }
  return newLabel
}

const emphasize = (label, searchTerm) => {
  const termRegex = new RegExp(`${searchTerm}.*`, 'i')
  const m = label.match(termRegex)
  const boldTerm = m
    ? `<strong>${m.input.slice(m.index, m.index + searchTerm.length)}</strong>`
    : `<strong>${searchTerm}</strong>`
  let newLabel

  if (m && m.index !== undefined) {
    newLabel = `${label.slice(0, m.index)}${boldTerm}${label.slice(
      m.index + searchTerm.length,
      label.length
    )}`
  } else {
    newLabel = label
  }
  return truncate(newLabel, boldTerm)
}

const contentToString = (stringOrArray) => {
  if (Array.isArray(stringOrArray)) {
    return stringOrArray.join(', ')
  } else if (typeof stringOrArray === 'string') {
    return stringOrArray
  } else {
    return ''
  }
}

/**
 * return a list of unique tokens that match the termRegex
 *
 * @param {object[]} docArray - an array containing the content objects in the response (result.notes)
 */
export function getTokenObjects(docArray, searchTerm) {
  const contentArray = docArray?.map((docObj) => ({
    content: docObj.content,
    version: docObj.version,
  }))
  const termRegex = new RegExp(`${searchTerm}.*`, 'i')

  const tokens = [
    ...new Set(
      contentArray
        .map((contentObj) =>
          Object.values(contentObj.content ?? {})
            ?.flatMap((val) => {
              // eslint-disable-next-line no-param-reassign
              if (contentObj.version === 2) val = val?.value
              if (Array.isArray(val)) return val
              if (typeof val === 'string')
                return (
                  val
                    .toLowerCase()
                    // eslint-disable-next-line no-useless-escape
                    .replace(/'\"/g, '')
                    .replace(/\W/g, ' ')
                    .replace(/\s\s+/g, ' ')
                    .split(' ')
                )

              return []
            })
            .map((p) => p)
        )
        .flat(Infinity)
        .filter((token) => {
          try {
            return token.match(termRegex)
          } catch (error) {
            return false
          }
        })
    ),
  ]

  const autocompleteObjects = tokens.map((token) => ({
    value: token,
    label: emphasize(token, searchTerm),
    section: 'tokens',
  }))
  return autocompleteObjects
}

export function getTitleObjects(docArray, searchTerm) {
  const termRegex = new RegExp(`${escapeRegExp(searchTerm)}.*`, 'i')
  return docArray
    .map((docObj) => {
      const contentObj = docObj.content
      const title = docObj.version === 2 ? contentObj.title?.value : contentObj.title
      const authors = docObj.version === 2 ? contentObj.authors?.value : contentObj.authors
      return {
        value: isEmpty(title) ? '' : title,
        forum: docObj?.forum ?? '',
        id: docObj.id,
        label: isEmpty(title) ? '' : emphasize(title, searchTerm),
        subtitle: isEmpty(authors) ? '' : emphasize(contentToString(authors), searchTerm),
        authors: isEmpty(authors) ? '' : authors,
        section: 'titles',
      }
    })
    .filter(
      (titleObj) =>
        (!isEmpty(titleObj.value) && titleObj.value.match(termRegex)) ||
        (!isEmpty(titleObj.authors) && contentToString(titleObj.authors).match(termRegex))
    )
}
// #endregion

export const timezoneOptions = [
  { label: '(GMT -12:00) Eniwetok, Kwajalein', value: 'Etc/GMT+12' },
  { label: '(GMT -11:00) Midway Island, Samoa', value: 'Pacific/Samoa' },
  { label: '(GMT -10:00) Hawaii', value: 'Etc/GMT+10' },
  { label: '(GMT -9:00) Alaska', value: 'Etc/GMT+9' },
  { label: '(GMT -8:00) Pacific Time (US & Canada)', value: 'Etc/GMT+8' },
  { label: '(GMT -7:00) Mountain Time (US & Canada)', value: 'Etc/GMT+7' },
  { label: '(GMT -6:00) Central Time (US & Canada), Mexico City', value: 'Etc/GMT+6' },
  { label: '(GMT -5:00) Eastern Time (US & Canada), Bogota, Lima', value: 'Etc/GMT+5' },
  { label: '(GMT -4:30) Caracas', value: 'America/Caracas' },
  { label: '(GMT -4:00) Atlantic Time (Canada), Puerto Rico, La Paz', value: 'Etc/GMT+4' },
  { label: '(GMT -3:30) Newfoundland', value: 'Canada/Newfoundland' },
  {
    label: '(GMT -3:00) Brazil, Buenos Aires, Georgetown',
    value: 'America/Argentina/Buenos_Aires',
  },
  { label: '(GMT -2:00) Mid-Atlantic', value: 'Etc/GMT+2' },
  { label: '(GMT -1:00) Azores, Cape Verde Islands', value: 'Atlantic/Azores' },
  { label: '(GMT) Western Europe Time, London, Lisbon, Casablanca', value: 'UTC' },
  { label: '(GMT +1:00) Brussels, Copenhagen, Madrid, Paris', value: 'Europe/Paris' },
  { label: '(GMT +2:00) Kaliningrad, South Africa', value: 'Europe/Kaliningrad' },
  { label: '(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg', value: 'Europe/Moscow' },
  { label: '(GMT +3:30) Tehran', value: 'Asia/Tehran' },
  { label: '(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi', value: 'Asia/Muscat' },
  { label: '(GMT +4:30) Kabul', value: 'Asia/Kabul' },
  {
    label: '(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent',
    value: 'Asia/Yekaterinburg',
  },
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
  const offsetMinutes = new Date().getTimezoneOffset()
  const userOffsetStr =
    offsetMinutes === 0
      ? '(GMT)'
      : `(GMT ${offsetMinutes > 0 ? '-' : '+'}${Math.floor(Math.abs(offsetMinutes / 60))}:${
          offsetMinutes % 60 ? Math.abs(offsetMinutes % 60) : '00'
        })`
  return timezoneOptions.find((option) => option.label.startsWith(userOffsetStr)) ?? null
}

/**
 * get meta invitation id to use when editing an invitation
 */
export function getMetaInvitationId(invitation) {
  const metaInvitationId = `${invitation.domain}/-/Edit`
  return metaInvitationId
}

/**
 * get a valid year/null from null/undefined/string/integer
 *
 */
export function getStartEndYear(year) {
  if (!year) return null
  const parsedYear = Number.parseInt(year, 10)
  if (Number.isInteger(parsedYear)) return year
  return null
}

/**
 * get name string from profile name object
 *
 */
export function getNameString(nameObj) {
  if (!nameObj) return null
  return nameObj.fullname
}

/**
 * True and False options for select
 */
export const trueFalseOptions = [
  { value: true, label: 'True' },
  { value: false, label: 'False' },
]

/**
 * Split a string into an array of words by comma
 */
export function stringToArray(value) {
  return value?.split(',')?.flatMap((p) => (p.trim() ? p.trim() : []))
}

/**
 * Return a string usable by DOM components for the className attribute
 */
export function classNames(...classes) {
  return classes.filter(Boolean).join(' ') || null
}

/**
 * pretty invitation id for tasks page
 */
export function prettyTasksInvitationId(invitationId, domain) {
  return invitationId
    .replace(domain, '')
    .replace(/\/-\/|\/|_/g, ' ') // Replace /-/, /, _ with spaces
    .trim()
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
          const field = p.slice(1, -1)
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
 * Get ordered field names based on order property
 *
 * @param {object} invitation - invitation object
 * @param {Array} ignoreFields - fields to ignore
 * @returns Array
 */
export function orderNoteInvitationFields(invitation, ignoreFields = []) {
  const invitationContent =
    invitation.apiVersion === 2
      ? invitation.edit?.note?.content
      : (invitation.reply.content ?? {})
  return Object.keys(invitationContent)
    .filter((p) => !ignoreFields.includes(p))
    .sort(
      (a, b) => (invitationContent[a]?.order ?? 999) - (invitationContent[b]?.order ?? 999)
    )
}

/**
 * save text field content to localStorage
 *
 * @param {object} user - user object
 * @param {string} invitationId - id of invitation
 * @param {string|null} noteId - id of note
 * @param {string} replyToNoteId - id of replyToNote
 * @param {string} fieldName - name of the field rendered
 * @returns the key
 */
export function getAutoStorageKey(user, invitationId, noteId, replyToNoteId, fieldName) {
  const userIdForKey = !user ? 'guest' : user.id
  return [
    userIdForKey,
    noteId ?? 'null',
    replyToNoteId ?? 'null',
    invitationId ?? 'null',
    fieldName,
  ].join('|')
}

/**
 * get the pdf download link of a note
 * modified from handlebars helper pdfUrl for authorConsole
 *
 * @param {object} note - user object
 * @param {boolean} invitationId - id of invitation
 * @param {boolean} isV2Note - version of note
 * @returns {string}
 */
export function getNotePdfUrl(note, isReference, isV2Note) {
  if (!note.content) return ''

  const pdfValue = isV2Note ? note.content.pdf?.value : note.content.pdf
  if (!pdfValue) return ''

  let urlPath
  if (isReference) {
    urlPath = isV2Note ? '/notes/edits/pdf' : '/references/pdf'
  } else {
    urlPath = '/pdf'
  }
  const nameParam = urlPath === '/pdf' ? '' : '&name=pdf'

  return `${urlPath}?id=${note.id}${nameParam}`
}

/**
 * build reader for v1 invitation
 *
 * @param {object} invitation
 * @param {string} fieldName - the field to interpret
 * @param {string} profileId - the tilde id to replace {signatures}
 * @param {string} noteNumber - the paper number to replace Paper.*
 * @returns {string}
 */
export function buildArray(invitation, fieldName, profileId, noteNumber) {
  if (invitation.reply?.[fieldName]?.values) return invitation.reply[fieldName].values
  if (invitation.reply?.[fieldName]?.['values-copied'])
    return invitation.reply[fieldName]['values-copied']
      .map((value) => {
        if (value === '{signatures}') return profileId
        if (value[0] === '{') return null
        return value
      })
      .filter((p) => p)
  if (invitation.reply?.[fieldName]?.['values-regex'])
    return invitation.reply[fieldName]['values-regex']
      .split('|')
      .map((value) => {
        if (value.indexOf('Paper.*') !== -1)
          return value.replace('Paper.*', `Paper${noteNumber}`)
        return value
      })
      .filter((p) => p)
  return []
}

/**
 * get number of submission from group id
 *
 * @param {string} groupId
 * @param {string} submissionName - default to Paper
 * @returns number
 */
export function getNumberFromGroup(groupId, submissionName = 'Paper') {
  const paper = groupId.split('/').find((p) => p.indexOf(submissionName) === 0)
  return paper ? Number.parseInt(paper.substring(submissionName.length), 10) : null
}

/**
 * get anon id of submission from group id
 *
 * @param {string} groupId
 * @param {string} submissionName - default to Paper
 * @returns string
 */
export function getIndentifierFromGroup(groupId, submissionName = 'Paper') {
  const paper = groupId.split('/').find((p) => p.indexOf(submissionName) === 0)
  return paper ? paper.substring(submissionName.length) : null
}

/**
 * get label class for span tag to render profile state
 *
 * @param {string} state
 * @returns string
 */
export function getProfileStateLabelClass(state) {
  const modifier = (() => {
    switch (state) {
      case 'Active Institutional':
      case 'Active Automatic':
      case 'Active':
        return 'success'

      case 'Needs Moderation':
      case 'Rejected':
        return 'warning'
      case 'Blocked':
      case 'Limited':
      case 'Deleted':
        return 'danger'
      case 'Inactive':
      case 'Merged':
      default:
        return 'default'
    }
  })()
  return `label label-${modifier}`
}

/**
 * get preferred name or name from profile object
 *
 * @param {object} profile
 * @returns string
 */
export function getProfileName(profile) {
  const name = profile.content.names.find((t) => t.preferred) || profile.content.names[0]
  return name ? name.fullname : prettyId(profile.id)
}

/**
 * get tab count message for moderation page
 *
 * @param {integer} unrepliedCommentCount
 * @param {integer} notDeployedCount
 * @returns string
 */
export function getVenueTabCountMessage(unrepliedCommentCount, notDeployedCount) {
  if (unrepliedCommentCount === 0 && notDeployedCount === 0) return null
  if (unrepliedCommentCount === 0 && notDeployedCount !== 0)
    return inflect(notDeployedCount, 'venue request', 'venue requests', true)
  if (unrepliedCommentCount !== 0 && notDeployedCount === 0) return unrepliedCommentCount
  return `${inflect(
    unrepliedCommentCount,
    'venue with comments',
    'venues with comments',
    true
  )}, ${inflect(notDeployedCount, 'venue request', 'venue requests', true)}`
}

export function parseNumberField(value) {
  if (typeof value === 'string') {
    const valueString = value.substring(0, value.indexOf(':'))
    return valueString ? parseInt(valueString, 10) : parseInt(value, 10)
  } else if (typeof value === 'number') {
    return value
  }
  return null
}

/**
 * convert query object with dot notation assignment statement to object that note editor can consume
 *
 * @param {Object} prefilledValues - e.g. {edit.note.comment:test comment}
 * @returns object
 */
export function stringToObject(prefilledValues) {
  if (Object.keys(prefilledValues).length === 0) {
    return undefined
  }

  const outputObject = {}

  Object.keys(prefilledValues).forEach((key) => {
    const tokens = key.split('.')
    let currentLevel = outputObject

    for (let i = 2; i < tokens.length; i += 1) {
      const token = tokens[i]
      if (!currentLevel[token]) {
        if (i === tokens.length - 1) {
          const prefilledValue = Array.isArray(prefilledValues[key])
            ? uniq(prefilledValues[key])
            : prefilledValues[key]
          currentLevel[token] = { value: prefilledValue }
        } else {
          currentLevel[token] = {}
        }
      }
      currentLevel = currentLevel[token]
    }
  })
  return outputObject
}

/**
 * checks whether email has instituion domain or subdomain
 * e.g. email: test@umass.edu and test@test.umass.edu should return true
 * while test@testumass.edu or test@umass.com should return false
 *
 * @param {string} email - the email address to check
 * @param {Array} institutionDomains - the list of institution domains
 * @returns boolean
 */
export function isInstitutionEmail(email, institutionDomains) {
  const emailDomainTokens = email.split('@').pop()?.trim()?.toLowerCase().split('.')
  return institutionDomains?.some((institutionDomain) => {
    const institutionDomainTokens = institutionDomain.split('.')
    if (institutionDomainTokens.length > emailDomainTokens.length) {
      return false
    }
    for (let i = 0; i <= emailDomainTokens.length; i += 1) {
      if (isEqual(emailDomainTokens.slice(i), institutionDomainTokens)) {
        return true
      }
    }
    return false
  })
}

/**
 * get the path of workflow invitaiton field by looking up sub invitation
 * content field name in sub invitation's edit.invitation
 *
 * @param {object} editInvitationObject - subInvitation.edit.invitation
 * @param {string} contentFieldName - the sub invitation content field name to look up for
 * @param {string} intermediatePath - intermediate path value
 * @returns string
 */
export function getPath(editInvitationObject, contentFieldName, intermediatePath) {
  if (typeof editInvitationObject !== 'object') {
    return null
  }
  const keys = Object.keys(editInvitationObject)
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i]
    if (
      typeof editInvitationObject[key] === 'string' &&
      editInvitationObject[key].split('/').some((token) => token === contentFieldName)
    ) {
      if (Number.isNaN(Number(key)))
        return intermediatePath ? `${intermediatePath}.${key}` : key
      return intermediatePath
    }
    if (
      Array.isArray(editInvitationObject[key]) &&
      editInvitationObject[key].includes(contentFieldName)
    ) {
      return intermediatePath ? `${intermediatePath}.${key}` : key
    }
    if (typeof editInvitationObject[key] === 'object') {
      const result = getPath(
        editInvitationObject[key],
        contentFieldName,
        intermediatePath ? `${intermediatePath}.${key}` : key
      )
      if (result) {
        return result
      }
    }
  }
  return null
}

/**
 * get the existing value to display for sub invitation content fields
 * from workflow invitation based on path and content field type
 *
 * @param {object} workflowInvitationObject - the workflow invitation to get value from
 * @param {string} path - the path to find the value in workflow invitation (from getPath function)
 * @param {string} type - the data type specified in sub invitation content field
 * @returns string | JSX.Element
 */
export function getSubInvitationContentFieldDisplayValue(
  workflowInvitationObject,
  path,
  type,
  timeZone
) {
  if (!path) return null
  const fieldValue = get(workflowInvitationObject, path)
  if (typeof fieldValue === 'object') {
    if (Array.isArray(fieldValue)) {
      if (typeof fieldValue[0] === 'object') {
        // enum
        return (
          <ul>
            {fieldValue.slice(0, 3).map((p, index) => (
              <li key={index}>
                {p.description ??
                  prettyId(p.value?.replace(workflowInvitationObject.domain, ''))}
              </li>
            ))}
            {fieldValue.length > 3 && (
              <Collapse showLabel="Show all" hideLabel="Show less" linkAtBottom>
                {fieldValue.slice(3).map((p, index) => (
                  <li key={index}>
                    {p.description ??
                      prettyId(p.value?.replace(workflowInvitationObject.domain, ''))}
                  </li>
                ))}
              </Collapse>
            )}
          </ul>
        )
      }

      const valueSegments = fieldValue.map((value) =>
        value === workflowInvitationObject.domain
          ? ['Administrators']
          : prettyId(value.replace(workflowInvitationObject.domain, '')).split(
              /\{(\S+\s*\S*)\}/g
            )
      )

      return (
        <ul>
          {valueSegments.slice(0, 3).map((segments, segmentsIndex) => (
            <li key={segmentsIndex}>
              {segments.map((segment, index) =>
                index % 2 !== 0 ? <em key={index}>{segment}</em> : segment
              )}
            </li>
          ))}
          {valueSegments.length > 3 && (
            <Collapse showLabel="Show all" hideLabel="Show less" linkAtBottom>
              {valueSegments.slice(3).map((segments, segmentsIndex) => (
                <li key={segmentsIndex}>
                  {segments.map((segment, index) =>
                    index % 2 !== 0 ? <em key={index}>{segment}</em> : segment
                  )}
                </li>
              ))}
            </Collapse>
          )}
        </ul>
      )
    }
    const fieldKeys = Object.keys(fieldValue)
    return (
      <ul>
        {fieldKeys.slice(0, 3).map((p, index) => (
          <li key={index}>{p}</li>
        ))}
        {fieldKeys.length > 3 && (
          <Collapse showLabel="Show all" hideLabel="Show less" linkAtBottom>
            {fieldKeys.slice(3).map((p, index) => (
              <li key={index}>{p}</li>
            ))}
          </Collapse>
        )}
      </ul>
    )
  }
  if (type === 'date') {
    return fieldValue !== undefined && fieldValue !== null
      ? formatDateTime(fieldValue, {
          second: undefined,
          timeZone,
          hour12: false,
          timeZoneName: 'short',
        })
      : 'value missing'
  }
  return fieldValue !== undefined && fieldValue !== null
    ? fieldValue.toString()
    : 'value missing'
}

/**
 * return profile rejection options
 *
 * @param {string} currentInstitutionName
 * @returns Array
 */
export function getRejectionReasons(currentInstitutionName) {
  const instructionText =
    'Please go back to the sign up page, enter the same name and email, click the Resend Activation button and follow the activation link to update your information.'
  const rejectionReasons = [
    {
      value: 'requestEmailVerification',
      label: 'Institutional Email is missing',
      rejectionText: `Please add and confirm an institutional email ${
        currentInstitutionName ? `issued by ${currentInstitutionName} ` : ''
      }to your profile. Please make sure the verification token is entered and verified.\n\nIf your affiliation ${
        currentInstitutionName ? `issued by ${currentInstitutionName} ` : ''
      } is not current, please update your profile with your current affiliation and associated institutional email.\n\n${instructionText}`,
    },
    {
      value: 'requestEmailConfirmation',
      label: 'Institutional Email is added but not confirmed',
      rejectionText: `Please confirm the institutional email in your profile by clicking the "Confirm" button next to the email and enter the verification token received.\n\n${instructionText}`,
    },
    {
      value: 'invalidDBLP',
      label: 'DBLP link is a disambiguation page',
      rejectionText: `The DBLP link you have provided is a disambiguation page and is not intended to be used as a bibliography. Please select the correct bibliography page listed under "Other persons with a similar name". If your page is not listed please contact the DBLP team so they can add your bibliography page. We recommend providing a different bibliography homepage when resubmitting to OpenReview moderation.\n\n${instructionText}`,
    },
    {
      value: 'imPersonalHomepage',
      label: 'Homepage is invalid',
      rejectionText: `The homepage url provided in your profile is invalid or does not display your name/email used to register so your identity can't be determined.\n\n${instructionText}`,
    },
    {
      value: 'imPersonalHomepageAndEmail',
      label: 'Homepage is invalid + no institution email',
      rejectionText: `A Homepage url which displays your name and institutional email matching your latest career/education history are required. Please confirm the institutional email by entering the verification token received after clicking confirm button next to the institutional email.\n\n${instructionText}`,
    },
    {
      value: 'invalidName',
      label: 'Profile name is invalid',
      rejectionText: `The name in your profile does not match the name listed in your homepage or is invalid.\n\n${instructionText}`,
    },
    {
      value: 'invalidORCID',
      label: 'ORCID profile is incomplete',
      rejectionText: `The ORCID profile you've provided as a homepage is empty or does not match the Career & Education history you've provided.\n\n${instructionText}`,
    },
    {
      value: 'requestVouch',
      label: 'Request supervisor or coauthor to vouch',
      rejectionText: `Please ask a supervisor or coauthor or colleague that already has an OpenReview profile to email us at info@openreview.net from the institutional email in their profile to vouch for your registration.\n\nPlease add the profile ID of the person vouching for you to the Relations section of your profile.\n\n${instructionText}`,
    },
  ]
  return rejectionReasons
}

export function formatGroupResults(apiRes) {
  return (apiRes.groups?.[0]?.members || []).map((groupId) => ({ groupId, dueDate: null }))
}

export function getTagDispayText(tag, showProfileId = true) {
  const { signature, invitation, label, weight, profile } = tag
  const invitationGroup = invitation.split('/-')[0]
  const signatureGroupEqInvitationGroup = invitationGroup.includes(signature)

  if (invitation === `${process.env.SUPER_USER}/Support/-/Vouch`) {
    return showProfileId ? (
      `${signature} vouch ${profile}`
    ) : (
      <span>
        Vouched by <span className="highlight">{prettyId(signature)}</span>
      </span>
    )
  }
  if (invitation.startsWith(`${process.env.SUPER_USER}/Support`)) {
    return `${prettyId(signature)}${signatureGroupEqInvitationGroup ? ' ' : ` ${prettyId(invitationGroup)}`}${prettyInvitationId(tag.invitation)}${showProfileId ? ` ${prettyId(profile)}` : ''}${label ? ` ${label}` : ''}${weight ? ` (${weight})` : ''}`
  } else {
    return (
      <span>
        <span className="highlight">{prettyId(signature)}</span>
        {signatureGroupEqInvitationGroup ? ' ' : ` ${prettyId(invitationGroup)}`}
        {prettyInvitationId(tag.invitation)}
        {showProfileId ? ` ${prettyId(profile)}` : ''}
        {label ? ` ${label}` : ''}
        {weight ? ` (${weight})` : ''}
      </span>
    )
  }
}
