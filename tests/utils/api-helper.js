/* eslint-disable no-use-before-define */

import fetch from 'node-fetch'
import api from '../../lib/api-client'

const fs = require('fs')

require('dotenv').config()

api.configure({ fetchFn: fetch })

// #region exported constants
export const superUserName = 'openreview.net'
export const baseGroupId = 'TestVenue'
export const subGroupId = 'TestVenue/2020'
export const conferenceGroupId = 'TestVenue/2020/Conference'
export const conferenceSubmissionInvitationId = `${conferenceGroupId}/-/Submission`

export const hasTaskUser = {
  first: 'FirstA',
  last: 'LastA',
  email: 'a@a.com',
  password: '1234',
  tildeId: '~FirstA_LastA1',
}
export const hasNoTaskUser = {
  first: 'FirstB',
  last: 'LastB',
  email: 'b@b.com',
  password: '1234',
  tildeId: '~FirstB_LastB1',
}
export const inactiveUser = {
  first: 'FirstC',
  last: 'LastC',
  email: 'c@c.com',
  password: '1234',
  activate: false,
}
export const inActiveUserNoPassword = {
  first: 'FirstD',
  last: 'LastD',
  email: 'd@d.com',
  tildeId: '~FirstD_LastD1',
}
export const inActiveUserNoPasswordNoEmail = {
  first: 'FirstE',
  last: 'LastE',
  tildeId: '~FirstE_LastE1',
}
// #endregion

// The setup function is shared by all tests and should run only once. Any data
// required by the test cases should be put here
export async function setup(superUserToken) {
  // eslint-disable-next-line no-console
  console.log('SETUP')

  // reset super user password
  const adminToken = superUserToken

  // create test user
  await createUser({
    first: 'Test',
    last: 'User',
    email: 'test@mail.com',
    password: '1234',
  })

  // create a venue TestVenue
  await createGroup(buildBaseGroupJson(baseGroupId), adminToken) // create base venue group
  await addMembersToGroup('host', [baseGroupId], adminToken) // add group to host so that it's shown in all venues list
  await addMembersToGroup('active_venues', [baseGroupId], adminToken) // add group to active_venues so that it's shown in active venues list
  await createGroup(buildSubGroupJson(subGroupId, baseGroupId), adminToken) // create sub group
  await createGroup(buildConferenceGroupJson(conferenceGroupId, baseGroupId, subGroupId), adminToken) // create conference group
  await createInvitation(buildSubmissionInvitationJson(conferenceSubmissionInvitationId, conferenceGroupId), adminToken) // create invitaiton for submissions

  // create a venue AnotherTestVenue
  await createGroup(buildBaseGroupJson(`Another${baseGroupId}`), adminToken)
  await addMembersToGroup('host', [`Another${baseGroupId}`], adminToken)
  await addMembersToGroup('active_venues', [`Another${baseGroupId}`], adminToken)
  await createGroup(buildSubGroupJson(`Another${subGroupId}`, `Another${baseGroupId}`), adminToken)
  await createGroup(buildConferenceGroupJson(`Another${conferenceGroupId}`, `Another${baseGroupId}`, `Another${subGroupId}`), adminToken)
  await createInvitation(buildSubmissionInvitationJson(`Another${conferenceSubmissionInvitationId}`, `Another${conferenceGroupId}`, Date.now() + 2 * 24 * 60 * 60 * 1000, { public: false }), adminToken) // 2 days later

  const forumId = await setupTasks(adminToken)

  const hasTaskUserToken = await getToken(hasTaskUser.email)
  const noteJson = {
    content: {
      title: 'this is á "paper" title',
      authors: ['FirstA LastA'],
      authorids: [hasTaskUser.email],
      abstract: 'The abstract of test paper 1',
      pdf: '/pdf/acef91d0b896efccb01d9d60ed5150433528395a.pdf',
    },
    readers: [`Another${conferenceGroupId}`, hasTaskUser.email, '~FirstA_LastA1'],
    nonreaders: [],
    signatures: ['~FirstA_LastA1'],
    writers: [`Another${conferenceGroupId}`, hasTaskUser.email, '~FirstA_LastA1'],
    invitation: `Another${conferenceSubmissionInvitationId}`,
  }
  const { id: noteId } = await createNote(noteJson, hasTaskUserToken)
  noteJson.ddate = Date.now()
  const { id: deletedNoteId } = await createNote(noteJson, hasTaskUserToken)

  const iclrData = await setupICLR(adminToken)
  await setupProfileViewEdit(adminToken)
  await setupRegister(adminToken)

  return {
    superUserToken: adminToken,
    api,
    data: {
      testVenue: { forums: [forumId] },
      anotherTestVenue: { forums: [noteId, deletedNoteId] },
      iclr: iclrData,
    },
  }
}

