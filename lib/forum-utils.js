import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import truncate from 'lodash/truncate'
import { prettyId, buildNoteTitle } from './utils'
import { buildNoteSearchText } from './edge-utils'

/**
 * Convert a flat list of tags into a list of tags where each item in the list is
 * a tuple consisting of the tag value and a list of tags with that value.
 *
 * For example: [ [value1, [tag1, tag2]], [value2, [tag3, tag4]] ]
 *
 * @param {array} tags - list of tags
 * @returns {array} list of tags grouped by value
 */
export function groupTagsByValue(tags) {
  if (!tags) return []

  const sortedTags = tags.sort((a, b) => a.cdate - b.cdate)
  const groupedTags = []
  for (let i = 0; i < sortedTags.length; i += 1) {
    const tag = sortedTags[i]

    if (tag.label && !tag.ddate) {
      const existingIndex = groupedTags.findIndex((t) => t[0] === tag.label)
      const tagInfo = {
        id: tag.id,
        signature: tag.signature,
        cdate: tag.cdate,
      }
      if (existingIndex > -1) {
        groupedTags[existingIndex][1].push(tagInfo)
      } else {
        groupedTags.push([tag.label, [tagInfo]])
      }
    }
  }
  return groupedTags
}

/**
 * Add a tag object to the list of note reactions. Returns a new list of reactions
 * with the format: [ [value1, [tag1, tag2]], [value2, [tag3, tag4]] ]
 *
 * @param {array} reactions - list of tags
 * @param {object} tag - tag object from API
 * @returns {array} list of tags grouped by value
 */
export function addTagToReactionsList(reactions, tag) {
  const newReactions = []
  const newTagInfo = tag.ddate
    ? null
    : { id: tag.id, signature: tag.signature, cdate: tag.cdate }
  let reactionExists = false

  reactions.forEach((tuple) => {
    if (tuple[0] !== tag.label) {
      newReactions.push(tuple)
    } else {
      if (tag.ddate) {
        const filteredList = tuple[1].filter((t) => t.id !== tag.id)
        if (filteredList.length > 0) {
          newReactions.push([tuple[0], filteredList])
        }
      } else if (tuple[1].find((t) => t.id === tag.id)) {
        newReactions.push(tuple)
      } else {
        newReactions.push([tuple[0], tuple[1].concat(newTagInfo)])
      }
      reactionExists = true
    }
  })
  if (!reactionExists && !tag.ddate) {
    newReactions.push([tag.label, [newTagInfo]])
  }
  return newReactions
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
      const invNoteId = p.edit?.note?.id
      const appliesToNote =
        invNoteId === note.id ||
        note.invitations.includes(invNoteId?.param?.withInvitation) ||
        (note.content?.venueid?.value &&
          note.content.venueid.value === invNoteId?.param?.withVenueid)
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
        replyTo.param?.withForum === `\${1/forum}` ||
        (replyTo.param?.withInvitation &&
          note.invitations.includes(replyTo.param?.withInvitation)))
    )
  })

  const tagInvitations = invitations.filter((p) => {
    const invitationExpired = p.expdate && p.expdate < Date.now()
    return (
      !invitationExpired &&
      (p.tag?.note?.id === note.id ||
        p.tag?.note?.param?.withForum === note.forum ||
        (p.tag?.note?.param?.withInvitation &&
          note.invitations.includes(p.tag?.note?.param?.withInvitation)))
    )
  })

  return { editInvitations, replyInvitations, deleteInvitation, tagInvitations }
}

/**
 * Format note object from API into a forum-ready object
 *
 * @param {object} note
 * @returns object
 */
export function formatNote(note, invitations) {
  const { editInvitations, deleteInvitation, replyInvitations, tagInvitations } =
    getNoteInvitations(invitations, note)

  // note.details.invitation can sometimes be missing or contain an empty object
  let replyInvitation
  if (!isEmpty(note.details?.originalInvitation)) {
    replyInvitation = note.details?.originalInvitation
  } else if (!isEmpty(note.details?.invitation)) {
    replyInvitation = note.details?.invitation
  } else {
    replyInvitation = null
  }

  const groupedTags = note.reactions
    ? note.reactions
    : groupTagsByValue(
        note.details?.tags?.filter((t) => t.invitation.endsWith('/Chat_Reaction'))
      )

  return {
    id: note.id,
    externalId: note.externalId,
    forum: note.forum,
    invitations: note.invitations,
    cdate: note.cdate,
    tcdate: note.tcdate,
    mdate: note.mdate,
    tmdate: note.tmdate,
    ddate: note.ddate,
    pdate: note.pdate,
    odate: note.odate,
    replyto: note.replyto || note.forum,
    content: note.content || {},
    ...(typeof note.number === 'number' ? { number: note.number } : {}),
    signatures: note.signatures,
    readers: note.readers,
    license: note.license,
    sortedReaders: [...(note.readers ?? [])].sort(),
    searchText: buildNoteSearchText(note, true),
    generatedTitle: buildNoteTitle(note.invitations[0], note.signatures),
    reactions: groupedTags,
    details: {
      ...note.details,
      invitation: replyInvitation,
      ...(note.forum !== note.id && { tags: null }),
    },
    editInvitations,
    deleteInvitation,
    replyInvitations,
    tagInvitations,
  }
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
  const prettyArr = idList.map((id) =>
    prettyId(id.replace(groupParts.slice(0, -1).join('/'), ''))
  )
  if (prettyArr.length === 1) {
    return prettyArr[0]
  }
  const last = prettyArr.pop()
  const rest = prettyArr.join(', ')
  return `${prettyId(groupParts.slice(0, -2).join('/'))} ${rest}, and ${last}`
}

/**
 * Return the first 100 characters of chat note content stripping out all
 * non-alphanumeric characters
 *
 * @param {string} replyContent - content of chat message
 * @returns {string} snippet
 */
export function getReplySnippet(replyContent) {
  if (!replyContent) return ''

  return truncate(replyContent.replace(/[^a-zA-Z0-9\s]/g, ' '), {
    length: 100,
    omission: '...',
    separator: ' ',
  })
}

/**
 * Get all the properties of a license based on it's short name
 *
 * @param {string} licenseName - short name of license
 * @returns {(Object|null)} license info including full name and url
 */
export default function getLicenseInfo(licenseName) {
  const licenseData = {
    'CC BY 4.0': {
      fullName: 'Creative Commons Attribution 4.0 International',
      url: 'https://creativecommons.org/licenses/by/4.0/',
    },
    'CC BY-SA 4.0': {
      fullName: 'Creative Commons Attribution-ShareAlike 4.0 International',
      url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    'CC BY-NC 4.0': {
      fullName: 'Creative Commons Attribution-NonCommercial 4.0 International',
      url: 'https://creativecommons.org/licenses/by-nc/4.0/',
    },
    'CC BY-ND 4.0': {
      fullName: 'Creative Commons Attribution-NoDerivs 4.0 International',
      url: 'https://creativecommons.org/licenses/by-nd/4.0/',
    },
    'CC BY-NC-SA 4.0': {
      fullName: 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International',
      url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    },
    'CC BY-NC-ND 4.0': {
      fullName: 'Creative Commons Attribution-NonCommercial-NoDerivs 4.0 International',
      url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    },
    'CC0 1.0': {
      fullName: 'CC0 1.0 Universal Public Domain Dedication',
      url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
  }

  if (!licenseName) return null
  return licenseData[licenseName] ?? null
}
