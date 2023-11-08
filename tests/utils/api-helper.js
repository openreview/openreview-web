/* eslint-disable no-use-before-define */

import fetch from 'node-fetch-cjs'
import { loadEnvConfig } from '@next/env'
import api from '../../lib/api-client'

loadEnvConfig(process.cwd())

api.configure({ fetchFn: fetch })

// #region exported constants
export const superUserName = 'openreview.net'
export const strongPassword = 'Or$3cur3P@ssw0rd'
export const baseGroupId = 'TestVenue'
export const subGroupId = 'TestVenue/2020'
export const conferenceGroupId = 'TestVenue/2020/Conference'
export const conferenceSubmissionInvitationId = `${conferenceGroupId}/-/Submission`

export const hasTaskUser = {
  fullname: 'FirstA LastA',
  email: 'a@a.com',
  password: strongPassword,
  tildeId: '~FirstA_LastA1',
}
export const hasNoTaskUser = {
  fullname: 'FirstB LastB',
  email: 'b@b.com',
  password: strongPassword,
  tildeId: '~FirstB_LastB1',
}
export const inactiveUser = {
  fullname: 'FirstC LastC',
  email: 'c@c.com',
  password: strongPassword,
  activate: false,
}
export const inActiveUserNoPassword = {
  fullname: 'FirstD LastD',
  email: 'd@d.com',
  tildeId: '~FirstD_LastD1',
}
export const inActiveUserNoPasswordNoEmail = {
  fullname: 'FirstE LastE',
  tildeId: '~FirstE_LastE1',
}
// #endregion