async function setupTasks(adminToken) {
  // create users
  const userRes = await createUser(hasTaskUser)
  const hasTaskUserTildeId = userRes.user.profile.id
  const hasTaskUserToken = userRes.token
  await createUser(hasNoTaskUser)

  // add a note
  const noteJson = {
    content: {
      title: 'test title',
      authors: ['test author'],
      authorids: [hasTaskUser.email],
      abstract: 'test abstract',
      pdf: '/pdf/acef91d0b896efccb01d9d60ed5150433528395a.pdf',
    },
    readers: ['everyone'],
    nonreaders: [],
    signatures: [hasTaskUserTildeId],
    writers: [conferenceGroupId, hasTaskUser.email],
    invitation: conferenceSubmissionInvitationId,
  }
  const { id: noteId } = await createNote(noteJson, hasTaskUserToken)

  // add reply invitation with invitee everyone so it will be shown in tasks
  const replyInvitationJson = {
    id: `${conferenceGroupId}/-/Comment`,
    readers: ['everyone'],
    writers: [conferenceGroupId],
    signatures: [conferenceGroupId],
    invitees: [hasTaskUserTildeId],
    reply: {
      // 'invitation': conferenceSubmissionInvitationId,
      replyto: noteId,
      forum: noteId,
      content: {
        title: {
          description: 'Comment title',
          order: 1,
          'value-regex': '.*',
        },
        comment: {
          description: 'Comment',
          order: 2,
          'value-regex': '.{0,1000}',
        },
      },
      readers: {
        values: ['everyone'],
      },
      signatures: {
        'values-regex': '\\(anonymous\\)|~.*',
      },
      writers: {
        'values-regex': '\\(anonymous\\)|~.*',
      },
    },
    duedate: Date.now() + 2 * 24 * 60 * 60 * 1000,
  }
  await createInvitation(replyInvitationJson, adminToken)

  return noteId
}

async function setupICLR(superToken) {
  await createGroup(buildBaseGroupJson('ICLR.cc'), superToken)
  await createGroup(buildSubGroupJson('ICLR.cc/2021', 'ICLR.cc'), superToken)
  await createGroup(buildConferenceGroupJson('ICLR.cc/2021/Conference', 'ICLR.cc/2021', 'ICLR.cc'), superToken)
  await addMembersToGroup('host', ['ICLR.cc/2021/Conference'], superToken)
  await addMembersToGroup('active_venues', ['ICLR.cc/2021/Conference'], superToken)

  await createInvitation(buildSubmissionInvitationJson('ICLR.cc/2021/Conference/-/Submission', 'ICLR.cc/2021/Conference', Date.now() + 2 * 24 * 60 * 60 * 1000, { public: false }), superToken)
  await createInvitation(buildBlindSubmissionInvitationJson('ICLR.cc/2021/Conference/-/Blind_Submission', 'ICLR.cc/2021/Conference', Date.now() + 2 * 24 * 60 * 60 * 1000, { public: true }), superToken)

  const userToken = await getToken('a@a.com')

  const readStream = fs.readFileSync(`${__dirname}/data/paper.pdf`)
  const result = await api.sendFile(readStream, userToken)

  const noteJson = {
    invitation: 'ICLR.cc/2021/Conference/-/Submission',
    content: {
      title: 'ICLR submission title',
      authors: ['FirstA LastA'],
      authorids: ['a@a.com'],
      abstract: 'test iclr abstract abstract',
      pdf: result.url,
    },
    readers: ['ICLR.cc/2021/Conference', 'a@a.com', '~FirstA_LastA1'],
    signatures: ['~FirstA_LastA1'],
    writers: ['ICLR.cc/2021/Conference', 'a@a.com', '~FirstA_LastA1'],
  }

  const { id: noteId } = await createNote(noteJson, userToken)

  const blindNoteJson = {
    invitation: 'ICLR.cc/2021/Conference/-/Blind_Submission',
    original: noteId,
    content: {
      authors: ['Anonymous'],
      authorids: ['ICLR.cc/2021/Conference/Paper1/Authors'],
      _bibtex: '@inproceedings{\nAnonymous,\ntitle={test iclr abstract abstracts},\nauthor={Anonymous},\nbooktitle={International Conference on Learning Representations},\nyear={2021},\nurl={https://openreview.net/forum?id=1111}\n}',
    },
    readers: ['everyone'],
    signatures: ['ICLR.cc/2021/Conference'],
    writers: ['ICLR.cc/2021/Conference'],
  }

  const { id: blindNoteId } = await createNote(blindNoteJson, superToken)

  return {
    conferenceId: 'ICLR.cc/2021/Conference',
    forums: [noteId, blindNoteId],
  }
}

