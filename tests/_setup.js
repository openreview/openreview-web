import {
  createNote, createUser, getToken, addMembersToGroup, getJobsStatus, hasTaskUser, hasNoTaskUser,
  conferenceGroupId, conferenceSubmissionInvitationId, sendFile, setupProfileViewEdit, setupRegister,
} from './utils/api-helper'

const waitForJobs = (noteId, superUserToken) => new Promise((resolve, reject) => {
  const interval = setInterval(async () => {
    try {
      const statuses = await getJobsStatus(superUserToken)
      if (statuses.pyQueueStatus.failed > 0) {
        clearInterval(interval)
        reject(new Error('Process function failed'))
      }
      const queueCount = Object.values(statuses)
        .reduce((count, job) => count + job.waiting + job.active + job.delayed, 0)
      if (queueCount === 0) {
        clearInterval(interval)
        resolve()
      }
    } catch (err) {
      clearInterval(interval)
      reject(err)
    }
  }, 500)
})

fixture`Setup data`
  .before(async (ctx) => {
    ctx.superUserToken = await getToken('openreview.net', '1234')
    await setupProfileViewEdit(ctx.superUserToken)
    await setupRegister(ctx.superUserToken)
    await createUser({
      first: 'Test',
      last: 'User',
      email: 'test@mail.com',
      password: '1234',
      history: undefined,
    })
    await createUser({
      first: 'John',
      last: 'Test',
      email: 'john@mail.com',
      password: '1234',
      history: undefined,
    })
    await createUser({
      first: 'Reviewer',
      last: 'ICLR',
      email: 'reviewer_iclr@mail.com',
      password: '1234',
      history: undefined,
    })
    return ctx
  })