// this should be move to openreview-py
export async function setupProfileViewEdit(superUserToken) {
  // add group dblp.org
  const dblpGroupJson = {
    id: 'dblp.org',
    signatures: ['~Super_User1'],
    signatories: [],
    readers: ['everyone'],
    writers: ['dblp.org'],
    members: [],
  }
  await createGroup(dblpGroupJson, superUserToken)
  // add invitation dblp.org/-/record
  const dblpRecordInvitationJson = {
    id: 'dblp.org/-/record',
    reply: {
      readers: {
        values: ['everyone'],
      },
      writers: {
        values: ['dblp.org'],
      },
      signatures: {
        'values-regex': 'dblp.org|~.*',
      },
      content: {
        dblp: {
          'value-regex': '(.*\\n)+.*',
        },
      },
    },
    final: [],
    signatures: ['dblp.org'],
    readers: ['everyone'],
    writers: ['dblp.org'],
    invitees: ['~'],
    // eslint-disable-next-line no-useless-escape
    transform:
      "function (note) {\n  var removeDigitsRegEx = /\\s\\d{4}$/;\n  var removeTrailingPeriod = /[\\.]$/;\n  var et = require('elementtree');\n  var XML = et.XML;\n\n  var entryTypes = {\n    'article': {\n      'description': 'An article from a journal or magazine.',\n      'required': ['author', 'title', 'journal', 'year'],\n      'optional': ['key', 'volume', 'number', 'pages', 'month', 'note']\n    },\n    'book': {\n      'description': 'A book with an explicit publisher',\n      'required': ['author|editor', 'title', 'publisher'],\n      'optional': ['key', 'volume|number', 'series', 'address', 'edition', 'month', 'year', 'note']\n    },\n    'booklet': {\n      'description': 'A work that is printed and bound, but without a named publisher or sponsoring institution.',\n      'required': ['title'],\n      'optional': ['key', 'author', 'howpublished', 'address', 'month', 'year', 'note']\n    },\n    'conference': {\n      'description': 'The same as @inproceedings',\n      'required': ['author', 'title', 'booktitle', 'year'],\n      'optional': ['key', 'editor', 'volume|number', 'series', 'pages', 'address', 'month', 'organization', 'publisher', 'note']\n    },\n    'inbook': {\n      'description': 'A part of a book, which may be a chapter (or section or whatever) and/or a range of pages.',\n      'required': ['author|editor', 'title', 'chapter|pages', 'publisher', 'year'],\n      'optional': ['key', 'volume|number', 'series', 'type', 'address', 'edition', 'month', 'note']\n    },\n    'incollection': {\n      'description': 'A part of a book having its own title.',\n      'required': ['author', 'title', 'booktitle', 'publisher', 'year'],\n      'optional': ['key', 'editor', 'volume|number', 'series', 'type', 'chapter', 'pages', 'address', 'edition', 'month', 'note']\n    },\n    'inproceedings': {\n      'description': 'An article in a conference proceedings.',\n      'required': ['author', 'title', 'booktitle', 'year'],\n      'optional': ['key', 'editor', 'volume|number', 'series', 'pages', 'address', 'month', 'organization', 'publisher', 'note']\n    },\n    'manual': {\n      'description': 'Technical documentation.',\n      'required': ['title'],\n      'optional': ['key', 'author', 'organization', 'address', 'edition', 'month', 'year', 'note']\n    },\n    'mastersthesis': {\n      'description': 'A Master\\'s thesis',\n      'required': [ 'author', 'title', 'school', 'year'],\n      'optional': ['key', 'type', 'address', 'month', 'note']\n    },\n    'misc': {\n      'description': 'Use this type when nothing else fits.',\n      'required': [],\n      'optional': ['key', 'author', 'title', 'howpublished', 'month', 'year', 'note']\n    },\n    'phdthesis': {\n      'description': 'A PhD thesis.',\n      'required': [ 'author', 'title', 'school', 'year'],\n      'optional': ['key', 'type', 'address', 'month', 'note']\n    },\n    'proceedings': {\n      'description': 'The proceedings of a conference.',\n      'required': ['title', 'year'],\n      'optional': ['key', 'editor', 'volume|number', 'series', 'address', 'month', 'organization', 'publisher', 'note']\n    },\n    'techreport': {\n      'description': 'A report published by a school or other institution, usually numbered within a series.',\n      'required': ['author', 'title', 'institution', 'year'],\n      'optional': ['key', 'type', 'number', 'address', 'month', 'note']\n    },\n    'unpublished': {\n      'description': 'A document having an author and title, but not formally published.',\n      'required': ['author', 'title', 'note'],\n      'optional': ['key', 'month', 'year']\n    }\n  };\n\n  var firstOrNull = function(array){\n    if (array.length > 0){\n      return array[0].text;\n    } else {\n      return null;\n    }\n  };\n\n  var firstOrNullTitle = function(array){\n    if (array.length > 0){\n      let title = '';\n      array[0].itertext( function(text){\n        title = title + text;\n      });\n      return title;\n    } else {\n      return null;\n    }\n  };\n\n  var getEntryElement = function(xmlString) {\n    var tree = new et.ElementTree(XML(xmlString));\n    var root = tree.getroot();\n    var entryElement;\n\n    if (root.tag === 'dblp') {\n      var children = root._children\n\n      if (children.length === 1) {\n        entryElement = children[0];\n      } else {\n        console.log('something went wrong');\n      }\n    } else {\n      entryElement = tree.getroot();\n    }\n\n    return entryElement;\n  };\n\n  var entryToData = function(entryElement) {\n    var data = {};\n\n    data.type = entryElement.tag;\n    data.key = entryElement.attrib.key;\n    data.publtype = entryElement.attrib.publtype\n\n    data.authors = [];\n    data.authorids = [];\n    entryElement.iter('author', function(element){\n      data.authors.push(element.text.replace(removeDigitsRegEx, '').replace('(','').replace(')',''));\n      data.authorids.push(\n        'https://dblp.org/search/pid/api?q=author:' + element.text.split(' ').join('_') + ':')\n    })\n\n    data.title = firstOrNullTitle(entryElement.findall('title')).replace('\\n', '').replace(removeTrailingPeriod, '');\n    data.year = parseInt(firstOrNull(entryElement.findall('year')));\n    data.month = firstOrNull(entryElement.findall('month'));\n\n    if (data.year) {\n      var cdateString = data.month ? data.month + data.year : data.year;\n      data.cdate = Date.parse(cdateString);\n    }\n\n    data.journal = firstOrNull(entryElement.findall('journal'));\n    data.volume = firstOrNull(entryElement.findall('volume'));\n    data.number = firstOrNull(entryElement.findall('number'));\n    data.chapter = firstOrNull(entryElement.findall('chapter'));\n    data.pages = firstOrNull(entryElement.findall('pages'));\n    data.url = firstOrNull(entryElement.findall('ee'));\n    data.isbn = firstOrNull(entryElement.findall('isbn'));\n    data.booktitle = firstOrNull(entryElement.findall('booktitle'));\n    data.crossref = firstOrNull(entryElement.findall('crossref'));\n    data.publisher = firstOrNull(entryElement.findall('publisher'));\n    data.school = firstOrNull(entryElement.findall('school'));\n\n    Object.keys(data).forEach((key) => (data[key] == null) && delete data[key]);\n\n    return data\n  };\n\n  var dataToBibtex = function(data) {\n    var bibtexIndent = '  ';\n\n    var bibtexComponents = [\n      '@',\n      data.type,\n      '{',\n      'DBLP:',\n      data.key,\n      ',\\n'\n    ];\n\n    var omittedFields = ['type', 'key', 'authorids'];\n\n    var typeDetails = entryTypes[data.type] ? entryTypes[data.type] : entry_types.misc;\n\n    var requiredFields = typeDetails.required\n    var optionalFields = typeDetails.optional\n\n    var dataEntries = Object.entries(data);\n\n    for ([field, value] of dataEntries){\n      if (value && !omittedFields.includes(field)) {\n        var valueString;\n        if (Array.isArray(value)) {\n          valueString = value.join(' and ');\n          if (field.endsWith('s')) {\n            field = field.substring(0, field.length-1);\n          }\n        } else {\n          valueString = String(value);\n        }\n\n        for (const component of [bibtexIndent, field, \"={\", valueString, \"},\\n\"]) {\n          bibtexComponents.push(component);\n        }\n      }\n    }\n\n    bibtexComponents[bibtexComponents.length-1] = bibtexComponents[bibtexComponents.length-1].replace(',\\n', '\\n');\n\n    bibtexComponents.push(\"}\\n\");\n\n    return bibtexComponents.join('');\n  };\n\n\n  var entryElement = getEntryElement(note.content.dblp);\n\n  if (entryElement != null) {\n\n    var data = entryToData(entryElement);\n\n    var newContent = {};\n\n    newContent.venue = data.journal || data.booktitle;\n\n    if (data.key) {\n      var keyParts = data.key.split('/');\n      var venueidParts = ['dblp.org'];\n      // get all but the last part of the key\n      for (var i=0; i<keyParts.length-1; i++) {\n        var keyPart = keyParts[i];\n        if (i === keyParts.length-2) {\n          keyPart = keyPart.toUpperCase();\n        }\n        venueidParts.push(keyPart);\n      }\n\n      // we might not want this later\n      if (data.year) {\n        venueidParts.push(data.year);\n        // new addition at Andrew's request\n        newContent.venue += ' ' + String(data.year)\n      }\n      newContent.venueid = venueidParts.join('/');\n    }\n\n    newContent._bibtex = dataToBibtex(data);\n    newContent.authors = data.authors;\n    newContent.authorids = data.authorids;\n\n    if (data.url) {\n      if (data.url.endsWith('.pdf')) {\n        newContent.pdf = data.url;\n      } else {\n        newContent.html = data.url;\n      }\n    }\n\n    note.cdate = data.cdate;\n    note.content = newContent;\n    note.content.title = data.title;\n\n    return note;\n  } else {\n    throw \"Something went wrong. No entryElement.\";\n  }\n};",
  }
  await createInvitation(dblpRecordInvitationJson, superUserToken)
  // add invitation dblp.org/-/author_coreference
  const dblpAuthorCoreferenceJson = {
    reply: {
      readers: {
        values: ['everyone'],
      },
      writers: {
        values: [],
      },
      signatures: {
        'values-regex': 'dblp.org|~.*',
      },
      content: {
        authorids: {
          'values-regex': '.*',
        },
      },
      referentInvitation: 'dblp.org/-/record',
    },
    signatures: ['dblp.org'],
    readers: ['everyone'],
    writers: ['dblp.org'],
    invitees: ['~'],
    id: 'dblp.org/-/author_coreference',
    details: {
      writable: true,
    },
  }
  await createInvitation(dblpAuthorCoreferenceJson, superUserToken)
}