async function setupProfileViewEdit(adminToken) {
  // add group dblp.org
  const dblpGroupJson = {
    id: 'dblp.org',
    signatures: ['~Super_User1'],
    signatories: [],
    readers: ['everyone'],
    writers: ['dblp.org'],
    members: [],
  }
  await createGroup(dblpGroupJson, adminToken)
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
    transform: 'function (note) {\n  var removeDigitsRegEx = /\\s\\d{4}$/;\n  var removeTrailingPeriod = /[\\.]$/;\n  var et = require(\'elementtree\');\n  var XML = et.XML;\n\n  var entryTypes = {\n    \'article\': {\n      \'description\': \'An article from a journal or magazine.\',\n      \'required\': [\'author\', \'title\', \'journal\', \'year\'],\n      \'optional\': [\'key\', \'volume\', \'number\', \'pages\', \'month\', \'note\']\n    },\n    \'book\': {\n      \'description\': \'A book with an explicit publisher\',\n      \'required\': [\'author|editor\', \'title\', \'publisher\'],\n      \'optional\': [\'key\', \'volume|number\', \'series\', \'address\', \'edition\', \'month\', \'year\', \'note\']\n    },\n    \'booklet\': {\n      \'description\': \'A work that is printed and bound, but without a named publisher or sponsoring institution.\',\n      \'required\': [\'title\'],\n      \'optional\': [\'key\', \'author\', \'howpublished\', \'address\', \'month\', \'year\', \'note\']\n    },\n    \'conference\': {\n      \'description\': \'The same as @inproceedings\',\n      \'required\': [\'author\', \'title\', \'booktitle\', \'year\'],\n      \'optional\': [\'key\', \'editor\', \'volume|number\', \'series\', \'pages\', \'address\', \'month\', \'organization\', \'publisher\', \'note\']\n    },\n    \'inbook\': {\n      \'description\': \'A part of a book, which may be a chapter (or section or whatever) and/or a range of pages.\',\n      \'required\': [\'author|editor\', \'title\', \'chapter|pages\', \'publisher\', \'year\'],\n      \'optional\': [\'key\', \'volume|number\', \'series\', \'type\', \'address\', \'edition\', \'month\', \'note\']\n    },\n    \'incollection\': {\n      \'description\': \'A part of a book having its own title.\',\n      \'required\': [\'author\', \'title\', \'booktitle\', \'publisher\', \'year\'],\n      \'optional\': [\'key\', \'editor\', \'volume|number\', \'series\', \'type\', \'chapter\', \'pages\', \'address\', \'edition\', \'month\', \'note\']\n    },\n    \'inproceedings\': {\n      \'description\': \'An article in a conference proceedings.\',\n      \'required\': [\'author\', \'title\', \'booktitle\', \'year\'],\n      \'optional\': [\'key\', \'editor\', \'volume|number\', \'series\', \'pages\', \'address\', \'month\', \'organization\', \'publisher\', \'note\']\n    },\n    \'manual\': {\n      \'description\': \'Technical documentation.\',\n      \'required\': [\'title\'],\n      \'optional\': [\'key\', \'author\', \'organization\', \'address\', \'edition\', \'month\', \'year\', \'note\']\n    },\n    \'mastersthesis\': {\n      \'description\': \'A Master\\\'s thesis\',\n      \'required\': [ \'author\', \'title\', \'school\', \'year\'],\n      \'optional\': [\'key\', \'type\', \'address\', \'month\', \'note\']\n    },\n    \'misc\': {\n      \'description\': \'Use this type when nothing else fits.\',\n      \'required\': [],\n      \'optional\': [\'key\', \'author\', \'title\', \'howpublished\', \'month\', \'year\', \'note\']\n    },\n    \'phdthesis\': {\n      \'description\': \'A PhD thesis.\',\n      \'required\': [ \'author\', \'title\', \'school\', \'year\'],\n      \'optional\': [\'key\', \'type\', \'address\', \'month\', \'note\']\n    },\n    \'proceedings\': {\n      \'description\': \'The proceedings of a conference.\',\n      \'required\': [\'title\', \'year\'],\n      \'optional\': [\'key\', \'editor\', \'volume|number\', \'series\', \'address\', \'month\', \'organization\', \'publisher\', \'note\']\n    },\n    \'techreport\': {\n      \'description\': \'A report published by a school or other institution, usually numbered within a series.\',\n      \'required\': [\'author\', \'title\', \'institution\', \'year\'],\n      \'optional\': [\'key\', \'type\', \'number\', \'address\', \'month\', \'note\']\n    },\n    \'unpublished\': {\n      \'description\': \'A document having an author and title, but not formally published.\',\n      \'required\': [\'author\', \'title\', \'note\'],\n      \'optional\': [\'key\', \'month\', \'year\']\n    }\n  };\n\n  var firstOrNull = function(array){\n    if (array.length > 0){\n      return array[0].text;\n    } else {\n      return null;\n    }\n  };\n\n  var firstOrNullTitle = function(array){\n    if (array.length > 0){\n      let title = \'\';\n      array[0].itertext( function(text){\n        title = title + text;\n      });\n      return title;\n    } else {\n      return null;\n    }\n  };\n\n  var getEntryElement = function(xmlString) {\n    var tree = new et.ElementTree(XML(xmlString));\n    var root = tree.getroot();\n    var entryElement;\n\n    if (root.tag === \'dblp\') {\n      var children = root._children\n\n      if (children.length === 1) {\n        entryElement = children[0];\n      } else {\n        console.log(\'something went wrong\');\n      }\n    } else {\n      entryElement = tree.getroot();\n    }\n\n    return entryElement;\n  };\n\n  var entryToData = function(entryElement) {\n    var data = {};\n\n    data.type = entryElement.tag;\n    data.key = entryElement.attrib.key;\n    data.publtype = entryElement.attrib.publtype\n\n    data.authors = [];\n    data.authorids = [];\n    entryElement.iter(\'author\', function(element){\n      data.authors.push(element.text.replace(removeDigitsRegEx, \'\').replace(\'(\',\'\').replace(\')\',\'\'));\n      data.authorids.push(\n        \'https://dblp.org/search/pid/api?q=author:\' + element.text.split(\' \').join(\'_\') + \':\')\n    })\n\n    data.title = firstOrNullTitle(entryElement.findall(\'title\')).replace(\'\\n\', \'\').replace(removeTrailingPeriod, \'\');\n    data.year = parseInt(firstOrNull(entryElement.findall(\'year\')));\n    data.month = firstOrNull(entryElement.findall(\'month\'));\n\n    if (data.year) {\n      var cdateString = data.month ? data.month + data.year : data.year;\n      data.cdate = Date.parse(cdateString);\n    }\n\n    data.journal = firstOrNull(entryElement.findall(\'journal\'));\n    data.volume = firstOrNull(entryElement.findall(\'volume\'));\n    data.number = firstOrNull(entryElement.findall(\'number\'));\n    data.chapter = firstOrNull(entryElement.findall(\'chapter\'));\n    data.pages = firstOrNull(entryElement.findall(\'pages\'));\n    data.url = firstOrNull(entryElement.findall(\'ee\'));\n    data.isbn = firstOrNull(entryElement.findall(\'isbn\'));\n    data.booktitle = firstOrNull(entryElement.findall(\'booktitle\'));\n    data.crossref = firstOrNull(entryElement.findall(\'crossref\'));\n    data.publisher = firstOrNull(entryElement.findall(\'publisher\'));\n    data.school = firstOrNull(entryElement.findall(\'school\'));\n\n    Object.keys(data).forEach((key) => (data[key] == null) && delete data[key]);\n\n    return data\n  };\n\n  var dataToBibtex = function(data) {\n    var bibtexIndent = \'  \';\n\n    var bibtexComponents = [\n      \'@\',\n      data.type,\n      \'{\',\n      \'DBLP:\',\n      data.key,\n      \',\\n\'\n    ];\n\n    var omittedFields = [\'type\', \'key\', \'authorids\'];\n\n    var typeDetails = entryTypes[data.type] ? entryTypes[data.type] : entry_types.misc;\n\n    var requiredFields = typeDetails.required\n    var optionalFields = typeDetails.optional\n\n    var dataEntries = Object.entries(data);\n\n    for ([field, value] of dataEntries){\n      if (value && !omittedFields.includes(field)) {\n        var valueString;\n        if (Array.isArray(value)) {\n          valueString = value.join(\' and \');\n          if (field.endsWith(\'s\')) {\n            field = field.substring(0, field.length-1);\n          }\n        } else {\n          valueString = String(value);\n        }\n\n        for (const component of [bibtexIndent, field, \"={\", valueString, \"},\\n\"]) {\n          bibtexComponents.push(component);\n        }\n      }\n    }\n\n    bibtexComponents[bibtexComponents.length-1] = bibtexComponents[bibtexComponents.length-1].replace(\',\\n\', \'\\n\');\n\n    bibtexComponents.push(\"}\\n\");\n\n    return bibtexComponents.join(\'\');\n  };\n\n\n  var entryElement = getEntryElement(note.content.dblp);\n\n  if (entryElement != null) {\n\n    var data = entryToData(entryElement);\n\n    var newContent = {};\n\n    newContent.venue = data.journal || data.booktitle;\n\n    if (data.key) {\n      var keyParts = data.key.split(\'/\');\n      var venueidParts = [\'dblp.org\'];\n      // get all but the last part of the key\n      for (var i=0; i<keyParts.length-1; i++) {\n        var keyPart = keyParts[i];\n        if (i === keyParts.length-2) {\n          keyPart = keyPart.toUpperCase();\n        }\n        venueidParts.push(keyPart);\n      }\n\n      // we might not want this later\n      if (data.year) {\n        venueidParts.push(data.year);\n        // new addition at Andrew\'s request\n        newContent.venue += \' \' + String(data.year)\n      }\n      newContent.venueid = venueidParts.join(\'/\');\n    }\n\n    newContent._bibtex = dataToBibtex(data);\n    newContent.authors = data.authors;\n    newContent.authorids = data.authorids;\n\n    if (data.url) {\n      if (data.url.endsWith(\'.pdf\')) {\n        newContent.pdf = data.url;\n      } else {\n        newContent.html = data.url;\n      }\n    }\n\n    note.cdate = data.cdate;\n    note.content = newContent;\n    note.content.title = data.title;\n\n    return note;\n  } else {\n    throw \"Something went wrong. No entryElement.\";\n  }\n};',
  }
  await createInvitation(dblpRecordInvitationJson, adminToken)
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
  await createInvitation(dblpAuthorCoreferenceJson, adminToken)
}

