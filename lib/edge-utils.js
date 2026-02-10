/* globals promptError: false */
import dayjs from 'dayjs'
import _ from 'lodash'
import { prettyId, prettyInvitationId } from './utils'
import api from './api-client'

/**
 * Takes content object of an assignment config note and returns an edge browser URL
 * for that assignment
 *
 * @param {object} configNoteContent - content object of the config note
 * @returns {string}
 */
export function getEdgeBrowserUrl(configNoteContent, options) {
  const browseInvitations = Object.keys(configNoteContent.scores_specification ?? {})
  const constraintsInvitations = Object.keys(configNoteContent.constraints_specification ?? {})
  const referrerText = `all assignments for ${prettyId(configNoteContent.match_group)}`
  const referrerUrl = `/assignments?group=${configNoteContent.match_group}`
  const assignmentLabel = encodeURIComponent(configNoteContent.title)
  const traverseInvitation =
    configNoteContent.status === 'Deployed' && configNoteContent.deployed_assignment_invitation
      ? configNoteContent.deployed_assignment_invitation
      : `${configNoteContent.assignment_invitation},label:${assignmentLabel}`
  let editInvitation = traverseInvitation

  if (options?.editable && configNoteContent.invite_assignment_invitation) {
    editInvitation = `${editInvitation};${configNoteContent.invite_assignment_invitation}`
  }

  if (configNoteContent.custom_max_papers_invitation) {
    editInvitation = `${editInvitation};${configNoteContent.custom_max_papers_invitation},head:ignore`
  }

  return (
    // eslint-disable-next-line prefer-template
    `/edges/browse?traverse=${traverseInvitation}` +
    `&edit=${editInvitation}` +
    `&browse=${configNoteContent.aggregate_score_invitation},label:${assignmentLabel}` +
    `${browseInvitations.length ? `;${browseInvitations.join(';')}` : ''}` +
    `${
      constraintsInvitations.length
        ? `;${constraintsInvitations.map((i) => `${i},head:ignore`).join(';')}`
        : ''
    }` +
    `;${configNoteContent.conflicts_invitation}` +
    (configNoteContent.custom_user_demand_invitation
      ? `;${configNoteContent.custom_user_demand_invitation},tail:ignore`
      : '') +
    (options?.preferredEmailInvitationId
      ? `&preferredEmailInvitationId=${options.preferredEmailInvitationId}`
      : '') +
    (options?.version ? `&version=${options.version}` : '') +
    `&referrer=${encodeURIComponent(`[${referrerText}](${referrerUrl})`)}`
  )
}

// Format essential profile data for display
export function formatProfileContent(profileContent) {
  const name = _.find(profileContent.names, ['preferred', true]) || profileContent.names[0]
  const email = profileContent.preferredEmail || profileContent.emails[0]

  let title
  if (profileContent.history && profileContent.history.length) {
    const position = _.upperFirst(_.get(profileContent.history, '[0].position', '')).trim()
    const institutionName = _.get(profileContent.history, '[0].institution.name', '').trim()
    const institutionDomain = _.get(
      profileContent.history,
      '[0].institution.domain',
      ''
    ).trim()
    const institution = institutionDomain
      ? `${institutionName} (${institutionDomain})`
      : institutionName
    const separator = position && institution ? ' at ' : ''
    title = `${position}${separator}${institution}`
  } else {
    title = _.last(email?.split('@'))
  }

  const expertise = _.flatMap(profileContent.expertise, (entry) => entry.keywords)

  return {
    name,
    email,
    title,
    expertise,
  }
}

function formatNote(note) {
  if (note.invitations) {
    const formattedContent = {}
    Object.keys(note.content).forEach((key) => {
      formattedContent[key] = note.content[key].value
    })
    return {
      id: note.id,
      forum: note.forum,
      invitation: note.invitations[0],
      number: note.number,
      content: formattedContent,
      signatures: note.signatures,
    }
  }
  return {
    id: note.id,
    forum: note.forum,
    invitation: note.invitation,
    number: note.number,
    content: note.content,
    original: note.details ? note.details.original : null,
    signatures: note.signatures,
  }
}

