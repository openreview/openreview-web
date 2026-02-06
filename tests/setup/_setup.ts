import { FormData, fileFromSync } from 'node-fetch-cjs'
import {
  createNote,
  createNoteEdit,
  createUser,
  getToken,
  addMembersToGroup,
  getGroups,
  getProcessLogs,
  hasTaskUser,
  hasNoTaskUser,
  mergeUser,
  conferenceGroupId,
  conferenceSubmissionInvitationId,
  sendFile,
  setupRegister,
  superUserName,
  strongPassword,
} from '../utils/api-helper'

const waitForJobs = (noteId, superUserToken, count = 1) =>
  new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const logs = await getProcessLogs(noteId, superUserToken)
        if (logs.length >= count) {
          if (logs[0].status === 'error') {
            clearInterval(interval)
            reject(new Error(`Process function failed: ${JSON.stringify(logs[0])}`))
          }
          if (logs[0].status === 'ok') {
            clearInterval(interval)
            resolve(null)
          }
        }
      } catch (err) {
        clearInterval(interval)
        reject(err)
      }
    }, 500)
  })

fixture`Set up test data`.before(async (ctx) => {
  ctx.superUserToken = await getToken(superUserName, strongPassword)
  await setupRegister(ctx.superUserToken)
  await createUser({
    fullname: 'SomeFirstName User',
    email: 'test@mail.com',
    password: strongPassword,
    history: undefined,
  })
  await createUser({
    fullname: 'John SomeLastName',
    email: 'john@mail.com',
    password: strongPassword,
    history: undefined,
  })
  await createUser({
    fullname: 'Reviewer ICLR',
    email: 'reviewer_iclr@mail.com',
    password: strongPassword,
    history: undefined,
  })
  await createUser({
    fullname: 'Program Chair',
    email: 'program_chair@mail.com',
    password: strongPassword,
    history: undefined,
  })
  return ctx
})

