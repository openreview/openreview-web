/* eslint-disable no-param-reassign */

import _ from 'lodash'

const superUserSignatures = ['OpenReview.net', '~Super_User1']

/**
 * Convert assorted links fields into one object
 *
 * @param {object} profileContent
 * @param {object} profileMeta
 * @param {array} ids
 */
export function formatProfileLinks(profileContent, profileMeta, ids) {
  const profileLinkMap = {
    homepage: 'Homepage',
    gscholar: 'Google Scholar',
    dblp: 'DBLP',
    orcid: 'ORCID',
    linkedin: 'LinkedIn',
    wikipedia: 'Wikipedia',
  }
  const links = []
  const excludedSignatures = _.union(superUserSignatures, ids)

  Object.keys(profileLinkMap).forEach((linkType) => {
    let linkContent = profileContent[linkType]
    if (!linkContent) {
      return
    }

    if (linkContent.toLowerCase().indexOf('http') !== 0) {
      linkContent = `http://${linkContent}`
    }

    const linkMetaUnformatted = profileMeta ? profileMeta[linkType] : null
    let linkMetaFormatted = null
    if (linkMetaUnformatted) {
      const diffSigs = _.difference(linkMetaUnformatted.signatures, excludedSignatures)
      const userConfirmed = !_.isEmpty(_.intersection(linkMetaUnformatted.signatures, ids))
      if (diffSigs.length) {
        linkMetaFormatted = { signatures: diffSigs, confirmed: userConfirmed }
      }
    }

    links.push({
      name: profileLinkMap[linkType],
      key: linkType,
      url: linkContent,
      meta: linkMetaFormatted,
    })
  })
  return links
}

/**
 * Process raw profile data returned by /profiles API
 *
 * @param {object} profileData
 */
export function formatProfileData(profileData) {
  if (_.isEmpty(profileData)) {
    return {}
  }

  const ids = []
  const uniqueFullNames = {}
  const prefId = profileData.id
  let prefName = _.first(profileData.content.names)
  profileData.content.names.forEach((n, i) => {
    if (n.username) {
      ids.push(n.username)
      if (n.preferred) {
        prefName = n
      }
    }

    n.altUsernames = []
    const fullName = [n.first, n.middle, n.last].join(' ')
    if (uniqueFullNames[fullName]) {
      const existingIdx = uniqueFullNames[fullName]
      const prevName = profileData.content.names[existingIdx]

      if (n.preferred) {
        uniqueFullNames[fullName] = i
        prevName.duplicate = true
        n.altUsernames = _.clone(prevName.altUsernames)
        n.altUsernames.unshift(prevName.username)
      } else {
        n.duplicate = true
        prevName.altUsernames.push(n.username)
      }
    } else {
      uniqueFullNames[fullName] = i
    }
  })

  const prefNameStr = [prefName.first, prefName.middle, prefName.last]
    .filter(str => str)
    .join(' ')

  const currInstitution = _.has(profileData, 'content.history[0].institution')
    ? profileData.content.history[0].institution.name
    : null

  const profileFields = ['names', 'emails', 'links', 'history', 'relations', 'expertise']
  const excludedSignatures = _.union(superUserSignatures, ids)

  // Format emails
  const prefEmail = profileData.content.preferredEmail
  profileData.content.emails = profileData.content.emails.map(email => ({
    email,
    confirmed: _.includes(profileData.content.emailsConfirmed, email),
    preferred: email === prefEmail,
  }))

  // Format profile links
  profileData.content.links = formatProfileLinks(profileData.content, profileData.metaContent, ids)

  // Add metaContent data to profile fields
  if (!_.isEmpty(profileData.metaContent)) {
    let diffSigs
    let userConfirmed
    for (let j = 0; j < profileFields.length; j += 1) {
      const metaContent = profileData.metaContent[profileFields[j]]
      const profileContent = profileData.content[profileFields[j]]

      if (profileContent && metaContent) {
        for (let k = 0; k < profileContent.length; k += 1) {
          diffSigs = []
          userConfirmed = []

          if (k < metaContent.length) {
            diffSigs = _.difference(metaContent[k].signatures, excludedSignatures)
            userConfirmed = !_.isEmpty(_.intersection(metaContent[k].signatures, ids))
          }

          if (diffSigs.length) {
            profileContent[k].meta = { signatures: diffSigs, confirmed: userConfirmed }
          }
        }
      }
    }
  }

  return Object.assign(_.pick(profileData.content, profileFields), {
    id: prefId,
    gender: profileData.content.gender,
    preferredName: prefNameStr,
    preferredEmail: prefEmail,
    currentInstitution: currInstitution,
  })
}

/**
 * Build list of all of a given users co-authors from an array of notes. The
 * user specified by profile should be an author of all the notes in notes
 *
 * @param {object} profile - the profile of the user who's co-authors are being computed
 * @param {object[]} notes - the list of notes the user specified by profile has authored
 */
export function getCoAuthorsFromPublications(profile, notes) {
  const excludedNames = profile.names.reduce((namesSet, name) => {
    if (name.middle) {
      namesSet.add(`${name.first} ${name.middle} ${name.last}`)
    }
    namesSet.add(`${name.first} ${name.last}`)
    return namesSet
  }, new Set())
  const profileUsernames = [
    ...profile.names.map(name => name.username), ...profile.emails.map(email => email.email),
  ]

  const allAuthors = new Set()
  const authorNameToId = {}
  const authorIdToName = {}
  notes.forEach((note) => {
    if (!note.content.authors) return

    const noteAuthors = note.content.authors.map(a => a.replace(/\*|\d$/g, ''))

    for (let i = 0; i < noteAuthors.length; i += 1) {
      const authorName = noteAuthors[i]
      allAuthors.add(authorName)

      const authorId = note.content.authorids && note.content.authorids[i]
      if (authorId) {
        authorNameToId[authorName] = authorId
        if (authorIdToName[authorId] && authorIdToName[authorId] !== authorName) {
          excludedNames.add(authorName)
        } else if (profileUsernames.includes(authorId)) {
          excludedNames.add(authorName)
        } else {
          authorIdToName[authorId] = authorName
        }
      }
    }
  })

  return _.differenceBy(Array.from(allAuthors), Array.from(excludedNames), val => val.toLowerCase())
    .sort()
    .map((author) => {
      const authorId = authorNameToId[author]
      const key = authorId && authorId.startsWith('~') ? 'id' : 'email'
      return {
        name: author,
        [key]: authorId,
      }
    })
}