async function setupRegister(adminToken) {
  // create inactive user
  await createUser(inactiveUser)
  // eslint-disable-next-line max-len
  await createProfile(inActiveUserNoPassword.first, inActiveUserNoPassword.last, inActiveUserNoPassword.email, inActiveUserNoPassword.tildeId, adminToken)
  // eslint-disable-next-line max-len
  await createEmptyProfile(inActiveUserNoPasswordNoEmail.first, inActiveUserNoPasswordNoEmail.last, inActiveUserNoPasswordNoEmail.tildeId, adminToken)
}

export function teardown() {
  // eslint-disable-next-line no-console
  console.log('TEARDOWN')
}

// #region API helper functions
export function createGroup(jsonToPost, adminToken) {
  return api.post('/groups', jsonToPost, { accessToken: adminToken })
}

export function createInvitation(jsonToPost, adminToken) {
  return api.post('/invitations', jsonToPost, { accessToken: adminToken })
}

export function createNote(jsonToPost, userToken) {
  return api.post('/notes', jsonToPost, { accessToken: userToken })
}

export function getToken(id = superUserName, password = '1234') {
  return api.post('/login', { id, password })
    .then(apiRes => apiRes.token)
}

export function resetAdminPassword(password) {
  return api.put(`/reset/${superUserName}`, { password })
}

