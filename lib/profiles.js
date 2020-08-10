/* eslint-disable no-param-reassign */
/* globals $: false */
/* globals wgxpath: false */

import _ from 'lodash'
import api from './api-client'

const superUserSignatures = [process.env.SUPER_USER, '~Super_User1']

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
  const primaryId = profileData.id
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
    id: primaryId,
    preferredId: prefName.username,
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

function addAuthorToPaper(authorIds, authorIndex, paperId, authorGroupId, referenceId, accessToken) {
  const newAuthorIds = authorIds ? [...authorIds] : []
  if (newAuthorIds.length) {
    newAuthorIds.splice(authorIndex, 1, authorGroupId)
  } else {
    newAuthorIds.push(authorGroupId)
  }
  const updateNoteObject = {
    id: referenceId,
    referent: paperId,
    invitation: 'dblp.org/-/author_coreference',
    signatures: [authorGroupId],
    readers: ['everyone'],
    writers: [],
    content: {
      authorids: newAuthorIds,
    },
  }
  // return Webfield.post('/notes', updateNoteObject)
  return api.post('/notes', updateNoteObject, { accessToken })
}

// this function is for equal comparison of dblp publication titles and openreview note titles
function titleNameTransformation(title) {
  if (typeof title !== 'string') {
    return ''
  }
  let formattedTitle = title.trim().toLowerCase().replace('^', '')
  if (formattedTitle.endsWith('.')) {
    formattedTitle = formattedTitle.slice(0, -1)
  }
  return formattedTitle
}

async function searchPublicationTitle(title, authorIndex, authorNames, accessToken) {
  const searchResults = await api.get('/notes/search', {
    term: title,
    invitation: 'dblp.org/-/record',
  }, {
    accessToken,
  })
  const paperDoesNotExist = {
    paperExistInOpenReview: false,
    authorNameInAuthorsList: false,
    paperId: null,
    authorIds: null,
  }
  if (searchResults.count === 0) {
    return paperDoesNotExist
  }

  // need to check if title is exact match
  for (let index = 0; index < searchResults.notes.length; index += 1) {
    const note = searchResults.notes[index]
    if (note.content && note.content.title && titleNameTransformation(note.content.title) === title) {
      // even if titles match, need to check if authorids field already contains
      // author id at authorIndex
      if (note.content.authorids && note.content.authorids.length > authorIndex && (!note.content.authorids[authorIndex] || note.content.authorids[authorIndex].startsWith('https://dblp.org'))) {
        return {
          paperExistInOpenReview: true,
          authorNameInAuthorsList: note.content.authors.some(name => authorNames.includes(name)),
          paperId: note.forum,
          authorIds: note.content.authorids,
        }
      }
    }
  }
  // none of the search results are an exact match
  return paperDoesNotExist
}

function xpathSelect(xpathExpression, contextNode) {
  if (!document.evaluate) wgxpath.install() // add document.evaluate support for ie11
  const resultIterator = contextNode.evaluate(
    xpathExpression, contextNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE,
  )
  const xmlNodes = []
  let node = resultIterator.iterateNext()
  while (node) {
    xmlNodes.push(node)
    node = resultIterator.iterateNext()
  }
  return xmlNodes
}

export async function getDblpPublicationsFromXmlUrl(xmlUrl, profileId) {
  const xPathPublicationsSelector = '//dblpperson/r/article|//dblpperson/r/inproceedings|//dblpperson/r/proceedings|//dblpperson/r/conference|//dblpperson/r/book|//dblpperson/r/incollection|//dblpperson/r/phdthesis|//dblpperson/r/masterthesis'
  try {
    const xmlDoc = await $.ajax(xmlUrl)
    const authorPidInXML = xpathSelect('//dblpperson', xmlDoc)[0].getAttribute('pid')
    const publicationNodes = xpathSelect(xPathPublicationsSelector, xmlDoc)
    const serializer = new XMLSerializer()
    return publicationNodes.filter(publicationNode => publicationNode.getElementsByTagName('author').length > 0).map((publicationNode) => {
      const authorPids = Array.from(publicationNode.getElementsByTagName('author')).map(p => p.getAttribute('pid'))
      if (authorPids.indexOf(authorPidInXML) === -1) {
        throw new URIError(`${xmlUrl}`)
      }
      const originalTitle = publicationNode.getElementsByTagName('title')[0].textContent

      return {
        note: {
          content: {
            dblp: serializer.serializeToString(publicationNode), // call publicationNode.outerHTML when droping ie11 support
          },
          invitation: 'dblp.org/-/record',
          readers: ['everyone'],
          writers: ['dblp.org'],
          signatures: [profileId],
        },
        title: originalTitle,
        formattedTitle: titleNameTransformation(originalTitle),
        authorIndex: authorPids.indexOf(authorPidInXML),
        authorNames: Object.values(publicationNode.getElementsByTagName('author')).map(p => p.textContent),
      }
    })
  } catch (error) {
    throw new URIError(`${xmlUrl}`)
  }
}

export async function getAllPapersByGroupId(profileId, accessToken) {
  try {
    const notesList = await api.get('/notes', {
      'content.authorids': profileId,
      cache: false,
    }, {
      accessToken,
    })
    return notesList.notes.map(note => ({
      id: note.id,
      title: titleNameTransformation(note.content.title),
    }))
  } catch (error) {
    throw new Error('Fetching existing publications from OpenReview failed')
  }
}

export async function postOrUpdatePaper(dblpPublication, profileId, names, accessToken) {
  const publicationTitleExistInOpenReview = await searchPublicationTitle(
    dblpPublication.formattedTitle, dblpPublication.authorIndex, names, accessToken,
  )
  if (publicationTitleExistInOpenReview.paperExistInOpenReview
    && publicationTitleExistInOpenReview.authorNameInAuthorsList) {
    // paper is found in openreview AND name in authors list means this paper is added
    // by a coauthor so just post update of authorids. Currently it's posting a new reference
    // to keep the history if not necessary, get the id of reference and pass to addAuthorToPaper
    return addAuthorToPaper(
      publicationTitleExistInOpenReview.authorIds,
      dblpPublication.authorIndex,
      publicationTitleExistInOpenReview.paperId,
      profileId,
      undefined,
      accessToken,
    )
  }
  // paper does not exist in openreview OR paper is found in openreview (by title)
  // but user's name is not in authors list so treat as a new paper and do upload
  // followed by a post to update authorids
  // const dblpPaperNote = await Webfield.post('/notes', dblpPublication.note)
  const dblpPaperNote = await api.post('/notes', dblpPublication.note, { accessToken })
  return addAuthorToPaper(
    dblpPaperNote.content.authorids,
    dblpPublication.authorIndex,
    dblpPaperNote.id,
    profileId,
    undefined,
    accessToken,
  )
}
