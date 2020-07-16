import api from '../lib/api-client'
import fetch from 'node-fetch'
api.configure({ fetchFn: fetch })

export const circleciSuperUserName = 'openreview.net'
export const baseGroupId = 'TestVenue'
const subGroupId = 'TestVenue/2020'
export const conferenceGroupId = 'TestVenue/2020/Conference'
const conferenceSubmissionInvitationId = `${conferenceGroupId}/-/Submission`
export const hasTaskUser = { first: 'FirstA', last: 'LastA', email: 'a@a.com', password: '1234' }
export const hasNoTaskUser = { first: 'FirstB', last: 'LastB', email: 'b@b.com', password: '1234' }
let hasTaskUserTildeId = ''
let hasTaskUserToken = ''

// the setup function is shared by all tests and should run only once. all data required by a test case should be put here
export async function setup() {
  // const result1 = await api.put('/reset/openreview.net', { password: '1234' })
  // reset super user password
  await resetAdminPassword('1234')
  const adminToken = await getToken()
  //#region used by index.ts and tasks.ts
  // create a venue TestVenue
  await addGroup(constructBaseGroupJson(baseGroupId, circleciSuperUserName), adminToken) // create base venue group
  await addMembersToGroup('host', [baseGroupId], adminToken) // add group to host so that it's shown in all venues list
  await addMembersToGroup('active_venues', [baseGroupId], adminToken) // add group to active_venues so that it's shown in active venues list
  await addGroup(constructSubGroupJson(subGroupId, baseGroupId), adminToken) // create sub group
  await addGroup(constructConferenceGroupJson(conferenceGroupId, baseGroupId, subGroupId), adminToken) // create conference group
  await addInvitation(constructSubmissionInvitationJson(conferenceSubmissionInvitationId, conferenceGroupId), adminToken) // create invitaiton for submissionex
  // create a venue AnotherTestVenue
  await addGroup(constructBaseGroupJson(`Another${baseGroupId}`, circleciSuperUserName), adminToken)
  await addMembersToGroup('host', [`Another${baseGroupId}`], adminToken)
  await addMembersToGroup('active_venues', [`Another${baseGroupId}`], adminToken)
  await addGroup(constructSubGroupJson(`Another${subGroupId}`, `Another${baseGroupId}`), adminToken)
  await addGroup(constructConferenceGroupJson(`Another${conferenceGroupId}`, `Another${baseGroupId}`, `Another${subGroupId}`), adminToken)
  await addInvitation(constructSubmissionInvitationJson(`Another${conferenceSubmissionInvitationId}`, `Another${conferenceGroupId}`, Date.now() + 2 * 24 * 60 * 60 * 1000), adminToken) // 2 days later
  //#endregion
  //#region used by tasks.ts
  //create hastask user
  const result = await createUser(hasTaskUser)
  hasTaskUserTildeId = result.user.profile.id
  hasTaskUserToken = result.token
  //create notask user
  await createUser(hasNoTaskUser)
  //add a note
  const noteJson = {
    content:
    {
      title: 'test title',
      authors: ['test author'],
      authorids: [hasTaskUser.email],
      abstract: 'test abstract',
      pdf: '/pdf/acef91d0b896efccb01d9d60ed5150433528395a.pdf',
    },
    readers: ['everyone'],
    nonreaders: [],
    signatures: [hasTaskUserTildeId],
    writers: [hasTaskUserTildeId],
    invitation: conferenceSubmissionInvitationId,
  }
  const addNoteResult = await addNote(noteJson, hasTaskUserToken)
  const noteId=addNoteResult.id
  //add reply invitation
  const replyInvitationJson = {
    id: `${conferenceGroupId}/-/Comment`,
    readers: ['everyone'],
    writers: [conferenceGroupId],
    signatures: [conferenceGroupId],
    invitees: [hasTaskUserTildeId],
    reply: {
      //'invitation': conferenceSubmissionInvitationId,
      'replyto':noteId,
      'forum':noteId,
      'content': {
        'title': {
          'description': 'Comment title',
          'order': 1,
          'value-regex': '.*'
        },
        'comment': {
          'description': 'Comment',
          'order': 2,
          'value-regex': '.{0,1000}'
        }
      },
      'readers': {
        'values': ['everyone']
      },
      'signatures': {
        'values-regex': '\\(anonymous\\)|~.*'
      },
      'writers': {
        'values-regex': '\\(anonymous\\)|~.*'
      }
    },
    duedate:Date.now() + 2 * 24 * 60 * 60 * 1000
  }
  // create invitaiton for reply to notes
  // it has invitee everyone so it will be shown in tasks
  await addInvitation(replyInvitationJson, adminToken)
  //#endregion
}

