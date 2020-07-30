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
}
export const hasNoTaskUser = {
  first: 'FirstB',
  last: 'LastB',
  email: 'b@b.com',
  password: '1234',
}
// #endregion

// The setup function is shared by all tests and should run only once. Any data
// required by the test cases should be put here
export async function setup(ctx) {
  // eslint-disable-next-line no-console
  console.log('SETUP')

  // reset super user password
  await resetAdminPassword('1234')
  const adminToken = await getToken()

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
      title: 'test title',
      authors: ['test author'],
      authorids: [hasTaskUser.email],
      abstract: 'test abstract',
      pdf: '/pdf/acef91d0b896efccb01d9d60ed5150433528395a.pdf',
    },
    readers: [`Another${conferenceGroupId}`, hasTaskUser.email, '~FirstA_LastA1'],
    nonreaders: [],
    signatures: ['~FirstA_LastA1'],
    writers: [`Another${conferenceGroupId}`, hasTaskUser.email, '~FirstA_LastA1'],
    invitation: `Another${conferenceSubmissionInvitationId}`,
  }
  const { id: noteId } = await createNote(noteJson, hasTaskUserToken)

  const iclrData = await setupICLR(adminToken)

  return {
    superUserToken: adminToken,
    api,
    data: {
      testVenue: { forums: [forumId] },
      anotherTestVenue: { forums: [noteId] },
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
  first, middle = '', last, email, password, homepage = 'http://www.google.com', history,
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
  return api.put(`/activate/${email}`, activateJson)
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