export function addMembersToGroup(groupId, membersList, adminToken) {
  return api.put('/groups/members', { id: groupId, members: membersList }, { accessToken: adminToken })
}

export async function createUser({
  first, middle = '', last, email, password, homepage = 'http://www.google.com', history, activate = true,
}) {
  // register
  const { id: tildeId } = await api.post('/register', { email, password, name: { first, middle, last } })

  // activate
  const defaultHistory = {
    position: 'Postdoc', start: 2000, end: 2000, institution: { domain: 'umass.edu', name: 'University of Massachusetts, Amherst' },
  }
  const activateJson = {
    names: [{
      first, middle, last, preferred: true, username: tildeId, altUsernames: [],
    }],
    emails: [{ email, confirmed: true, preferred: true }],
    links: [],
    id: tildeId,
    gender: '',
    preferredName: `${first} ${last}`,
    preferredEmail: email,
    currentInstitution: null,
    content: {
      names: [{
        first, middle, last, username: tildeId, preferred: true,
      }],
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
      publicationIdsToUnlink: [],
    },
  }
  if (activate) {
    return api.put(`/activate/${email}`, activateJson)
  }
  return null
}

export async function createProfile(first, last, email, tildeId, adminToken) {
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
  await createGroup(tildeGroupJson, adminToken)
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
  await createGroup(emailGroupJson, adminToken)
  // post profile
  const profileJson = {

    id: tildeId,
    number: null,
    tcdate: null,
    tmdate: null,
    referent: null,
    packaging: null,
    invitation: null,
    readers: ['openreview.net', tildeId],
    nonreaders: null,
    signatures: null,
    writers: null,
    content: {
      emails: [email],
      preferredEmail: email,
      names: [
        {
          first,
          middle: '',
          last,
          username: tildeId,
        },
      ],
    },
    metaContent: null,
    active: false,
    password: false,
  }
  await api.post('/profiles', profileJson, { accessToken: adminToken })
}