test('Set up TestVenue', async (t) => {
  const submissionDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const submissionDateString = `${submissionDate.getFullYear()}/${submissionDate.getMonth() + 1
    }/${submissionDate.getDate()}`
  const { superUserToken } = t.fixtureCtx
  const requestVenueJson = {
    invitation: 'openreview.net/Support/-/Request_Form',
    signatures: ['~Super_User1'],
    readers: ['openreview.net/Support', '~Super_User1', 'john@mail.com', 'tom@mail.com'],
    writers: [],
    content: {
      title: 'Test Venue Conference',
      'Official Venue Name': 'Test Venue Conference',
      'Abbreviated Venue Name': 'Test Venue',
      'Official Website URL': 'https://testvenue.cc',
      program_chair_emails: ['john@mail.com', 'tom@mail.com'],
      contact_email: 'testvenue@mail.com',
      'Area Chairs (Metareviewers)': 'No, our venue does not have Area Chairs',
      'Venue Start Date': '2021/11/01',
      'Submission Deadline': submissionDateString,
      Location: 'Virtual',
      submission_reviewer_assignment: 'Automatic',
      'Author and Reviewer Anonymity': 'No anonymity',
      'Open Reviewing Policy': 'Submissions and reviews should both be public.',
      submission_readers: 'Everyone (submissions are public)',
      withdrawn_submissions_visibility: 'Yes, withdrawn submissions should be made public.',
      withdrawn_submissions_author_anonymity:
        'Yes, author identities of withdrawn submissions should be revealed.',
      email_pcs_for_withdrawn_submissions: 'Yes, email PCs.',
      desk_rejected_submissions_visibility:
        'Yes, desk rejected submissions should be made public.',
      desk_rejected_submissions_author_anonymity:
        'Yes, author identities of desk rejected submissions should be revealed.',
      'How did you hear about us?': 'ML conferences',
      'Expected Submissions': '6000',
      'publication_chairs': 'No, our venue does not have Publication Chairs',
      submission_license: ['CC BY 4.0'],
      api_version: '2',
      venue_organizer_agreement: [
        'OpenReview natively supports a wide variety of reviewing workflow configurations. However, if we want significant reviewing process customizations or experiments, we will detail these requests to the OpenReview staff at least three months in advance.',
        'We will ask authors and reviewers to create an OpenReview Profile at least two weeks in advance of the paper submission deadlines.',
        'When assembling our group of reviewers and meta-reviewers, we will only include email addresses or OpenReview Profile IDs of people we know to have authored publications relevant to our venue.  (We will not solicit new reviewers using an open web form, because unfortunately some malicious actors sometimes try to create "fake ids" aiming to be assigned to review their own paper submissions.)',
        'We acknowledge that, if our venue\'s reviewing workflow is non-standard, or if our venue is expecting more than a few hundred submissions for any one deadline, we should designate our own Workflow Chair, who will read the OpenReview documentation and manage our workflow configurations throughout the reviewing process.',
        'We acknowledge that OpenReview staff work Monday-Friday during standard business hours US Eastern time, and we cannot expect support responses outside those times.  For this reason, we recommend setting submission and reviewing deadlines Monday through Thursday.',
        'We will treat the OpenReview staff with kindness and consideration.'
      ]
    },
  }
  const { id: requestForumId, number } = await createNote(requestVenueJson, superUserToken)

  await waitForJobs(requestForumId, superUserToken)

  const deployVenueJson = {
    content: { venue_id: 'TestVenue/2020/Conference' },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Deploy`,
    readers: ['openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['openreview.net/Support'],
    writers: ['openreview.net/Support'],
  }
  const { id: deployId } = await createNote(deployVenueJson, superUserToken)

  await waitForJobs(deployId, superUserToken)

  const userRes = await createUser(hasTaskUser)
  const hasTaskUserTildeId = userRes.user.profile.id
  const hasTaskUserToken = userRes.token
  await createUser(hasNoTaskUser)
  await createUser(mergeUser)

  // add a note
  const editJson = {
    invitation: conferenceSubmissionInvitationId,
    signatures: [hasTaskUserTildeId],
    note: {
      content: {
        title: { value: 'test title' },
        authors: { value: ['FirstA LastA'] },
        authorids: { value: [hasTaskUserTildeId] },
        abstract: { value: 'test abstract' },
        pdf: { value: '/pdf/acef91d0b896efccb01d9d60ed5150433528395a.pdf' },
      },
    },
  }
  const { id: noteId } = await createNoteEdit(editJson, hasTaskUserToken)

  const postSubmissionJson = {
    content: { force: 'Yes', submission_readers: 'Everyone (submissions are public)' },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Post_Submission`,
    readers: ['TestVenue/2020/Conference/Program_Chairs', 'openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['~Super_User1'],
    writers: [],
  }
  const { id: postSubmissionId } = await createNote(postSubmissionJson, superUserToken)

  await waitForJobs(postSubmissionId, superUserToken)

  const reviewDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const reviewDeadlineString = `${reviewDeadline.getFullYear()}/${reviewDeadline.getMonth() + 1
    }/${reviewDeadline.getDate()}`
  const reviewStageJson = {
    content: {
      review_deadline: reviewDeadlineString,
      make_reviews_public: 'Yes, reviews should be revealed publicly when they are posted',
      release_reviews_to_authors:
        "Yes, reviews should be revealed when they are posted to the paper's authors",
      release_reviews_to_reviewers:
        "Reviews should be immediately revealed to the paper's reviewers",
      email_program_chairs_about_reviews:
        'No, do not email program chairs about received reviews',
    },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Review_Stage`,
    readers: ['TestVenue/2020/Conference/Program_Chairs', 'openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['~Super_User1'],
    writers: [],
  }
  const { id: reviewStageId } = await createNote(reviewStageJson, superUserToken)

  await waitForJobs(reviewStageId, superUserToken)

  await addMembersToGroup(
    'TestVenue/2020/Conference/Paper1/Reviewers',
    [hasTaskUserTildeId],
    superUserToken
  )
})

test('Set up AnotherTestVenue', async (t) => {
  const submissionDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const submissionDateString = `${submissionDate.getFullYear()}/${submissionDate.getMonth() + 1
    }/${submissionDate.getDate()}`
  const { superUserToken } = t.fixtureCtx

  const requestVenueJson = {
    invitation: 'openreview.net/Support/-/Request_Form',
    signatures: ['~Super_User1'],
    readers: ['openreview.net/Support', '~Super_User1', 'john@mail.com', 'tom@mail.com'],
    writers: [],
    content: {
      title: 'AnotherTest Venue Conference',
      'Official Venue Name': 'AnotherTest Venue Conference',
      'Abbreviated Venue Name': 'AnotherTest Venue',
      'Official Website URL': 'https://testvenue.cc',
      program_chair_emails: ['john@mail.com', 'tom@mail.com'],
      contact_email: 'testvenue@mail.com',
      'Area Chairs (Metareviewers)': 'No, our venue does not have Area Chairs',
      'Venue Start Date': '2021/11/01',
      'Submission Deadline': submissionDateString,
      Location: 'Virtual',
      submission_reviewer_assignment: 'Automatic',
      'Author and Reviewer Anonymity': 'No anonymity',
      'Open Reviewing Policy': 'Submissions and reviews should both be private.',
      submission_readers:
        'All program committee (all reviewers, all area chairs, all senior area chairs if applicable)',
      withdrawn_submissions_visibility: 'No, withdrawn submissions should not be made public.',
      withdrawn_submissions_author_anonymity:
        'Yes, author identities of withdrawn submissions should be revealed.',
      email_pcs_for_withdrawn_submissions: 'Yes, email PCs.',
      desk_rejected_submissions_visibility:
        'No, desk rejected submissions should not be made public.',
      desk_rejected_submissions_author_anonymity:
        'Yes, author identities of desk rejected submissions should be revealed.',
      'How did you hear about us?': 'ML conferences',
      'Expected Submissions': '6000',
      'publication_chairs': 'No, our venue does not have Publication Chairs',
      submission_license: ['CC BY 4.0'],
      venue_organizer_agreement: [
        'OpenReview natively supports a wide variety of reviewing workflow configurations. However, if we want significant reviewing process customizations or experiments, we will detail these requests to the OpenReview staff at least three months in advance.',
        'We will ask authors and reviewers to create an OpenReview Profile at least two weeks in advance of the paper submission deadlines.',
        'When assembling our group of reviewers and meta-reviewers, we will only include email addresses or OpenReview Profile IDs of people we know to have authored publications relevant to our venue.  (We will not solicit new reviewers using an open web form, because unfortunately some malicious actors sometimes try to create "fake ids" aiming to be assigned to review their own paper submissions.)',
        'We acknowledge that, if our venue\'s reviewing workflow is non-standard, or if our venue is expecting more than a few hundred submissions for any one deadline, we should designate our own Workflow Chair, who will read the OpenReview documentation and manage our workflow configurations throughout the reviewing process.',
        'We acknowledge that OpenReview staff work Monday-Friday during standard business hours US Eastern time, and we cannot expect support responses outside those times.  For this reason, we recommend setting submission and reviewing deadlines Monday through Thursday.',
        'We will treat the OpenReview staff with kindness and consideration.'
      ]
    },
  }
  const { id: requestForumId, number } = await createNote(requestVenueJson, superUserToken)

  await waitForJobs(requestForumId, superUserToken)

  const deployVenueJson = {
    content: { venue_id: 'AnotherTestVenue/2020/Conference' },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Deploy`,
    readers: ['openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['openreview.net/Support'],
    writers: ['openreview.net/Support'],
  }
  const { id: deployId } = await createNote(deployVenueJson, superUserToken)

  await waitForJobs(deployId, superUserToken)

  const hasTaskUserToken = await getToken(hasTaskUser.email, hasTaskUser.password)

  const noteJson = {
    content: {
      title: 'this is á "paper" title',
      authors: ['FirstA LastA', 'Melisa Bok'],
      authorids: ['~FirstA_LastA1', 'bok@mail.com'],
      abstract: 'The abstract of test paper 1',
      pdf: '/pdf/acef91d0b896efccb01d9d60ed5150433528395a.pdf',
    },
    readers: [`Another${conferenceGroupId}`, '~FirstA_LastA1'],
    nonreaders: [],
    signatures: ['~FirstA_LastA1'],
    writers: [`Another${conferenceGroupId}`, '~FirstA_LastA1'],
    invitation: `Another${conferenceSubmissionInvitationId}`,
    ddate: undefined,
  }
  const { id: noteId } = await createNote(noteJson, hasTaskUserToken)

  noteJson.ddate = Date.now()
  const { id: deletedNoteId } = await createNote(noteJson, hasTaskUserToken)

  const postSubmissionJson = {
    content: {
      force: 'Yes',
      submission_readers:
        'All program committee (all reviewers, all area chairs, all senior area chairs if applicable)',
    },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Post_Submission`,
    readers: ['AnotherTestVenue/2020/Conference/Program_Chairs', 'openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['~Super_User1'],
    writers: [],
  }
  const { id: postSubmissionId } = await createNote(postSubmissionJson, superUserToken)

  await waitForJobs(postSubmissionId, superUserToken)
})

test('Set up ICLR', async (t) => {
  const submissionDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const submissionDateString = `${submissionDate.getFullYear()}/${submissionDate.getMonth() + 1
    }/${submissionDate.getDate()}`
  const { superUserToken } = t.fixtureCtx

  const requestVenueJson = {
    invitation: 'openreview.net/Support/-/Request_Form',
    signatures: ['~Super_User1'],
    readers: ['openreview.net/Support', '~Super_User1', 'john@mail.com', 'tom@mail.com'],
    writers: [],
    content: {
      title: 'ICLR 2021 Conference',
      'Official Venue Name': 'ICLR 2021 Conference',
      'Abbreviated Venue Name': 'ICLR 2021',
      'Official Website URL': 'https://iclr.cc',
      program_chair_emails: ['john@mail.com', 'tom@mail.com'],
      contact_email: 'iclr@mail.com',
      'Area Chairs (Metareviewers)': 'Yes, our venue has Area Chairs',
      'Venue Start Date': '2021/11/01',
      'Submission Deadline': submissionDateString,
      Location: 'Virtual',
      submission_reviewer_assignment: 'Automatic',
      'Author and Reviewer Anonymity': 'Double-blind',
      'Open Reviewing Policy': 'Submissions and reviews should both be public.',
      submission_readers: 'Everyone (submissions are public)',
      withdrawn_submissions_visibility: 'Yes, withdrawn submissions should be made public.',
      withdrawn_submissions_author_anonymity:
        'No, author identities of withdrawn submissions should not be revealed.',
      email_pcs_for_withdrawn_submissions: 'Yes, email PCs.',
      desk_rejected_submissions_visibility:
        'Yes, desk rejected submissions should be made public.',
      desk_rejected_submissions_author_anonymity:
        'No, author identities of desk rejected submissions should not be revealed.',
      'How did you hear about us?': 'ML conferences',
      'Expected Submissions': '6000',
      reviewer_identity: ['Program Chairs', 'Assigned Area Chair'],
      'publication_chairs': 'No, our venue does not have Publication Chairs',
      submission_license: ['CC BY 4.0'],
      venue_organizer_agreement: [
        'OpenReview natively supports a wide variety of reviewing workflow configurations. However, if we want significant reviewing process customizations or experiments, we will detail these requests to the OpenReview staff at least three months in advance.',
        'We will ask authors and reviewers to create an OpenReview Profile at least two weeks in advance of the paper submission deadlines.',
        'When assembling our group of reviewers and meta-reviewers, we will only include email addresses or OpenReview Profile IDs of people we know to have authored publications relevant to our venue.  (We will not solicit new reviewers using an open web form, because unfortunately some malicious actors sometimes try to create "fake ids" aiming to be assigned to review their own paper submissions.)',
        'We acknowledge that, if our venue\'s reviewing workflow is non-standard, or if our venue is expecting more than a few hundred submissions for any one deadline, we should designate our own Workflow Chair, who will read the OpenReview documentation and manage our workflow configurations throughout the reviewing process.',
        'We acknowledge that OpenReview staff work Monday-Friday during standard business hours US Eastern time, and we cannot expect support responses outside those times.  For this reason, we recommend setting submission and reviewing deadlines Monday through Thursday.',
        'We will treat the OpenReview staff with kindness and consideration.'
      ]
    },
  }
  const { id: requestForumId, number } = await createNote(requestVenueJson, superUserToken)

  await waitForJobs(requestForumId, superUserToken)

  const deployVenueJson = {
    content: { venue_id: 'ICLR.cc/2021/Conference' },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Deploy`,
    readers: ['openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['openreview.net/Support'],
    writers: ['openreview.net/Support'],
  }
  const { id: deployId } = await createNote(deployVenueJson, superUserToken)

  await waitForJobs(deployId, superUserToken)

  const userToken = await getToken(hasTaskUser.email, hasTaskUser.password)
  const blob = fileFromSync(`${__dirname}/paper.pdf`, 'application/pdf')
  const data = new FormData()
  data.set('invitationId', 'ICLR.cc/2021/Conference/-/Submission')
  data.set('name', 'pdf')
  data.set('file-upload', blob, 'paper.pdf', 'application/pdf')

  const result = await sendFile(data, userToken)

  const editJson = {
    invitation: 'ICLR.cc/2021/Conference/-/Submission',
    signatures: ['~FirstA_LastA1'],
    note: {
      content: {
        title: { value: 'ICLR submission title' },
        authors: { value: ['FirstA LastA', 'Another Author'] },
        authorids: { value: ['~FirstA_LastA1', 'another_author@mail.com'] },
        abstract: { value: 'test iclr abstract abstract' },
        pdf: { value: result.url },
      },
    },
  }
  const { id: noteId } = await createNoteEdit(editJson, userToken)

  await waitForJobs(noteId, superUserToken)

  const postSubmissionJson = {
    content: { force: 'Yes', submission_readers: 'Everyone (submissions are public)', 'hide_fields': ['pdf'] },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Post_Submission`,
    readers: ['ICLR.cc/2021/Conference/Program_Chairs', 'openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['~Super_User1'],
    writers: [],
  }

  const { id: postSubmissionId } = await createNote(postSubmissionJson, superUserToken)

  await waitForJobs(postSubmissionId, superUserToken)

  const bidStageJson = {
    content: { bid_due_date: submissionDateString },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Bid_Stage`,
    readers: ['ICLR.cc/2021/Conference/Program_Chairs', 'openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['~Super_User1'],
    writers: [],
  }

  const { id: bidStageId } = await createNote(bidStageJson, superUserToken)

  await waitForJobs(bidStageId, superUserToken)

  await addMembersToGroup(
    'ICLR.cc/2021/Conference/Reviewers',
    ['reviewer_iclr@mail.com'],
    superUserToken
  )
})

test('Set up TestVenue using API 2', async (t) => {
  const submissionDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const submissionDateString = `${submissionDate.getFullYear()}/${submissionDate.getMonth() + 1
    }/${submissionDate.getDate()}`
  const { superUserToken } = t.fixtureCtx
  const requestVenueJson = {
    invitation: 'openreview.net/Support/-/Request_Form',
    signatures: ['~Super_User1'],
    readers: ['openreview.net/Support', '~Super_User1', 'john@mail.com', 'tom@mail.com', 'program_chair@mail.com'],
    writers: [],
    content: {
      title: 'Test Venue Conference V2',
      'Official Venue Name': 'Test Venue Conference V2',
      'Abbreviated Venue Name': 'Test Venue V2',
      'Official Website URL': 'https://testvenue.cc',
      program_chair_emails: ['john@mail.com', 'tom@mail.com', 'program_chair@mail.com'],
      contact_email: 'testvenue@mail.com',
      'Area Chairs (Metareviewers)': 'No, our venue does not have Area Chairs',
      'Venue Start Date': '2021/11/01',
      'Submission Deadline': submissionDateString,
      Location: 'Virtual',
      submission_reviewer_assignment: 'Automatic',
      'Author and Reviewer Anonymity': 'Double-blind',
      'Open Reviewing Policy': 'Submissions and reviews should both be public.',
      submission_readers: 'Everyone (submissions are public)',
      withdrawn_submissions_visibility: 'Yes, withdrawn submissions should be made public.',
      withdrawn_submissions_author_anonymity:
        'Yes, author identities of withdrawn submissions should be revealed.',
      email_pcs_for_withdrawn_submissions: 'Yes, email PCs.',
      desk_rejected_submissions_visibility:
        'Yes, desk rejected submissions should be made public.',
      desk_rejected_submissions_author_anonymity:
        'Yes, author identities of desk rejected submissions should be revealed.',
      'How did you hear about us?': 'ML conferences',
      'Expected Submissions': '6000',
      'publication_chairs': 'No, our venue does not have Publication Chairs',
      'api_version': '2',
      submission_license: ['CC BY 4.0'],
      venue_organizer_agreement: [
        'OpenReview natively supports a wide variety of reviewing workflow configurations. However, if we want significant reviewing process customizations or experiments, we will detail these requests to the OpenReview staff at least three months in advance.',
        'We will ask authors and reviewers to create an OpenReview Profile at least two weeks in advance of the paper submission deadlines.',
        'When assembling our group of reviewers and meta-reviewers, we will only include email addresses or OpenReview Profile IDs of people we know to have authored publications relevant to our venue.  (We will not solicit new reviewers using an open web form, because unfortunately some malicious actors sometimes try to create "fake ids" aiming to be assigned to review their own paper submissions.)',
        'We acknowledge that, if our venue\'s reviewing workflow is non-standard, or if our venue is expecting more than a few hundred submissions for any one deadline, we should designate our own Workflow Chair, who will read the OpenReview documentation and manage our workflow configurations throughout the reviewing process.',
        'We acknowledge that OpenReview staff work Monday-Friday during standard business hours US Eastern time, and we cannot expect support responses outside those times.  For this reason, we recommend setting submission and reviewing deadlines Monday through Thursday.',
        'We will treat the OpenReview staff with kindness and consideration.'
      ]
    },
  }
  const { id: requestForumId, number } = await createNote(requestVenueJson, superUserToken)

  await waitForJobs(requestForumId, superUserToken)

  const deployVenueJson = {
    content: { venue_id: 'TestVenue/2023/Conference' },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Deploy`,
    readers: ['openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['openreview.net/Support'],
    writers: ['openreview.net/Support'],
  }

  const { id: deployId } = await createNote(deployVenueJson, superUserToken)

  await waitForJobs(deployId, superUserToken)

  const hasTaskUserTildeId = hasTaskUser.tildeId
  const hasTaskUserToken = await getToken(hasTaskUser.email, hasTaskUser.password)

  // add a note
  const ediJson = {
    invitation: 'TestVenue/2023/Conference/-/Submission',
    signatures: [hasTaskUserTildeId],
    note: {
      content: {
        title: { 'value': 'Paper Title 1' },
        authors: { 'value': ['FirstA LastA'] },
        authorids: { 'value': [hasTaskUserTildeId] },
        abstract: { 'value': 'Paper Abstract' },
        keywords: { 'value': ['keyword1', 'keyword2'] },
        pdf: { 'value': '/pdf/acef91d0b896efccb01d9d60ed5150433528395a.pdf' },
      }
    }
  }
  const { id: editId } = await createNoteEdit(ediJson, hasTaskUserToken)

  await waitForJobs(editId, superUserToken)

  // close deadline
  const submissionCloseDate = new Date(Date.now() - (28 * 60 * 1000)) // 28 minutes ago
  const year = submissionCloseDate.getFullYear()
  const month = `0${submissionCloseDate.getMonth() + 1}`.slice(-2)
  const day = `0${submissionCloseDate.getDate()}`.slice(-2)
  const hours = `0${submissionCloseDate.getHours()}`.slice(-2)
  const minutes = `0${submissionCloseDate.getMinutes()}`.slice(-2)
  const submissionCloseDateString = `${year}/${month}/${day} ${hours}:${minutes}`
  const editVenueJson = {
    content: {
      title: 'Test Venue Conference V2',
      'Official Venue Name': 'Test Venue Conference V2',
      'Abbreviated Venue Name': 'Test Venue V2',
      'Official Website URL': 'https://testvenue.cc',
      program_chair_emails: ['john@mail.com', 'tom@mail.com', 'program_chair@mail.com'],
      contact_email: 'testvenue@mail.com',
      'Venue Start Date': '2021/11/01',
      'Submission Start Date': '2021/11/01',
      'Submission Deadline': submissionCloseDateString,
      Location: 'Virtual',
      submission_reviewer_assignment: 'Automatic',
      'Expected Submissions': '6000',
      'publication_chairs': 'No, our venue does not have Publication Chairs',
    },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Revision`,
    readers: ['TestVenue/2023/Conference/Program_Chairs', 'openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['~Super_User1'],
    writers: [],
  }
  const { id: referenceId } = await createNote(editVenueJson, superUserToken)

  await waitForJobs(referenceId, superUserToken)
  await waitForJobs('TestVenue/2023/Conference/-/Post_Submission-0-0', superUserToken)

  const reviewDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const reviewDeadlineString = `${reviewDeadline.getFullYear()}/${reviewDeadline.getMonth() + 1
    }/${reviewDeadline.getDate()}`
  const reviewStageJson = {
    content: {
      review_deadline: reviewDeadlineString,
      make_reviews_public: 'No, reviews should NOT be revealed publicly when they are posted',
      release_reviews_to_authors: 'No, reviews should NOT be revealed when they are posted to the paper\'s authors',
      release_reviews_to_reviewers: 'Review should not be revealed to any reviewer, except to the author of the review',
      email_program_chairs_about_reviews: 'No, do not email program chairs about received reviews',
    },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Review_Stage`,
    readers: ['TestVenue/2023/Conference/Program_Chairs', 'openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['~Super_User1'],
    writers: [],
  }

  const { id: reviewStageId } = await createNote(reviewStageJson, superUserToken)

  await waitForJobs(reviewStageId, superUserToken)
  await waitForJobs('TestVenue/2023/Conference/-/Official_Review-0-1', superUserToken)

  await addMembersToGroup(
    'TestVenue/2023/Conference/Submission1/Reviewers',
    ['~SomeFirstName_User1'],
    superUserToken,
    2
  )

  const reviewersGroups = await getGroups({ id: 'TestVenue/2023/Conference/Submission1/Reviewers' }, superUserToken, 2)
  const testUserToken = await getToken('test@mail.com', hasTaskUser.password)

  // Add a review
  const reviewJson = {
    invitation: 'TestVenue/2023/Conference/Submission1/-/Official_Review',
    signatures: [reviewersGroups[0].members[0]],
    note: {
      content: {
        title: { 'value': 'Review Title 1' },
        review: { 'value': 'Great paper!' },
        rating: { 'value': 7 },
        confidence: { 'value': 5 }
      }
    }
  }
  const { id: editReviewId } = await createNoteEdit(reviewJson, testUserToken)

  await waitForJobs(editReviewId, superUserToken)

})
