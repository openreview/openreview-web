/* eslint-disable no-param-reassign */
/* globals $: false */

import { nanoid } from 'nanoid'
import _ from 'lodash'
import dayjs from 'dayjs'
import api from './api-client'
import { deburrString, getNameString } from './utils'

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
    aclanthology: 'ACL Anthology',
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
 * @param {object} options
 * @param {boolean} options.useLinkObjectFormat // for profile edit page
 * @param {boolean} options.includePastStates // whether to include pastStates, only for profile preview in moderation
 */
export function formatProfileData(profileData, options = {}) {
  if (_.isEmpty(profileData)) {
    return {}
  }
  const { useLinkObjectFormat = false, includePastStates = false } = options

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
  profileData.content.emails = (profileData.content.emails ?? []).map((email) => ({
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

  // Format cdate
  const createdDate = new Date(profileData.cdate ?? profileData.tcdate).toLocaleString(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    }
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
    pronouns: profileData.content.pronouns,
    preferredName: prefNameStr,
    preferredEmail: prefEmail,
    currentInstitution: currInstitution,
    yearOfBirth: profileData.content.yearOfBirth,
    state: profileData.state,
    readers: profileData.readers,
    joined: createdDate,
    ...(includePastStates ? { pastStates: profileData.pastStates } : {}),
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

    const isV2Note = note.version === 2
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
  isV1Note
) {
  if (isV1Note) {
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
    return api.post('/notes', updateNoteObject, { version: 1 })
  }
  const updateNoteObject = {
    invitation: 'DBLP.org/-/Author_Coreference',
    signatures: [authorGroupId],
    note: {
      id: paperId,
    },
    content: {
      author_index: { value: authorIndex },
      author_id: { value: authorGroupId },
    },
  }
  return api.post('/notes/edits', updateNoteObject)
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

async function searchPublicationTitle(title, authorIndex, authorNames, venue) {
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
    const noteTitle = note.version === 2 ? note.content.title?.value : note.content.title
    if (noteTitle && titleNameTransformation(noteTitle) === title) {
      // even if titles match, need to check if authorids field already contains
      // author id at authorIndex and venue also match
      const noteAuthorIds =
        note.version === 2 ? note.content.authorids?.value : note.content.authorids
      const noteAuthors =
        note.version === 2 ? note.content.authors?.value : note.content.authors
      const noteVenue = note.version === 2 ? note.content.venue?.value : note.content.venue
      if (
        noteAuthorIds &&
        noteAuthorIds.length > authorIndex &&
        (!noteAuthorIds[authorIndex] ||
          noteAuthorIds[authorIndex].startsWith('https://dblp.org')) &&
        noteVenue === venue
      ) {
        return {
          paperExistInOpenReview: true,
          authorNameInAuthorsList: noteAuthors.some((name) =>
            authorNames.map((authorName) => getNameString(authorName)).includes(name)
          ),
          paperId: note.id,
          authorIds: noteAuthorIds,
          isV1Note: note.version !== 2,
        }
      }
    }
  }
  // none of the search results are an exact match
  return paperDoesNotExist
}

export function xpathSelect(xpathExpression, contextNode, atomNameSpace = false) {
  const resultIterator = contextNode.evaluate(
    xpathExpression,
    contextNode,
    atomNameSpace ? () => 'http://www.w3.org/2005/Atom' : null,
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
        const authorIndex = authorNames.findIndex((name) => {
          const deburredName = deburrString(name, false)
          return profileNames.some((p) => deburredName.includes(deburrString(p, false)))
        })

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

export async function getAllPapersByGroupId(profileId) {
  try {
    const v1Notes = await api
      .getAll(
        '/notes',
        { 'content.authorids': profileId, invitation: 'dblp.org/-/record' },
        { version: 1 }
      )
      .then((notes) =>
        notes.map((note) => ({
          id: note.id,
          title: titleNameTransformation(note.content.title),
          authorCount: note.content.authors?.length,
          venue: note.content.venue,
        }))
      )
    const v2Notes = await api
      .getAll('/notes', { 'content.authorids': profileId, invitation: 'DBLP.org/-/Record' })
      .then((notes) =>
        notes.map((note) => ({
          id: note.id,
          title: titleNameTransformation(note.content.title?.value),
          authorCount: note.content.authors?.value.length,
          venue: note.content.venue.value,
        }))
      )
    return v1Notes.concat(v2Notes)
  } catch (error) {
    throw new Error('Fetching existing publications from OpenReview failed')
  }
}

export async function postOrUpdatePaper(dblpPublication, profileId, names) {
  const tileIdToUpdate =
    names?.find((p) => dblpPublication.note?.content?.dblp?.includes(getNameString(p)))
      ?.username ?? profileId
  const publicationTitleExistInOpenReview = await searchPublicationTitle(
    dblpPublication.formattedTitle,
    dblpPublication.authorIndex,
    names,
    dblpPublication.venue
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
      publicationTitleExistInOpenReview.isV1Note
    )
  }
  // paper does not exist in openreview OR paper is found in openreview (by title)
  // but user's name is not in authors list so treat as a new paper and do upload
  // followed by a post to update authorids
  const authorids = Array(dblpPublication.authorNames.length).fill('')
  authorids[dblpPublication.authorIndex] = tileIdToUpdate

  return api.post('/notes/edits', {
    invitation: 'DBLP.org/-/Record',
    signatures: [profileId],
    content: {
      xml: {
        value: dblpPublication.note.content.dblp,
      },
    },
    note: {
      content: {
        title: { value: dblpPublication.title },
        venue: { value: dblpPublication.venue },
        authors: { value: dblpPublication.authorNames },
        authorids: { value: authorids },
      },
    },
  })
}

export async function getAllPapersImportedByOtherProfiles(dblpPublications, profileNames) {
  const dblpPublicationsGroupedByYear = _.groupBy(dblpPublications, (p) => p.year)
  const searchPapersOfYearPs = Object.entries(dblpPublicationsGroupedByYear).map(
    ([year, papers]) => [
      api.post('/notes/search', {
        invitation: 'DBLP.org/-/Record',
        content: {
          title: { terms: papers.map((p) => `"${p.title}"`) },
          venue: year === 'Unknown' ? undefined : { terms: [year] },
        },
      }),
      api.post(
        '/notes/search',
        {
          invitation: 'dblp.org/-/record',
          content: {
            title: { terms: papers.map((p) => `"${p.title}"`) },
            venue: year === 'Unknown' ? undefined : { terms: [year] },
          },
        },
        {
          version: 1,
        }
      ),
    ]
  )

  const searchResultByYear = await Promise.all(searchPapersOfYearPs.flat())
  paperSearchResults = searchResultByYear.flat().reduce((prev, curr) => {
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
        titleNameTransformation(note.content.title?.value) === publication.title &&
        note.content?.authorids?.value.length === publication.authorCount &&
        note.content?.venue?.value === publication.venue
      ) {
        const authorId = note.content.authorids?.value[publication.authorIndex]
        if (
          authorId &&
          authorId.startsWith('~') &&
          !profileNames.some((p) => p.username === authorId)
        ) {
          return { ...publication, existingProfileId: authorId, noteId: note.id }
        }
      } else if (
        note.content?.title &&
        titleNameTransformation(note.content.title) === publication.title &&
        note.content?.authorids?.length === publication.authorCount &&
        note.content?.venue === publication.venue
      ) {
        const authorId = note.content.authorids[publication.authorIndex]
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

export async function getOrcidPublicationsFromJsonUrl(orcid, profileNames) {
  const personUrl = `https://pub.orcid.org/v3.0/${orcid}/person`
  const worksUrl = `https://pub.orcid.org/v3.0/${orcid}/works`

  let personJson
  try {
    personJson = await $.ajax({
      url: personUrl,
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new Error(`ORCID ID ${orcid} is not found`)
  }

  const familyName = personJson.name['family-name']?.value?.trim()
  const givenName = personJson.name['given-names']?.value?.trim()
  const creditName = personJson.name['credit-name']?.value?.trim()
  const otherNames = personJson['other-names']['other-name'].map((p) => p.content.trim())
  const allNames = [
    ...otherNames,
    `${givenName}${familyName ? ` ${familyName}` : ''}`,
    creditName,
  ]
  if (!profileNames.some((p) => allNames.includes(p))) {
    // user is using other people's orcid
    throw new Error('Your profile name must match with the ORCID url')
  }

  const worksJson = await $.ajax({
    url: worksUrl,
    headers: {
      Accept: 'application/json',
    },
  })

  const allPublicationPutCodes = worksJson.group?.flatMap((p) => {
    const doi = p['work-summary']?.[0]?.['external-ids']?.['external-id']?.find(
      (q) => q['external-id-type'] === 'doi' && q['external-id-value']
    )
    if (
      p['work-summary']?.[0]?.source?.['source-orcid'] || // personal source
      p['work-summary']?.[0]?.source?.['assertion-origin-orcid'] || // personal claim
      !doi || // no doi, won't get external id
      !p['work-summary']?.[0]?.['publication-date'] // no publication date
    )
      return []
    return p['work-summary']?.[0]?.['put-code'] // put-code is required to get publication json
  })

  const uniquePublicationPutCodes = [...new Set(allPublicationPutCodes)]

  if (!uniquePublicationPutCodes.length) {
    throw new Error(
      'No publications to import. Only publications posted by publishers can be imported.'
    )
  }

  const batchSize = 100 // max 100 allowed by ORCID
  const batchCount = Math.ceil(uniquePublicationPutCodes.length / batchSize)

  const batchIds = Array.from(new Array(batchCount), (_e, index) => {
    const idsInBatch = uniquePublicationPutCodes
      .slice(index * batchSize, (index + 1) * batchSize)
      .join(',')
    const publicationDetailsUrl = `https://pub.orcid.org/v3.0/${orcid}/works/${idsInBatch}`
    return $.ajax({
      url: publicationDetailsUrl,
      headers: {
        Accept: 'application/json',
      },
    }).then((result) => result.bulk || [])
  })

  const publicationRecords = (await Promise.all(batchIds)).flat()

  const publications = []
  publicationRecords
    .flatMap((p) => (p.error ? [] : p.work))
    .forEach((workNode) => {
      const title = workNode.title?.title?.value
      const abstract = workNode['short-description']?.value
      const authorNames = workNode.contributors?.contributor
        .map((p) => p['credit-name'].value)
        ?.map((p) => p.replace(/,/g, '').trim())
      const contributorOrcids = workNode.contributors?.contributor.map(
        (p) => p['contributor-orcid']?.path
      )

      if (!authorNames) return
      const html = workNode.url?.value
      const cdate = workNode['created-date']?.value
      const mdate = workNode['last-modified-date']?.value
      const year = workNode['publication-date']?.year?.value
      const source = workNode.source?.['source-name']?.value
      const doiId = workNode['external-ids']['external-id']
        .find((p) => p['external-id-type'] === 'doi')
        ['external-id-value'].toLowerCase()
      const journalTitle = workNode['journal-title']?.value
      const venue = [journalTitle, source].filter(Boolean)[0]
      let authorIndex = authorNames.findIndex((name) => {
        const deburredName = deburrString(name, false)
        return profileNames.some((p) => deburredName === deburrString(p, false))
      })
      if (authorIndex === -1)
        authorIndex = contributorOrcids?.findIndex((creditOrcid) => creditOrcid === orcid)

      publications.push({
        key: nanoid(),
        title,
        json: workNode,
        externalId: `doi:${doiId}`,
        formattedTitle: titleNameTransformation(title),
        abstract,
        authorNames,
        html,
        cdate: dayjs(cdate).valueOf(),
        mdate: dayjs(mdate).valueOf(),
        authorIndex,
        authorCount: authorNames.length,
        venue,
        ...(source !== venue && { source }),
        year,
      })
    })
  return publications
}

export async function getAllOrcidPapers(profileId) {
  try {
    const result = await api
      .getAll('/notes', {
        'content.authorids': profileId,
        invitation: `${process.env.SUPER_USER}/Public_Article/ORCID.org/-/Record`,
      })
      .then((notes) =>
        notes.map((note) => ({
          id: note.id,
          title: titleNameTransformation(note.content.title?.value),
          authorCount: note.content.authors?.value.length,
          venue: note.content.venue.value,
          externalId: note.externalIds.find((p) => p.startsWith('doi:')),
        }))
      )
    return result
  } catch (error) {
    throw new Error('Fetching existing publications from OpenReview failed')
  }
}

export async function postOrUpdateOrcidPaper(profileId, profileNames, publication) {
  // check if paper has been imported
  const { notes: existingNotesInOpenReview } = await api.get('/notes', {
    externalId: publication.externalId,
  })
  const existingNoteInOpenReview = existingNotesInOpenReview?.[0]
  if (existingNoteInOpenReview) {
    return api.post('/notes/edits', {
      invitation: `${process.env.SUPER_USER}/Public_Article/-/Authorship_Claim`,
      signatures: [profileId],
      note: {
        id: existingNoteInOpenReview.id,
      },
      content: {
        author_index: {
          value: publication.authorIndex,
        },
        author_id: {
          value:
            profileNames?.find((p) => publication.authorNames?.includes(getNameString(p)))
              ?.username ?? profileId,
        },
      },
    })
  }
  // new paper
  const authorIds = Array(publication.authorNames.length).fill('')
  authorIds[publication.authorIndex] =
    profileNames?.find((p) => publication.authorNames?.includes(getNameString(p)))?.username ??
    profileId

  return api.post('/notes/edits', {
    invitation: `${process.env.SUPER_USER}/Public_Article/ORCID.org/-/Record`,
    signatures: [profileId],
    content: {
      json: {
        value: publication.json,
      },
    },
    note: {
      content: {
        title: { value: publication.title },
        authors: { value: publication.authorNames },
        authorids: { value: authorIds },
        venue: { value: publication.venue },
      },
      externalId: publication.externalId,
    },
  })
}

export function getImportSourceIcon(invitation) {
  switch (invitation) {
    case 'DBLP.org/-/Record':
    case `${process.env.SUPER_USER}/Public_Article/DBLP.org/-/Record`:
      return (
        <img
          src="/images/dblp.svg"
          alt="DBLP"
          width={16}
          height={16}
          className="import-source-icon"
        />
      )
    case `${process.env.SUPER_USER}/Public_Article/ORCID.org/-/Record`:
      return (
        <img
          src="/images/orcid.png"
          alt="ORCID"
          width={16}
          height={16}
          className="import-source-icon"
        />
      )
    case `${process.env.SUPER_USER}/Public_Article/arXiv.org/-/Record`:
      return (
        <img
          src="/images/arxiv.png"
          alt="arXiv"
          width={16}
          height={16}
          className="import-source-icon"
        />
      )
    default:
      return null
  }
}