export async function createEmptyProfile(first, last, tildeId, adminToken) {
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
  await createGroup(tildeGroupJson, adminToken)
  // post profile
  const profileJson = {

    id: tildeId,
    number: null,
    tcdate: null,
    tmdate: null,
    referent: null,
    packaging: null,
    invitation: null,
    readers: ['openreview.net', tildeId],
    nonreaders: null,
    signatures: null,
    writers: null,
    content: {
      dblp: 'dummy dblp url',
      names: [
        {
          first,
          middle: '',
          last,
          username: tildeId,
        },
      ],
    },
    metaContent: null,
    active: false,
    password: false,
  }
  await api.post('/profiles', profileJson, { accessToken: adminToken })
}
// #endregion

// #region data helper functions
function buildBaseGroupJson(baseGrpId) {
  return {
    id: baseGrpId,
    signatures: [superUserName],
    writers: [superUserName],
    members: [],
    readers: ['everyone'],
    nonreaders: [],
    signatories: [baseGrpId],
    web: null,
  }
}

function buildSubGroupJson(subGrpId, baseGrpId) {
  return {
    id: subGrpId,
    signatures: [baseGrpId],
    writers: [baseGrpId],
    members: [],
    readers: ['everyone'],
    nonreaders: [],
    signatories: [subGrpId],
    web: null,
  }
}

