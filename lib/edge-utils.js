import _ from 'lodash'
import { prettyId } from './utils'

/**
 * Takes content object of an assignment config note and returns an edge browser URL
 * for that assignment
 *
 * @param {object} configNoteContent - content object of the config note
 * @return {string}
 */
export function getEdgeBrowserUrl(configNoteContent) {
  // For old matches using metadata notes return empty string
  let edgeBrowserUrl = ''

  // For matches utilizing the new edge system return full path
  if (configNoteContent.scores_specification) {
    const browseInvitations = Object.keys(configNoteContent.scores_specification)
    const referrerText = `all assignments for ${prettyId(configNoteContent.match_group)}`
    const referrerUrl = `/assignments?group= ${configNoteContent.match_group}`

    // eslint-disable-next-line prefer-template
    edgeBrowserUrl = `/edges/browse?traverse=${configNoteContent.assignment_invitation},label:${configNoteContent.title}`
      + `&edit=${configNoteContent.assignment_invitation},label:${configNoteContent.title}`
      + `&browse=${configNoteContent.aggregate_score_invitation},label:${configNoteContent.title}`
      + `;${browseInvitations.join(';')}`
      + `;${configNoteContent.conflicts_invitation}`
      + (configNoteContent.custom_max_papers_invitation ? `;${configNoteContent.custom_max_papers_invitation},head:ignore` : '')
      + (configNoteContent.custom_load_invitation ? `;${configNoteContent.custom_load_invitation},head:ignore` : '')
      + `&referrer=${encodeURIComponent(`[${referrerText}](${referrerUrl})`)}`
  }
  return edgeBrowserUrl
}

// Format essential profile data for display
export function formatProfileContent(profileContent) {
  const name = _.find(profileContent.names, ['preferred', true]) || profileContent.names[0]
  const email = profileContent.preferredEmail || profileContent.emails[0]

  let title
  if (profileContent.history && profileContent.history.length) {
    const position = _.upperFirst(_.get(profileContent.history, '[0].position', '')).trim()
    const institutionName = _.get(profileContent.history, '[0].institution.name', '').trim()
    const institutionDomain = _.get(profileContent.history, '[0].institution.domain', '').trim()
    const institution = institutionDomain
      ? `${institutionName} (${institutionDomain})`
      : institutionName
    const separator = position && institution ? ' at ' : ''
    title = `${position}${separator}${institution}`
  } else {
    title = _.last(email.split('@'))
  }

  const expertise = _.flatMap(profileContent.expertise, entry => entry.keywords)

  return {
    name,
    email,
    title,
    expertise,
  }
}

// Returns only the essential data from an entity
export function formatEntityContent(entity, type) {
  switch (type) {
    case 'Note':
      return {
        id: entity.id,
        forum: entity.forum,
        invitation: entity.invitation,
        number: entity.number,
        content: entity.content,
        original: entity.details ? entity.details.original : null,
      }

    case 'Profile':
      return {
        id: entity.id,
        content: formatProfileContent(entity.content),
      }

    case 'Group':
      return {
        id: entity.id,
        name: prettyId(entity.id),
      }

    case 'Tag':
      return {} // TODO

    default:
      return {}
  }
}

// Combine all relevant note fields into search corpus
export function buildNoteSearchText(item) {
  const searchFields = []

  if (item.number) {
    searchFields.push(`#${item.number}`)
  }

  const omittedContentFields = [
    'pdf', 'verdict', 'paperhash', 'ee', 'html', 'year', 'venue', 'venueid',
  ]
  Object.keys(item.content).forEach((field) => {
    if (!item.content[field] || omittedContentFields.includes(field)) {
      return
    }
    if (_.isString(item.content[field])) {
      searchFields.push(item.content[field].toLowerCase())
    } else if (Array.isArray(item.content[field])) {
      searchFields.push(item.content[field].join('\n').toLowerCase())
    }
  })

  if (item.details && item.details.original) {
    searchFields.push(item.details.original.content.authors.join('\n'))
    searchFields.push(item.details.original.content.authorids.join('\n'))
  }

  return searchFields.join('\n')
}

// Combine all relevant profile fields into search corpus
export function buildProfileSearchText(item) {
  const searchFields = []
  const { names, history, preferredEmail } = item.content

  if (names && names.length) {
    names.forEach(name => searchFields.push(
      [name.first, name.middle, name.last].filter(n => n).join(' ').toLowerCase(),
    ))
  }
  if (history) {
    const { institutionName, institutionDomain } = _.get(history, '[0].institution', {})
    if (institutionName) searchFields.push(institutionName.toLowerCase())
    if (institutionDomain) searchFields.push(institutionDomain.toLowerCase())
  }
  if (preferredEmail) {
    searchFields.push(preferredEmail.toLowerCase())
  }

  return searchFields.join('\n')
}

// Builds search corpus for any type of entity
export function buildSearchText(item, type) {
  switch (type) {
    case 'Note':
      return buildNoteSearchText(item)

    case 'Profile':
      return buildProfileSearchText(item)

    case 'Group':
      return '' // TODO

    case 'Tag':
      return '' // TODO

    default:
      return ''
  }
}

export function parseEdgeList(str) {
  if (!str || typeof str !== 'string') {
    return []
  }
  return str.split(';').map((edgeStr) => {
    const [invitation, ...paramsStr] = edgeStr.split(',')
    if (!invitation) {
      return null
    }
    const queryParams = _.fromPairs(paramsStr.map(s => s.split(':')))
    return {
      id: invitation,
      name: invitation.split('/').pop().replace(/_/g, ' '),
      query: queryParams,
    }
  }).filter(inv => inv)
}

export function buildInvitationReplyArr(invitation, fieldName, profileId) {
  if (!(invitation && invitation.reply && invitation.reply[fieldName])) {
    return null
  }

  const field = invitation.reply[fieldName]
  if (field.values) {
    return field.values
  }
  if (field['values-regex'] && field['values-regex'].startsWith('~.*')) {
    return [profileId]
  }
  if (field['values-copied']) {
    return field['values-copied'].map((groupId) => {
      if (groupId === '{signatures}') {
        return profileId
      }
      // Right now, the only special value other than {signatures} that is
      // supported is {tail}. That value is replaced on the client side
      if (groupId.startsWith('{') && groupId !== '{tail}') {
        return null
      }
      return groupId
    }).filter(groupId => groupId)
  }
  return []
}
