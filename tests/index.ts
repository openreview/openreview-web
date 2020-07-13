import { Selector } from 'testcafe'
import api from '../lib/api-client'
import fetch from 'node-fetch'
import {getToken, addGroup, addMembersToGroup, addInvitation, circleciSuperUserName} from './test-utils'
require('dotenv').config()

const baseGroupId = 'TestVenue'
const subGroupId = 'TestVenue/2020'
const conferenceGroupId = 'TestVenue/2020/Conference'
const conferenceSubmissionInvitationId =`${conferenceGroupId}/-/Submission`

const constructBaseGroupJson = (baseGroupId, superUserName) => {
  const baseGroupJson = {
    id: baseGroupId,
    cdate: null,
    ddate: null,
    signatures: [superUserName],
    writers: [superUserName],
    members: [],
    readers: ['everyone'],
    nonreaders: [],
    signatories: [baseGroupId],
    web: null,
    details: null
  }
  return baseGroupJson
}
const constructSubGroupJson = (subGroupId, baseGroupId) => {
  const subGroupJson = {
    id: subGroupId,
    cdate: null,
    ddate: null,
    signatures: [baseGroupId],
    writers: [baseGroupId],
    members: [],
    readers: ['everyone'],
    nonreaders: [],
    signatories: [subGroupId],
    web: null,
    details: null
  }
  return subGroupJson
}
const constructConferenceGroupJson = (conferenceGroupId,baseGroupId, subGroupId) => {
  const conferenceGroupJson = {
    id: conferenceGroupId,
    cdate: null,
    ddate: null,
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
    details: null
  }
  return conferenceGroupJson
}
const constructSubmissionInvitationJson = (invitationId, conferenceGroupId, dueDate = Date.now() + 24 * 60 * 60 * 1000) => {
  const submissionInvitationJson = {
    id: invitationId,
    readers: ['everyone'],
    writers: [conferenceGroupId],
    signatures: [conferenceGroupId],
    invitees: ['~'],//doc use everyone, api is looking for ~
    duedate: dueDate, //default value is tomorrow
    reply: {
      forum: null,
      replyto: null,
      readers: {
        description: 'The users who will be allowed to read the above content.',
        values: ['everyone']
      },
      signatures: {
        description: 'Your authorized identity to be associated with the above content.',
        'values-regex': '~.*'
      },
      writers: {
        'values-regex': '~.*'
      },
      content: {
        title: {
          description: 'Title of paper.',
          order: 1,
          'value-regex': '.{1,250}',
          required: true
        },
        authors: {
          description: 'Comma separated list of author names. Please provide real names; identities will be anonymized.',
          order: 2,
          'values-regex': "[^;,\\n]+(,[^,\\n]+)*",
          required: true
        },
        authorids: {
          description: 'Comma separated list of author email addresses, lowercased, in the same order as above. For authors with existing OpenReview accounts, please make sure that the provided email address(es) match those listed in the author\'s profile. Please provide real emails; identities will be anonymized.',
          order: 3,
          'values-regex': "([a-z0-9_\-\.]{2,}@[a-z0-9_\-\.]{2,}\.[a-z]{2,},){0,}([a-z0-9_\-\.]{2,}@[a-z0-9_\-\.]{2,}\.[a-z]{2,})",
          required: true
        },
        abstract: {
          description: 'Abstract of paper.',
          order: 4,
          'value-regex': '[\\S\\s]{1,5000}',
          required: true
        },
        pdf: {
          description: 'Upload a PDF file that ends with .pdf',
          order: 5,
          'value-regex': 'upload',
          required: true
        }
      }
    }
  }
  return submissionInvitationJson
}

api.configure({ fetchFn: fetch })

fixture`home page`
  .before(async () => {
    await setupData()
  })
test('show active venues', async t => {
  await t.navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    //active venue has 2 items
    .expect(Selector('#active-venues').child.length).eql(2)
    .expect(Selector('#active-venues').find('a').nth(0).textContent).eql(baseGroupId)
    .expect(Selector('#active-venues').find('a').nth(1).textContent).eql(`Another${baseGroupId}`)
    //open for submission has 2 items
    .expect(Selector('#submissions').child.length).eql(2)
    .expect(Selector('#submissions').find('a').nth(0).textContent).eql(conferenceGroupId.replace(/\//g,' '))
    .expect(Selector('#submissions').find('a').nth(1).textContent).eql(`Another${conferenceGroupId}`.replace(/\//g,' '))
    .expect(Selector('.invitation_duedate').count).eql(2)
    //all venues has 2 items
    .expect(Selector('#all-venues').child.length).eql(2)
    .expect(Selector('#all-venues').find('a').nth(0).textContent).eql(baseGroupId)
    .expect(Selector('#all-venues').find('a').nth(1).textContent).eql(`Another${baseGroupId}`)
})

async function setupData() {
  const adminToken = await getToken()
    //create 1st venue
    await addGroup(constructBaseGroupJson(baseGroupId, circleciSuperUserName), adminToken) // create base venue group
    await addMembersToGroup('host', [baseGroupId], adminToken) // add group to host so that it's shown in all venues list
    await addMembersToGroup('active_venues', [baseGroupId], adminToken) // add group to active_venues so that it's shown in active venues list
    await addGroup(constructSubGroupJson(subGroupId, baseGroupId), adminToken) // create sub group
    await addGroup(constructConferenceGroupJson(conferenceGroupId, baseGroupId, subGroupId), adminToken) // create conference group
    await addInvitation(constructSubmissionInvitationJson(conferenceSubmissionInvitationId, conferenceGroupId), adminToken) // create invitaiton for submissionex
    //create 2nd venue
    await addGroup(constructBaseGroupJson(`Another${baseGroupId}`, circleciSuperUserName), adminToken)
    await addMembersToGroup('host', [`Another${baseGroupId}`], adminToken)
    await addMembersToGroup('active_venues', [`Another${baseGroupId}`], adminToken)
    await addGroup(constructSubGroupJson(`Another${subGroupId}`, `Another${baseGroupId}`), adminToken)
    await addGroup(constructConferenceGroupJson(`Another${conferenceGroupId}`, `Another${baseGroupId}`, `Another${subGroupId}`), adminToken)
    await addInvitation(constructSubmissionInvitationJson(`Another${conferenceSubmissionInvitationId}`, `Another${conferenceGroupId}`, Date.now() + 2 * 24 * 60 * 60 * 1000), adminToken) //2 days later
}