function buildConferenceGroupJson(conferenceGrpId, baseGrpId, subGrpId) {
  return {
    id: conferenceGrpId,
    signatures: [subGrpId],
    writers: [baseGrpId],
    members: [],
    readers: ['everyone'],
    nonreaders: [],
    signatories: [conferenceGrpId],
    web: `
// ------------------------------------
// Basic venue homepage template
//
// This webfield displays the conference header (#header), the submit button (#invitation),
// and a list of all submitted papers (#notes).
// ------------------------------------

// Constants
var CONFERENCE = "${conferenceGrpId}";
var INVITATION = CONFERENCE + '/-/Submission';
var SUBJECT_AREAS = [
  // Add conference specific subject areas here
];
var BUFFER = 1000 * 60 * 30;  // 30 minutes
var PAGE_SIZE = 50;

var paperDisplayOptions = {
  pdfLink: true,
  replyCount: true,
  showContents: true
};

// Main is the entry point to the webfield code and runs everything
function main() {
  Webfield.ui.setup('#group-container', CONFERENCE);  // required

  renderConferenceHeader();

  load().then(render).then(function() {
    Webfield.setupAutoLoading(INVITATION, PAGE_SIZE, paperDisplayOptions);
  });
}

// RenderConferenceHeader renders the static info at the top of the page.
function renderConferenceHeader() {
  Webfield.ui.venueHeader({
    title: "ICML ",
    subtitle: "Recent Advances in Ubiquitous Computing",
    location: "University of Rostock, Germany",
    date: "2017, August 04",
    website: "https://studip.uni-rostock.de/seminar_main.php?auswahl=c9b2fd0a6f525ce968d41d737de3ccb5",
    instructions: null,  // Add any custom instructions here. Accepts HTML
    deadline: "Submission Deadline: 2017, June 15th at 11:59 pm (CEST) "
  });

  Webfield.ui.spinner('#notes');
}

// Load makes all the API calls needed to get the data to render the page
// It returns a jQuery deferred object: https://api.jquery.com/category/deferred-object/
function load() {
  var invitationP = Webfield.api.getSubmissionInvitation(INVITATION, {deadlineBuffer: BUFFER});
  var notesP = Webfield.api.getSubmissions(INVITATION, {pageSize: PAGE_SIZE});

  return $.when(invitationP, notesP);
}

// Render is called when all the data is finished being loaded from the server
// It should also be called when the page needs to be refreshed, for example after a user
// submits a new paper.
function render(invitation, notes) {
  // Display submission button and form
  $('#invitation').empty();
  Webfield.ui.submissionButton(invitation, user, {
    onNoteCreated: function() {
      // Callback funtion to be run when a paper has successfully been submitted (required)
      load().then(render).then(function() {
        Webfield.setupAutoLoading(INVITATION, PAGE_SIZE, paperDisplayOptions);
      });
    }
  });

  // Display the list of all submitted papers
  $('#notes').empty();
  Webfield.ui.submissionList(notes, {
    heading: 'Submitted Papers',
    displayOptions: paperDisplayOptions,
    search: {
      enabled: true,
      subjectAreas: SUBJECT_AREAS,
      onResults: function(searchResults) {
        Webfield.ui.searchResults(searchResults, paperDisplayOptions);
        Webfield.disableAutoLoading();
      },
      onReset: function() {
        Webfield.ui.searchResults(notes, paperDisplayOptions);
        Webfield.setupAutoLoading(INVITATION, PAGE_SIZE, paperDisplayOptions);
      }
    }
  });
}

// Go!
main();
    `,
  }
}