test('setup TestVenue', async (t) => {
  const submissionDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const submissionDateString = `${submissionDate.getFullYear()}/${submissionDate.getMonth() + 1}/${submissionDate.getDate()}`
  const { superUserToken } = t.fixtureCtx
  const requestVenueJson = {
    invitation: 'openreview.net/Support/-/Request_Form',
    signatures: ['~Super_User1'],
    readers: [
      'openreview.net/Support',
      '~Super_User1',
      'john@mail.com',
      'tom@mail.com',
    ],
    writers: [],
    content: {
      title: 'Test Venue Conference',
      'Official Venue Name': 'Test Venue Conference',
      'Abbreviated Venue Name': 'Test Venue',
      'Official Website URL': 'https://testvenue.cc',
      program_chair_emails: [
        'john@mail.com',
        'tom@mail.com'],
      contact_email: 'testvenue@mail.com',
      'Area Chairs (Metareviewers)': 'No, our venue does not have Area Chairs',
      'Venue Start Date': '2021/11/01',
      'Submission Deadline': submissionDateString,
      Location: 'Virtual',
      'Paper Matching': [
        'Reviewer Bid Scores',
        'Reviewer Recommendation Scores'],
      'Author and Reviewer Anonymity': 'No anonymity',
      'Open Reviewing Policy': 'Submissions and reviews should both be public.',
      'Public Commentary': 'Yes, allow members of the public to comment non-anonymously.',
      withdrawn_submissions_visibility: 'Yes, withdrawn submissions should be made public.',
      withdrawn_submissions_author_anonymity: 'No, author identities of withdrawn submissions should not be revealed.',
      email_pcs_for_withdrawn_submissions: 'Yes, email PCs.',
      desk_rejected_submissions_visibility: 'Yes, desk rejected submissions should be made public.',
      desk_rejected_submissions_author_anonymity: 'No, author identities of desk rejected submissions should not be revealed.',
      'How did you hear about us?': 'ML conferences',
      'Expected Submissions': '6000',
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

  // add a note
  const noteJson = {
    content: {
      title: 'test title',
      authors: ['FirstA LastA'],
      authorids: [hasTaskUserTildeId],
      abstract: 'test abstract',
      pdf: '/pdf/acef91d0b896efccb01d9d60ed5150433528395a.pdf',
    },
    readers: ['everyone'],
    nonreaders: [],
    signatures: [hasTaskUserTildeId],
    writers: [conferenceGroupId, hasTaskUserTildeId],
    invitation: conferenceSubmissionInvitationId,
  }
  const { id: noteId } = await createNote(noteJson, hasTaskUserToken)

  const postSubmissionJson = {
    content: { force: 'Yes' },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Post_Submission`,
    readers: ['openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['openreview.net/Support'],
    writers: ['openreview.net/Support'],
  }

  const { id: postSubmissionId } = await createNote(postSubmissionJson, superUserToken)

  await waitForJobs(postSubmissionId, superUserToken)

  const reviewStageJson = {
    content: {
      review_deadline: '2020/11/13',
      make_reviews_public: 'Yes, reviews should be revealed publicly when they are posted',
      release_reviews_to_authors: 'Yes, reviews should be revealed when they are posted to the paper\'s authors',
      release_reviews_to_reviewers: 'Yes, reviews should be immediately revealed to the all paper\'s reviewers',
      email_program_chairs_about_reviews: 'No, do not email program chairs about received reviews',
    },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Review_Stage`,
    readers: ['TestVenue/2020/Conference/Program_Chairs', 'openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['openreview.net/Support'],
    writers: ['openreview.net/Support'],
  }

  const { id: reviewStageId } = await createNote(reviewStageJson, superUserToken)

  await waitForJobs(reviewStageId, superUserToken)

  await addMembersToGroup('TestVenue/2020/Conference/Paper1/Reviewers', [hasTaskUserTildeId], superUserToken)
})

test('setup AnotherTestVenue', async (t) => {
  const submissionDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const submissionDateString = `${submissionDate.getFullYear()}/${submissionDate.getMonth() + 1}/${submissionDate.getDate()}`
  const { superUserToken } = t.fixtureCtx

  const requestVenueJson = {
    invitation: 'openreview.net/Support/-/Request_Form',
    signatures: ['~Super_User1'],
    readers: [
      'openreview.net/Support',
      '~Super_User1',
      'john@mail.com',
      'tom@mail.com',
    ],
    writers: [],
    content: {
      title: 'AnotherTest Venue Conference',
      'Official Venue Name': 'AnotherTest Venue Conference',
      'Abbreviated Venue Name': 'AnotherTest Venue',
      'Official Website URL': 'https://testvenue.cc',
      program_chair_emails: [
        'john@mail.com',
        'tom@mail.com'],
      contact_email: 'testvenue@mail.com',
      'Area Chairs (Metareviewers)': 'No, our venue does not have Area Chairs',
      'Venue Start Date': '2021/11/01',
      'Submission Deadline': submissionDateString,
      Location: 'Virtual',
      'Paper Matching': [
        'Reviewer Bid Scores',
        'Reviewer Recommendation Scores'],
      'Author and Reviewer Anonymity': 'No anonymity',
      'Open Reviewing Policy': 'Submissions and reviews should both be private.',
      'Public Commentary': 'Yes, allow members of the public to comment non-anonymously.',
      withdrawn_submissions_visibility: 'Yes, withdrawn submissions should be made public.',
      withdrawn_submissions_author_anonymity: 'No, author identities of withdrawn submissions should not be revealed.',
      email_pcs_for_withdrawn_submissions: 'Yes, email PCs.',
      desk_rejected_submissions_visibility: 'Yes, desk rejected submissions should be made public.',
      desk_rejected_submissions_author_anonymity: 'No, author identities of desk rejected submissions should not be revealed.',
      'How did you hear about us?': 'ML conferences',
      'Expected Submissions': '6000',
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

  const hasTaskUserToken = await getToken(hasTaskUser.email)
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
})

test('setup ICLR', async (t) => {
  const submissionDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const submissionDateString = `${submissionDate.getFullYear()}/${submissionDate.getMonth() + 1}/${submissionDate.getDate()}`
  const { superUserToken } = t.fixtureCtx

  const requestVenueJson = {
    invitation: 'openreview.net/Support/-/Request_Form',
    signatures: ['~Super_User1'],
    readers: [
      'openreview.net/Support',
      '~Super_User1',
      'john@mail.com',
      'tom@mail.com',
    ],
    writers: [],
    content: {
      title: 'ICLR 2021 Conference',
      'Official Venue Name': 'ICLR 2021 Conference',
      'Abbreviated Venue Name': 'ICLR 2021',
      'Official Website URL': 'https://iclr.cc',
      program_chair_emails: [
        'john@mail.com',
        'tom@mail.com'],
      contact_email: 'iclr@mail.com',
      'Area Chairs (Metareviewers)': 'Yes, our venue has Area Chairs',
      'Venue Start Date': '2021/11/01',
      'Submission Deadline': submissionDateString,
      Location: 'Virtual',
      'Paper Matching': [
        'Reviewer Bid Scores',
        'Reviewer Recommendation Scores'],
      'Author and Reviewer Anonymity': 'Double-blind',
      'Open Reviewing Policy': 'Submissions and reviews should both be public.',
      'Public Commentary': 'Yes, allow members of the public to comment non-anonymously.',
      withdrawn_submissions_visibility: 'Yes, withdrawn submissions should be made public.',
      withdrawn_submissions_author_anonymity: 'No, author identities of withdrawn submissions should not be revealed.',
      email_pcs_for_withdrawn_submissions: 'Yes, email PCs.',
      desk_rejected_submissions_visibility: 'Yes, desk rejected submissions should be made public.',
      desk_rejected_submissions_author_anonymity: 'No, author identities of desk rejected submissions should not be revealed.',
      'How did you hear about us?': 'ML conferences',
      'Expected Submissions': '6000',
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

  const userToken = await getToken('a@a.com')

  const result = await sendFile('paper.pdf', userToken)

  const noteJson = {
    invitation: 'ICLR.cc/2021/Conference/-/Submission',
    content: {
      title: 'ICLR submission title',
      authors: ['FirstA LastA', 'Another Author'],
      authorids: ['~FirstA_LastA1', 'another_author@mail.com'],
      abstract: 'test iclr abstract abstract',
      pdf: result.url,
    },
    readers: ['ICLR.cc/2021/Conference', '~FirstA_LastA1'],
    signatures: ['~FirstA_LastA1'],
    writers: ['ICLR.cc/2021/Conference', '~FirstA_LastA1'],
  }

  const { id: noteId } = await createNote(noteJson, userToken)

  await waitForJobs(noteId, superUserToken)

  const postSubmissionJson = {
    content: { force: 'Yes' },
    forum: requestForumId,
    invitation: `openreview.net/Support/-/Request${number}/Post_Submission`,
    readers: ['openreview.net/Support'],
    referent: requestForumId,
    replyto: requestForumId,
    signatures: ['openreview.net/Support'],
    writers: ['openreview.net/Support'],
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
    writers: ['~Super_User1'],
  }

  const { id: bidStageId } = await createNote(bidStageJson, superUserToken)

  await waitForJobs(bidStageId, superUserToken)

  await addMembersToGroup('ICLR.cc/2021/Conference/Reviewers', ['reviewer_iclr@mail.com'], superUserToken)
})