// Returns only the essential data from an entity
export function formatEntityContent(entity, type) {
  switch (type) {
    case 'note':
      return formatNote(entity)

    case 'profile':
      return {
        id: entity.id,
        content: formatProfileContent(entity.content),
      }

    case 'group':
      return {
        id: entity.id,
        name: prettyId(entity.id),
      }

    case 'tag':
      return {} // TODO

    default:
      return {}
  }
}

// Combine all relevant note fields into search corpus
export function buildNoteSearchText(item, isV2Note) {
  const { id, number, content, details } = item
  const searchFields = [id]

  if (number) {
    searchFields.push(`#${number}`)
  }

  if (isV2Note && item.invitations) {
    searchFields.push(item.invitations.map(prettyInvitationId).join('\n'))
  }

  if (content) {
    const omittedContentFields = [
      'pdf',
      'verdict',
      'paperhash',
      'ee',
      'html',
      'year',
      'venueid',
    ]
    Object.keys(content).forEach((field) => {
      if (!content[field] || omittedContentFields.includes(field)) {
        return
      }
      const value = isV2Note ? content[field].value : content[field]
      if (_.isString(value)) {
        searchFields.push(value)
      } else if (Array.isArray(value)) {
        searchFields.push(value.join('\n'))
      }
    })
  }

  if (details?.original) {
    searchFields.push(details.original.content.authors.join('\n'))
    searchFields.push(details.original.content.authorids.join('\n'))
  }

  return searchFields.join('\n')
}

// Combine all relevant profile fields into search corpus
export function buildProfileSearchText(item) {
  const searchFields = [item.id]
  const { names, history, preferredEmail, emailsConfirmed, expertise } = item.content

  if (names?.length > 0) {
    names.forEach((name) => searchFields.push(name.fullname))
  }
  if (history) {
    const { institutionName, institutionDomain } = _.get(history, '[0].institution', {})
    if (institutionName) searchFields.push(institutionName)
    if (institutionDomain) searchFields.push(institutionDomain)
  }
  if (preferredEmail) {
    searchFields.push(preferredEmail)
  }
  if (emailsConfirmed?.length) {
    emailsConfirmed.forEach((email) => {
      searchFields.push(email)
    })
  }
  if (expertise?.length) {
    expertise.forEach((expertiseEntry) => {
      searchFields.push(expertiseEntry.keywords.join('\n'))
    })
  }

  return searchFields.join('\n')
}

// Builds search corpus for any type of entity
export function buildSearchText(item, type, version) {
  switch (type) {
    case 'note':
      return buildNoteSearchText(item, version === 2)

    case 'profile':
      return buildProfileSearchText(item)

    case 'group':
      return '' // TODO

    case 'tag':
      return '' // TODO

    default:
      return ''
  }
}

export function parseEdgeList(str, invitationCategory) {
  if (!str || typeof str !== 'string') {
    return []
  }
  return str
    .split(';')
    .map((edgeStr) => {
      const [invitation, ...paramsStr] = edgeStr.split(',')
      if (!invitation) {
        return null
      }
      const queryParams = _.fromPairs(paramsStr.map((s) => s.split(':')))
      return {
        id: invitation,
        name: invitation.split('/').pop().replace(/_/g, ' '),
        query: queryParams,
        category: invitationCategory,
      }
    })
    .filter((inv) => inv)
}

export function buildInvitationReplyArr(invitation, fieldName, profileId, version) {
  const replyKey = version === 2 ? 'edge' : 'reply'
  if (!(invitation && invitation[replyKey] && invitation[replyKey][fieldName])) {
    return undefined
  }

  const field = invitation[replyKey][fieldName]

  if (version === 2) {
    // API 2 identifies
    if (field.param) {
      if (field.param.regex && field.regex.startsWith('~.*')) {
        return [profileId]
      }
    }

    return field
  }

  if (field.values) {
    return field.values
  }
  if (field['values-regex'] && field['values-regex'].startsWith('~.*')) {
    return [profileId]
  }
  if (field['values-copied']) {
    return field['values-copied']
      .map((groupId) => {
        if (groupId === '{signatures}') {
          return profileId
        }
        // Right now, the only special value other than {signatures} that is
        // supported is {tail}. That value is replaced on the client side
        if (groupId.startsWith('{') && groupId !== '{tail}') {
          return null
        }
        return groupId
      })
      .filter((groupId) => groupId)
  }
  return []
}