export function getMessages(params, token) {
  return api.get('/messages', params, { accessToken: token })
    .then(result => result.messages)
}

export function getNotes(params, token) {
  return api.get('/notes', params, { accessToken: token })
    .then(result => result.notes)
}

export function getReferences(params, token) {
  return api.get('/references', params, { accessToken: token })
    .then(result => result.references)
}

function buildSubmissionInvitationJson(invitationId, conferenceGrpId, dueDate, options) {
  const defaultOptions = {
    public: true,
  }
  const invitationOptions = { ...defaultOptions, ...options }
  const replyReaders = invitationOptions.public ? { values: ['everyone'] } : { 'values-copied': [conferenceGrpId, '{content.authorids}', '{signatures}'] }
  return {
    id: invitationId,
    readers: ['everyone'],
    writers: [conferenceGrpId],
    signatures: [conferenceGrpId],
    invitees: ['~'], // doc use everyone, api is looking for ~
    duedate: dueDate || Date.now() + 24 * 60 * 60 * 1000, // default value is tomorrow
    reply: {
      forum: null,
      replyto: null,
      readers: replyReaders,
      signatures: {
        description: 'Your authorized identity to be associated with the above content.',
        'values-regex': '~.*',
      },
      writers: {
        'values-copied': [conferenceGrpId, '{content.authorids}', '{signatures}'],
      },
      content: {
        title: {
          description: 'Title of paper.',
          order: 1,
          'value-regex': '.{1,250}',
          required: true,
        },
        authors: {
          description: 'Comma separated list of author names. Please provide real names; identities will be anonymized.',
          order: 2,
          'values-regex': '[^;,\\n]+(,[^,\\n]+)*',
          required: true,
        },
        authorids: {
          description: 'Comma separated list of author email addresses, lowercased, in the same order as above. For authors with existing OpenReview accounts, please make sure that the provided email address(es) match those listed in the author\'s profile. Please provide real emails; identities will be anonymized.',
          order: 3,
          'values-regex': '[^;,\\n]+(,[^,\\n]+)*',
          required: true,
        },
        abstract: {
          description: 'Abstract of paper.',
          order: 4,
          'value-regex': '[\\S\\s]{1,5000}',
          required: true,
        },
        pdf: {
          description: 'Upload a PDF file that ends with .pdf',
          order: 5,
          'value-file': {
            fileTypes: ['pdf'],
            size: 50,
          },
          required: true,
        },
      },
    },
  }
}

function buildBlindSubmissionInvitationJson(invitationId, conferenceGrpId, dueDate, options) {
  const defaultOptions = {
    public: true,
  }
  const invitationOptions = { ...defaultOptions, ...options }
  const replyReaders = invitationOptions.public ? { values: ['everyone'] } : { 'values-copied': [conferenceGrpId, '{content.authorids}', '{signatures}'] }
  return {
    id: invitationId,
    readers: ['everyone'],
    writers: [conferenceGrpId],
    signatures: [conferenceGrpId],
    invitees: [conferenceGrpId], // doc use everyone, api is looking for ~
    duedate: dueDate || Date.now() + 24 * 60 * 60 * 1000, // default value is tomorrow
    reply: {
      forum: null,
      replyto: null,
      readers: replyReaders,
      signatures: {
        description: 'Your authorized identity to be associated with the above content.',
        values: [conferenceGrpId],
      },
      writers: {
        values: [conferenceGrpId],
      },
      content: {
        authors: {
          description: 'Comma separated list of author names. Please provide real names; identities will be anonymized.',
          order: 1,
          'values-regex': '.*',
          required: true,
        },
        authorids: {
          description: 'Comma separated list of author email addresses, lowercased, in the same order as above. For authors with existing OpenReview accounts, please make sure that the provided email address(es) match those listed in the author\'s profile. Please provide real emails; identities will be anonymized.',
          order: 2,
          'values-regex': '.*',
          required: true,
        },
      },
    },
  }
}
// #endregion
