/* eslint-disable no-param-reassign */
/* globals $: false */

import _ from 'lodash'
import api from './api-client'
import { getNameString } from './utils'

const superUserSignatures = [process.env.SUPER_USER, '~Super_User1']
let paperSearchResults = []

/**
 * Convert assorted links fields into one object
 *
 * @param {object} profileContent
 * @param {object} profileMeta
 * @param {array} ids
 */
export function formatProfileLinks(profileContent, profileMeta, ids, useLinkObjectFormat) {
  const profileLinkMap = {
    homepage: 'Homepage',
    gscholar: 'Google Scholar',
    dblp: 'DBLP',
    orcid: 'ORCID',
    linkedin: 'LinkedIn',
    wikipedia: 'Wikipedia',
    semanticScholar: 'Semantic Scholar',
  }

  // Used for profile edit page
  if (useLinkObjectFormat) {
    return Object.keys(profileLinkMap).reduce((acc, linkType) => {
      const linkContent = profileContent[linkType]
      if (linkContent) {
        acc[linkType] = {
          value: linkContent,
        }
      }
      return acc
    }, {})
  }

  const links = []
  const excludedSignatures = _.union(superUserSignatures, ids)
  Object.keys(profileLinkMap).forEach((linkType) => {
    const linkContent = profileContent[linkType]
    if (!linkContent) {
      return
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
export function formatProfileData(
  profileData,
  useLinkObjectFormat = false
) {
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
    const fullName = n.fullname
    if (Object.prototype.hasOwnProperty.call(uniqueFullNames, fullName)) {
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

  const prefNameStr = prefName.fullname

  const currInstitution = _.has(profileData, 'content.history[0].institution')
    ? profileData.content.history[0].institution.name
    : null

  const profileFields = ['names', 'emails', 'links', 'history', 'relations', 'expertise']
  const excludedSignatures = _.union(superUserSignatures, ids)

  // Format emails
  const prefEmail = profileData.content.preferredEmail
  profileData.content.emails = profileData.content.emails.map((email) => ({
    email,
    confirmed: _.includes(profileData.content.emailsConfirmed, email),
    preferred: email === prefEmail,
  }))

  // Format profile links
  profileData.content.links = formatProfileLinks(
    profileData.content,
    profileData.metaContent,
    ids,
    useLinkObjectFormat
  )

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
    yearOfBirth: profileData.content.yearOfBirth,
    state: profileData.state,
    readers: profileData.readers,
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
    namesSet.add(getNameString(name))
    return namesSet
  }, new Set())
  const profileUsernames = [
    ...profile.names.map((name) => name.username),
    ...profile.emails.map((email) => email.email),
  ]

  const allAuthors = new Set()
  const authorNameToId = {}
  const authorIdToName = {}
  notes.forEach((note) => {
    if (!note.content.authors) return

    const isV2Note = process.env.API_V2_URL && note.version === 2
    const noteAuthorsValue = isV2Note ? note.content.authors?.value : note.content.authors
    const noteAuthors = noteAuthorsValue?.map((a) => a.replace(/\*|\d$/g, ''))

    for (let i = 0; i < noteAuthors.length; i += 1) {
      const authorName = noteAuthors[i]
      allAuthors.add(authorName)

      const authorId = isV2Note
        ? note.content.authorids?.value && note.content.authorids?.value?.[i]
        : note.content.authorids && note.content.authorids[i]
      if (authorId) {
        if (
          // ~>email>dblp
          authorId.startsWith('~') ||
          (authorId.includes('@') &&
            (!authorNameToId[authorName] || authorNameToId[authorName].startsWith('http'))) ||
          (authorId && !authorNameToId[authorName])
        ) {
          authorNameToId[authorName] = authorId
        }
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

  return _.differenceBy(Array.from(allAuthors), Array.from(excludedNames), (val) =>
    val.toLowerCase()
  )
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

function addAuthorToPaper(
  authorIds,
  authorIndex,
  paperId,
  authorGroupId,
  referenceId,
  accessToken
) {
  const newAuthorIds = authorIds ? [...authorIds] : []
  if (newAuthorIds.length) {
    newAuthorIds.splice(authorIndex, 1, authorGroupId)
  } else {
    newAuthorIds.push(authorGroupId)
  }
  const updateNoteObject = {
    invitation: 'DBLP.org/-/Author_Coreference',
    signatures: [authorGroupId],
    note: {
      id: paperId,
      content: {
        authorids: { value: newAuthorIds }
      }
    }
  }
  return api.post('/notes/edits', updateNoteObject, { accessToken, version: 2 })
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

async function searchPublicationTitle(title, authorIndex, authorNames, venue, accessToken) {
  const paperDoesNotExist = {
    paperExistInOpenReview: false,
    authorNameInAuthorsList: false,
    paperId: null,
    authorIds: null,
  }
  if (paperSearchResults.length === 0) {
    return paperDoesNotExist
  }

  // need to check if title is exact match
  for (let index = 0; index < paperSearchResults.length; index += 1) {
    const note = paperSearchResults[index]
    if (
      note.content &&
      note.content.title?.value &&
      titleNameTransformation(note.content.title?.value) === title
    ) {
      // even if titles match, need to check if authorids field already contains
      // author id at authorIndex and venue also match
      if (
        note.content.authorids?.value &&
        note.content.authorids?.value.length > authorIndex &&
        (!note.content.authorids?.value[authorIndex] ||
          note.content.authorids?.value[authorIndex].startsWith('https://dblp.org')) &&
        note.content.venue?.value === venue
      ) {
        return {
          paperExistInOpenReview: true,
          authorNameInAuthorsList: note.content.authors?.value.some((name) =>
            authorNames.map((authorName) => getNameString(authorName)).includes(name)
          ),
          paperId: note.id,
          authorIds: note.content.authorids?.value,
        }
      }
    }
  }
  // none of the search results are an exact match
  return paperDoesNotExist
}

function xpathSelect(xpathExpression, contextNode) {
  const resultIterator = contextNode.evaluate(
    xpathExpression,
    contextNode,
    null,
    XPathResult.ORDERED_NODE_ITERATOR_TYPE
  )
  const xmlNodes = []
  let node = resultIterator.iterateNext()
  while (node) {
    xmlNodes.push(node)
    node = resultIterator.iterateNext()
  }
  return xmlNodes
}

export async function getDblpPublicationsFromXmlUrl(xmlUrl, profileId, profileNames) {
  const xPathPublicationsSelector =
    '//dblpperson/r/article|//dblpperson/r/inproceedings|//dblpperson/r/proceedings|//dblpperson/r/conference|//dblpperson/r/book|//dblpperson/r/incollection|//dblpperson/r/phdthesis|//dblpperson/r/masterthesis'
  const xPathHomoAuthorSelector = '//dblpperson//person[@publtype="disambiguation"]'
  const xPathAuthorSelector = '//dblpperson/person/author'
  const possibleNames = new Set()
  try {
    const xmlDoc = await $.ajax(xmlUrl)
    const authorPidInXML = xpathSelect('//dblpperson', xmlDoc)[0].getAttribute('pid')
    const publicationNodes = xpathSelect(xPathPublicationsSelector, xmlDoc)
    const homoAuthorName = xpathSelect(xPathHomoAuthorSelector, xmlDoc)?.[0]?.textContent
    const authorNodes = xpathSelect(xPathAuthorSelector, xmlDoc)
    if (homoAuthorName) {
      possibleNames.add(homoAuthorName)
    } else {
      authorNodes?.forEach((authorNode) => possibleNames.add(authorNode?.textContent))
    }

    return {
      notes: publicationNodes.flatMap((publicationNode) => {
        if (publicationNode.getElementsByTagName('author').length === 0) return []

        const authorPids = Array.from(publicationNode.getElementsByTagName('author')).map(
          (p) => p.getAttribute('pid')
        )
        if (authorPids.indexOf(authorPidInXML) === -1) {
          return [] // could be editor
        }
        const originalTitle = publicationNode.getElementsByTagName('title')[0].textContent
        let venue =
          publicationNode.getElementsByTagName('journal')[0]?.textContent ??
          publicationNode.getElementsByTagName('booktitle')[0]?.textContent
        const year = publicationNode.getElementsByTagName('year')[0]?.textContent
        if (year) venue = `${venue} ${year}`
        const authorNames = Object.values(publicationNode.getElementsByTagName('author')).map(
          (p) => p.textContent
        )
        const authorIndex = authorNames.findIndex((name) =>
          profileNames.some((p) => name.includes(p))
        )

        return {
          note: {
            content: {
              dblp: publicationNode.outerHTML,
            },
            invitation: 'dblp.org/-/record',
            readers: ['everyone'],
            writers: ['dblp.org'],
            signatures: [profileId],
          },
          title: originalTitle,
          formattedTitle: titleNameTransformation(originalTitle),
          authorIndex,
          authorNames,
          authorCount: authorPids.length,
          venue,
          year: year ?? 'Unknown',
        }
      }),
      possibleNames: [...possibleNames],
    }
  } catch (error) {
    throw new URIError(`${xmlUrl}`)
  }
}

export async function getAllPapersByGroupId(profileId, accessToken) {
  try {
    const notesList = await api.get(
      '/notes',
      {
        'content.authorids': profileId,
      },
      {
        accessToken, version: 2
      }
    )
    return notesList.notes.map((note) => ({
      id: note.id,
      title: titleNameTransformation(note.content.title?.value),
      authorCount: note.content.authors?.value.length,
      venue: note.content.venue.value,
    }))
  } catch (error) {
    throw new Error('Fetching existing publications from OpenReview failed')
  }
}

export async function postOrUpdatePaper(dblpPublication, profileId, names, accessToken) {
  const tileIdToUpdate =
    names?.find((p) => dblpPublication.note?.content?.dblp?.includes(getNameString(p)))
      ?.username ?? profileId
  const publicationTitleExistInOpenReview = await searchPublicationTitle(
    dblpPublication.formattedTitle,
    dblpPublication.authorIndex,
    names,
    dblpPublication.venue,
    accessToken
  )
  if (
    publicationTitleExistInOpenReview.paperExistInOpenReview &&
    publicationTitleExistInOpenReview.authorNameInAuthorsList
  ) {
    // paper is found in openreview AND name in authors list means this paper is added
    // by a coauthor so just post update of authorids. Currently it's posting a new reference
    // to keep the history if not necessary, get the id of reference and pass to addAuthorToPaper
    return addAuthorToPaper(
      publicationTitleExistInOpenReview.authorIds,
      dblpPublication.authorIndex,
      publicationTitleExistInOpenReview.paperId,
      tileIdToUpdate,
      undefined,
      accessToken
    )
  }
  // paper does not exist in openreview OR paper is found in openreview (by title)
  // but user's name is not in authors list so treat as a new paper and do upload
  // followed by a post to update authorids
  //const dblpPaperNote = await api.post('/notes', dblpPublication.note, { accessToken })
  const authorids = Array(dblpPublication.authorNames.length).fill('')
  authorids[dblpPublication.authorIndex] = tileIdToUpdate
  return api.post('/notes/edits', {
    invitation: 'DBLP.org/-/Record',
    signatures: [profileId],
    content: {
      xml: {
        value: dblpPublication.note.content.dblp,
      }
    },
    note: {
      content: {
        title: { value: dblpPublication.formattedTitle },
        venue: { value: dblpPublication.venue },
        authors: { value: dblpPublication.authorNames },
        authorids: { value: authorids }
      }
    }
  }, { accessToken, version: 2 })
}

// this function is needed if checking for duplicate dblp url
export async function getProfileByDblpUrl(dblpUrl, profileId) {
  try {
    const result = await api.get('/profiles', { dblp: dblpUrl })
    return result.profiles.filter((p) => p.id !== profileId)[0]?.id
  } catch (error) {
    return null
  }
}

export async function getAllPapersImportedByOtherProfiles(
  dblpPublications,
  profileNames,
  accessToken
) {
  const dblpPublicationsGroupedByYear = _.groupBy(dblpPublications, (p) => p.year)
  const searchPapersOfYearPs = Object.entries(dblpPublicationsGroupedByYear).map(
    ([year, papers]) =>
      api.post(
        '/notes/search',
        {
          invitation: 'DBLP.org/-/Record',
          content: {
            title: {
              terms: papers.map((p) => `"${p.title}"`),
            },
            venue:
              year === 'Unknown'
                ? undefined
                : {
                    terms: [year],
                  },
          },
        },
        {
          accessToken,
          version: 2,
        }
      )
  )

  const searchResultByYear = await Promise.all(searchPapersOfYearPs)
  paperSearchResults = searchResultByYear.reduce((prev, curr) => {
    if (curr.count) {
      return prev.concat(curr.notes)
    }
    return prev
  }, [])

  return dblpPublications.flatMap((publication, i) => {
    for (let index = 0; index < paperSearchResults.length; index += 1) {
      const note = paperSearchResults[index]
      if (
        note.content?.title?.value &&
        titleNameTransformation(note.content.title?.value) === publication.title?.value &&
        note.content?.authorids?.value.length === publication.authorCount &&
        note.content?.venue?.value === publication.venue?.value
      ) {
        const authorId = note.content.authorids?.value[publication.authorIndex]
        if (
          authorId &&
          authorId.startsWith('~') &&
          !profileNames.some((p) => p.username === authorId)
        ) {
          return { ...publication, existingProfileId: authorId, noteId: note.id }
        }
      }
    }
    return []
  })
}