export async function setupRegister(superUserToken) {
  // create inactive user
  await createUser(inactiveUser)
  // eslint-disable-next-line max-len
  await createProfile(
    inActiveUserNoPassword.fullname,
    inActiveUserNoPassword.email,
    inActiveUserNoPassword.tildeId,
    superUserToken
  )
  // eslint-disable-next-line max-len
  await createEmptyProfile(
    inActiveUserNoPasswordNoEmail.fullname,
    inActiveUserNoPasswordNoEmail.tildeId,
    superUserToken
  )
}

// #region API helper functions
export function createGroup(jsonToPost, userToken) {
  return api.post('/groups', jsonToPost, { accessToken: userToken, version: 1 })
}

export function createInvitation(jsonToPost, userToken) {
  return api.post('/invitations', jsonToPost, { accessToken: userToken, version: 1 })
}

export function createNote(jsonToPost, userToken) {
  return api.post('/notes', jsonToPost, { accessToken: userToken, version: 1 })
}

export function createNoteEdit(jsonToPost, userToken) {
  return api.post('/notes/edits', jsonToPost, { accessToken: userToken, version: 2 })
}

export function sendFile(data, userToken) {
  return api.put('/attachment', data, { accessToken: userToken, contentType: 'unset', version: 1 })
}

export function getToken(id, password) {
  return api.post('/login', { id, password }).then((apiRes) => apiRes.token)
}