export function translateFieldSpec(invitation, fieldName, version) {
  if (version === 2) {
    const field = invitation.edge[fieldName]
    if (!field) {
      return field
    }
    const spec = {
      description: field.description,
      required: field.param?.required,
      default: field.param?.default,
    }
    if (field.param?.type) {
      spec.type = field.param.type
    }
    if (field.param?.withInvitation) {
      spec.query = {
        invitation: field.param.withInvitation,
        domain: invitation.domain,
      }
    }
    if (field.param?.withVenueid) {
      spec.query = {
        'content.venueid': field.param.withVenueid,
        domain: invitation.domain,
      }
    }
    if (field.param?.withContent) {
      spec.localQuery = {
        content: field.param.withContent,
      }
    }
    if (field.param?.const) {
      spec.query = {
        id: field.param.const,
        domain: invitation.domain,
      }
    }
    if (field.param?.inGroup) {
      spec.query = {
        group: field.param.inGroup,
      }
    }
    if (field.param?.notInGroup) {
      spec.query = {
        notInGroup: field.param.notInGroup,
      }
    }
    if (field.param?.options?.group) {
      spec.query = {
        group: field.param.options.group,
      }
    }
    if (field.param?.regex) {
      spec['value-regex'] = field.param.regex
      spec.query = {
        'value-regex': field.param.regex,
      }
    }
    if (field.param?.enum && field.param?.input === 'radio') {
      spec['value-radio'] = field.param.enum
    }
    if (field.param?.enum) {
      spec['value-dropdown'] = field.param.enum
    }
    if (field.param?.input === 'text') {
      spec['value-textbox'] = true
    }
    return spec
  }
  const field = invitation.reply.content[fieldName]
  if (!field) {
    return field
  }
  if (field.type) {
    field.type = field.type.toLowerCase()
  }
  if (field.query?.invitation) {
    field.query.details = 'original'
    field.query.sort = 'number:asc'
  }
  return field
}

export function translateSignatures(invitation, version) {
  if (version === 2) {
    const { signatures } = invitation.edge
    if (Array.isArray(signatures)) {
      return {
        values: undefined,
      }
    }
    if (signatures.param?.regex) {
      return {
        'values-regex': signatures.param.regex,
        default: signatures.param.default,
      }
    }
    if (signatures.param?.items) {
      return {
        items: signatures.param.items,
      }
    }
  }
  return invitation.reply?.signatures
}

// interpolate readers/writers/nonreaders
export function getInterpolatedValues({
  value,
  columnType,
  shouldReplaceHeadNumber,
  paperNumber,
  parentPaperNumber,
  id,
  parentId,
  version,
}) {
  const headPattern = version === 2 ? /\${{head}\.number}/g : /{head\.number}/g
  const tailPattern = version === 2 ? /\${tail}/g : /{tail}/g
  if (version === 2 && Array.isArray(value)) {
    return undefined
  }
  if (Array.isArray(value)) {
    return value.map((v) => {
      let finalV = v
      if (columnType === 'head') {
        finalV = shouldReplaceHeadNumber
          ? finalV.replace(headPattern, paperNumber).replace(tailPattern, parentId) // note
          : finalV.replace(tailPattern, parentId) // profile
      } else if (columnType === 'tail') {
        finalV = finalV.replace(headPattern, parentPaperNumber).replace(tailPattern, id)
      }
      return finalV
    })
  }
  return value
}

export function getInterpretedSignature(value, paperNumber) {
  const headPattern = /\${{\d+\/head}\/number}/g
  return value.replace(headPattern, paperNumber)
}

