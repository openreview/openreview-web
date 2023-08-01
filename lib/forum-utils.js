import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { prettyId, buildNoteTitle } from './utils'
import { buildNoteSearchText } from './edge-utils'

/**
 * Format note object from API into a forum-ready object
 *
 * @param {object} note
 * @returns object
 */
export function formatNote(
  note,
  invitation,
  editInvitations,
  deleteInvitation,
  replyInvitations
) {
  // note.details.invitation can sometimes be missing or contain an empty object
  let replyInvitation
  if (invitation) {
    replyInvitation = invitation
  } else if (!isEmpty(note.details?.originalInvitation)) {
    replyInvitation = note.details?.originalInvitation
  } else if (!isEmpty(note.details?.invitation)) {
    replyInvitation = note.details?.invitation
  } else {
    replyInvitation = null
  }

  return {
    id: note.id,
    forum: note.forum,
    invitations: note.invitations,
    cdate: note.cdate || note.tcdate,
    mdate: note.mdate || note.tmdate,
    ddate: note.ddate,
    replyto: note.replyto || note.forum,
    content: note.content || {},
    signatures: note.signatures,
    readers: note.readers,
    sortedReaders: note.readers.sort(),
    searchText: buildNoteSearchText(note, true),
    generatedTitle: buildNoteTitle(note.invitations[0], note.signatures),
    details: {
      ...note.details,
      invitation: replyInvitation,
    },
    editInvitations,
    deleteInvitation,
    replyInvitations,
  }
}

/**
 * Categorize invitations for a given note
 *
 * @param {array} invitations
 * @param {object} note
 * @param {string} forumId
 * @returns array
 */
export function getNoteInvitations(invitations, note) {
  let deleteInvitation = null
  let editInvitations = []
  if (note.details?.writable) {
    editInvitations = invitations.filter((p) => {
      const appliesToNote =
        p.edit?.note?.id === note.id ||
        note.invitations.includes(p.edit?.note?.id?.param?.withInvitation)
      const invitationExpired = p.expdate && p.expdate < Date.now()
      return appliesToNote && (!invitationExpired || p.details?.writable)
    })
    deleteInvitation = editInvitations.find((p) => p.edit?.note?.ddate)

    // pure delete invitations should not be included as an edit invitation
    if (!deleteInvitation?.edit?.note?.content) {
      editInvitations = editInvitations.filter((p) => p.id !== deleteInvitation?.id)
    }
  }

  const replyInvitations = invitations.filter((p) => {
    const replyTo = p.edit?.note?.replyto
    const invitationExpired = p.expdate && p.expdate < Date.now()
    return (
      p.details.repliesAvailable &&
      (!invitationExpired || p.details?.writable) &&
      replyTo &&
      (replyTo === note.id ||
        replyTo.param?.withForum === note.forum ||
        (replyTo.param?.withInvitation &&
          note.invitations.includes(replyTo.param?.withInvitation)))
    )
  })

  return [editInvitations, replyInvitations, deleteInvitation]
}

/**
 * Get note content values
 *
 * @param {object} content
 * @returns object
 */
export function getNoteContentValues(content) {
  return Object.keys(content ?? {}).reduce((acc, key) => {
    const val = content[key].value
    acc[key] = val
    return acc
  }, {})
}

/**
 * Convert filter query string into object representing all the active filters
 *
 * @param {string} filterQuery - filter query parameter
 * @param {string} searchQuery - search query parameter
 * @returns object
 */
export function parseFilterQuery(filterQuery, searchQuery) {
  const filterObj = (filterQuery || '').split(' ').reduce((map, token) => {
    const [field, val] = token.split(':')
    if (val) {
      const mapKey = field.startsWith('-')
        ? `excluded${field.slice(1, 2).toUpperCase()}${field.slice(2)}`
        : field
      // eslint-disable-next-line no-param-reassign
      map[mapKey] = val.split(',')
    }
    return map
  }, {})

  if (searchQuery) {
    filterObj.keywords = [searchQuery.toLowerCase()]
  }

  return filterObj
}

/**
 * Convert filter query string into object representing all the active filters
 *
 * @param {string} filterQuery - filter query from replyForumViews field
 * @param {object} replyNote - note object replying to invitation
 * @returns string
 */
export function replaceFilterWildcards(filterQuery, replyNote) {
  if (!filterQuery) return ''

  return filterQuery.replace(/\${note\.([\w.]+)}/g, (match, field) =>
    get(replyNote, field, '')
  )
}

/**
 * Convert selected filter object into string representation that can be url encoded
 *
 * @param {object} replyNote - note object replying to invitation
 * @returns string
 */
export function stringifyFilters(filterObj) {
  return Object.entries(filterObj)
    .map(([key, val]) => {
      if (!val) return null
      return `${key === 'excludedReaders' ? '-readers' : key}:${val.join(',')}`
    })
    .filter(Boolean)
    .join(' ')
}

/**
 * Get unique styles for a given invitation name. Uses a basic hash function to
 * generate colors if not one of the common names.
 *
 * @param {string} formattedId - the user-readable version of the invitation id
 * @returns object
 */
export function getInvitationColors(formattedId) {
  const styleMap = {
    Comment: { backgroundColor: '#bfb', color: '#2c3a4a' },
    'Official Comment': { backgroundColor: '#bbf', color: '#2c3a4a' },
    'Public Comment': { backgroundColor: '#bfb', color: '#2c3a4a' }, // Same as Comment
    Review: { backgroundColor: '#fbb', color: '#2c3a4a' },
    'Meta Review': { backgroundColor: '#fbf', color: '#2c3a4a' },
    'Official Review': { backgroundColor: '#fbb', color: '#2c3a4a' }, // Same as Review
    Decision: { backgroundColor: '#bff', color: '#2c3a4a' },
  }
  if (styleMap[formattedId]) {
    return styleMap[formattedId]
  }

  let sum = 0
  for (let i = 0; i < formattedId.length; i += 1) {
    sum += formattedId.charCodeAt(i)
  }

  const additionalColors = [
    '#8cf',
    '#8fc',
    '#8ff',
    '#8cc',
    '#fc8',
    '#f8c',
    '#cf8',
    '#c8f',
    '#cc8',
    '#ccf',
  ]
  const selectedColor = additionalColors[sum % additionalColors.length]
  return { backgroundColor: selectedColor, color: '#2c3a4a' }
}

export function getSignatureColors(groupId) {
  let sum = 0
  for (let i = 0; i < groupId.length; i += 1) {
    sum += groupId.charCodeAt(i)
  }

  const colorOptions = [
    '#dd3333',
    '#aa8033',
    '#aaaa33',
    '#80aa33',
    '#33aa33',
    '#33aa80',
    '#33aaaa',
    '#3380aa',
    '#3333aa',
    '#8033aa',
    '#aa33aa',
    '#aa3380',
  ]
  return colorOptions[sum % colorOptions.length]
}

/**
 * Get the human readable version of an array of group ids
 *
 * @param {string[]} idList - list of ids to format
 * @param {string} type - conjunction/disjunction/unit
 */
export function readersList(idList) {
  if (!Array.isArray(idList) || idList.length === 0) {
    return ''
  }

  const groupParts = idList[0].split('/')
  const prettyArr = idList.map((id) => prettyId(id.replace(groupParts.slice(0, -1).join('/'), '')))
  if (prettyArr.length === 1) {
    return prettyArr[0]
  }
  const last = prettyArr.pop()
  const rest = prettyArr.join(', ')
  return `${prettyId(groupParts.slice(0, -2).join('/'))} ${rest}, and ${last}`
}