export function addMembersToGroup(groupId, membersList, userToken, version) {
  if (version === 2) {
    return api.post(
      '/groups/edits',
      {
        invitation: 'openreview.net/-/Edit',
        signatures: ['~Super_User1'],
        group: {
          id: groupId,
          members: { 'append': membersList }
        }
      },
      { accessToken: userToken, version }
    )
  }
  return api.put(
    '/groups/members',
    { id: groupId, members: membersList },
    { accessToken: userToken, version: 1 }
  )
}

export async function createUser({
  fullname,
  email,
  password,
  homepage = 'http://www.google.com',
  history = undefined,
  activate = true,
}) {
  // register
  const { id: tildeId } = await api.post('/register', {
    email,
    password,
    fullname,
  })

  // activate
  const defaultHistory = {
    position: 'Postdoc',
    start: 2000,
    end: 2000,
    institution: { domain: 'umass.edu', name: 'University of Massachusetts, Amherst' },
  }
  const activateJson = {
    names: [
      {
        fullname,
        preferred: true,
        username: tildeId,
        altUsernames: [],
      },
    ],
    emails: [email],
    links: [],
    id: tildeId,
    gender: '',
    preferredName: fullname,
    preferredEmail: email,
    currentInstitution: null,
    content: {
      names: [
        {
          fullname,
          username: tildeId,
          preferred: true,
        },
      ],
      gender: '',
      homepage,
      gscholar: '',
      dblp: '',
      orcid: '',
      linkedin: '',
      wikipedia: '',
      emails: [email],
      preferredEmail: email,
      history: [history || defaultHistory],
      relations: [],
      expertise: [],
    },
  }
  if (activate) {
    return api.put(`/activate/${email}`, activateJson)
  }
  return null
}

export async function createProfile(fullname, email, tildeId, superUserToken) {
  // post tilde group
  const tildeGroupJson = {
    id: tildeId,
    cdate: null,
    ddate: null,
    signatures: ['openreview.net'],
    writers: ['openreview.net'],
    members: [email],
    readers: [tildeId],
    nonreaders: null,
    signatories: [tildeId],
    web: null,
    details: null,
  }
  await createGroup(tildeGroupJson, superUserToken)
  // post email group
  const emailGroupJson = {
    id: email,
    cdate: null,
    ddate: null,
    signatures: ['openreview.net'],
    writers: ['openreview.net'],
    members: [tildeId],
    readers: [email],
    nonreaders: null,
    signatories: [email],
    web: null,
    details: null,
  }
  await createGroup(emailGroupJson, superUserToken)
  // post profile
  const profileJson = {
    id: tildeId,
    invitation: '~/-/profiles',
    readers: ['openreview.net', tildeId],
    signatures: [tildeId],
    content: {
      emails: [email],
      preferredEmail: email,
      homepage: 'http://homepage.do',
      names: [
        {
          fullname,
          username: tildeId,
        },
      ],
    },
  }
  await api.post('/profiles', profileJson, { accessToken: superUserToken })
}

export async function createEmptyProfile(fullname, tildeId, superUserToken) {
  // post tilde group
  const tildeGroupJson = {
    id: tildeId,
    cdate: null,
    ddate: null,
    signatures: ['openreview.net'],
    writers: ['openreview.net'],
    members: [],
    readers: [tildeId],
    nonreaders: null,
    signatories: [tildeId],
    web: null,
    details: null,
  }
  await createGroup(tildeGroupJson, superUserToken)
  // post profile
  const profileJson = {
    id: tildeId,
    invitation: '~/-/profiles',
    readers: ['openreview.net', tildeId],
    signatures: [tildeId],
    content: {
      dblp: 'https://dblp.org/dummy',
      names: [
        {
          fullname,
          username: tildeId,
        },
      ],
    },
  }
  await api.post('/profiles', profileJson, { accessToken: superUserToken })
}
// #endregion

export function getMessages(params, token) {
  return api.get('/messages', params, { accessToken: token }).then((result) => result.messages)
}

export function getNotes(params, token, version = 1) {
  return api.get('/notes', params, { accessToken: token, version }).then((result) => result.notes)
}

export function getGroups(params, token, version = 1) {
  return api.get('/groups', params, { accessToken: token, version }).then((result) => result.groups)
}

export function getReferences(params, token) {
  return api
    .get('/references', params, { accessToken: token, version: 1 })
    .then((result) => result.references)
}

export function getProcessLogs(id, token) {
  return api.get('/logs/process', { id }, { accessToken: token }).then((result) => result.logs)
}

export function getJobsStatus(token) {
  return api.get('/jobs/status', {}, { accessToken: token, version: 1 })
}