// get the signature based on the editInvitation and paper number
// (to lookup the correct paper number based on parent(for profile) or entity itself(for Note))
export async function getSignatures(
  editInvitation,
  availableSignaturesInvitationMap,
  paperNumberToLookup,
  user
) {
  if (!editInvitation.signatures) {
    promptError(`signature of ${prettyId(editInvitation.signatures)} should not be empty`)
    return null
  }
  if (editInvitation.signatures.values) {
    return getInterpolatedValues({
      value: editInvitation.signatures.values,
      shouldReplaceHeadNumber: true,
      columnType: 'head',
      paperNumber: paperNumberToLookup,
      version: 2,
    })
  }
  if (editInvitation.signatures['values-regex']?.startsWith('~.*')) return [user?.profile?.id]
  if (editInvitation.signatures['values-regex']) {
    // eslint-disable-next-line max-len
    const invitationMapItem = availableSignaturesInvitationMap.filter(
      (p) => p.invitation === editInvitation.id
    )?.[0]
    if (invitationMapItem?.signature) return invitationMapItem.signature // default value
    const availableSignatures = invitationMapItem?.signatures
    const nonPaperSpecificGroup = availableSignatures?.filter(
      (p) =>
        !(
          editInvitation.submissionName
            ? new RegExp(`(${editInvitation.submissionName})[0-9]\\d*`)
            : /(Paper)[0-9]\d*/
        ).test(p)
    )?.[0]
    if (nonPaperSpecificGroup) return [nonPaperSpecificGroup]
    const paperSpecificGroup = availableSignatures?.filter((q) =>
      q.includes(`${editInvitation.submissionName ?? 'Paper'}${paperNumberToLookup}`)
    )?.[0]
    return paperSpecificGroup ? [paperSpecificGroup] : []
  }
  if (editInvitation.signatures.items) {
    const getGroupsP = editInvitation.signatures.items.map((p) => {
      if (p.prefix) {
        const interpretedPrefix = getInterpretedSignature(p.prefix, paperNumberToLookup)
        return api
          .get('/groups', { prefix: interpretedPrefix, signatory: user?.id })
          .then((result) => result.groups.map((q) => q.id))
      }
      const interpretedValue = getInterpretedSignature(p.value, paperNumberToLookup)
      return api
        .get('/groups', { id: interpretedValue, signatory: user?.id })
        .then((result) => result.groups.map((q) => q.id))
    })
    const signatureResults = (await Promise.all(getGroupsP)).flat()
    return [signatureResults?.[0]]
  }
  if (editInvitation.signatures.values === undefined) {
    return undefined
  }
  return editInvitation.signatures
}

export function getTooltipTitle(existingEdge) {
  if (!existingEdge) return null
  const notModified = existingEdge.modificationDate === existingEdge.creationDate
  const signature = prettyId(existingEdge.signatures[0])
  const creation = dayjs(existingEdge.creationDate).format('MMMM D, YYYY h:mm A')
  const modification = dayjs(existingEdge.modificationDate).format('MMMM D, YYYY h:mm A')
  const title = `Edited by ${signature}; Created:${creation}${
    notModified ? '' : `; Modified:${modification}`
  }`
  return title
}

// hardcoded rule for name/label
export function transformName(name, toVerb = false, pluralForm = false) {
  if (name === 'Proposed Assignment') {
    if (toVerb) return 'Assign'
    if (pluralForm) return 'Assignments'
    return 'Assignment'
  }
  if (name === 'Assignment') {
    if (toVerb) return 'Assign'
  }
  if (name === 'Recommendation') {
    if (toVerb) return 'Recommend'
  }
  if (name === 'Paper Assignment') {
    if (toVerb) return 'Assign'
    return 'Assignments'
  }
  if (name === 'staticList') {
    return 'Items'
  }
  return name
}

export function getInvitationPrefix(invitationId) {
  return invitationId ? invitationId.split('/-')?.[0] : null
}

export function isInGroupInvite(invitation, headOrTail) {
  if (!invitation.id.endsWith('Invite_Assignment')) return false
  if (invitation[headOrTail]?.query?.group) return true
  return false
}

export function isNotInGroupInvite(invitation, headOrTail) {
  if (!invitation.id.endsWith('Invite_Assignment')) return false
  if (invitation[headOrTail]?.query?.notInGroup) return true
  return false
}

// invite invitation using regex
export function isForBothGroupTypesInvite(invitation, headOrTail) {
  if (!invitation.id.endsWith('Invite_Assignment')) return false
  if (invitation[headOrTail]?.query?.group) return false
  if (invitation[headOrTail]?.query?.notInGroup) return false
  return true
}