export function teardown() {
  console.log('TEARDOWN')
}

//#region helper functions used by setup()
export async function addGroup(jsonToPost, adminToken) {
  const groupsUrl = '/groups'
  const result = await api.post(groupsUrl, { ...jsonToPost }, { accessToken: adminToken })
}

export async function addInvitation(jsonToPost, adminToken) {
  const invitationUrl = '/invitations'
  const result = await api.post(invitationUrl, { ...jsonToPost }, { accessToken: adminToken })
}

export async function getToken(id = circleciSuperUserName, password = '1234') {
  const loginUrl = '/login'
  try {
    const result = await api.post(loginUrl, { id, password })
    return result.token
  } catch (error) {
    await resetAdminPassword(password)
    return getToken()
  }
}

async function resetAdminPassword(password) {
  const result = await api.put(`/reset/${circleciSuperUserName}`, { password })
}

export async function addMembersToGroup(groupId, membersList, adminToken) {
  const addMembersToGroupUrl = '/groups/members'
  const result = await api.put(addMembersToGroupUrl, { id: groupId, members: membersList }, { accessToken: adminToken })
}

export async function createUser({
  first, middle = '', last, email, password, homepage = 'http://www.google.com', history = {
    position: 'Postdoc', start: 2000, end: 2000, institution: { domain: 'umass.edu', name: 'University of Massachusetts, Amherst' },
  },
}) {
  // register
  const registerResult = await api.post('/register', { email, password, name: { first, middle, last } })
  const tildeId = registerResult.id
  // activate
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
      history: [history],
      relations: [],
      expertise: [],
      publicationIdsToUnlink: [],
    },
  }
  const activateResult = await api.put(`/activate/${email}`, activateJson)
  return activateResult
}

export const constructBaseGroupJson = (baseGroupId, superUserName) => {
  const baseGroupJson = {
    id: baseGroupId,
    signatures: [superUserName],
    writers: [superUserName],
    members: [],
    readers: ['everyone'],
    nonreaders: [],
    signatories: [baseGroupId],
    web: null,
  }
  return baseGroupJson
}

export const constructSubGroupJson = (subGroupId, baseGroupId) => {
  const subGroupJson = {
    id: subGroupId,
    signatures: [baseGroupId],
    writers: [baseGroupId],
    members: [],
    readers: ['everyone'],
    nonreaders: [],
    signatories: [subGroupId],
    web: null,
  }
  return subGroupJson
}

export const constructConferenceGroupJson = (conferenceGroupId, baseGroupId, subGroupId) => {
  const conferenceGroupJson = {
    id: conferenceGroupId,
    signatures: [subGroupId],
    writers: [baseGroupId],
    members: [],
    readers: ['everyone'],
    nonreaders: [],
    signatories: [conferenceGroupId],
    web: `// ------------------------------------
    // Basic venue homepage template
    //
    // This webfield displays the conference header (#header), the submit button (#invitation),
    // and a list of all submitted papers (#notes).
    // ------------------------------------

    // Constants
    var CONFERENCE = "${conferenceGroupId}";
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
    main();`,
  }
  return conferenceGroupJson
}

// eslint-disable-next-line max-len
export const constructSubmissionInvitationJson = (invitationId, conferenceGroupId, dueDate = Date.now() + 24 * 60 * 60 * 1000) => {
  const submissionInvitationJson = {
    id: invitationId,
    readers: ['everyone'],
    writers: [conferenceGroupId],
    signatures: [conferenceGroupId],
    invitees: ['~'], // doc use everyone, api is looking for ~
    duedate: dueDate, // default value is tomorrow
    reply: {
      forum: null,
      replyto: null,
      readers: {
        description: 'The users who will be allowed to read the above content.',
        values: ['everyone'],
      },
      signatures: {
        description: 'Your authorized identity to be associated with the above content.',
        'values-regex': '~.*',
      },
      writers: {
        'values-regex': '~.*',
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
          // eslint-disable-next-line quotes
          'values-regex': "[^;,\\n]+(,[^,\\n]+)*",
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
          'value-regex': 'upload',
          required: true,
        },
      },
    },
  }
  return submissionInvitationJson
}

export const addNote = (jsonToPost, usertoken) => {
  const addNoteUrl = '/notes'
  const result = api.post(addNoteUrl, jsonToPost, { accessToken: usertoken })
  return result
}
//#endregion
