import {
  createNote, createUser, getToken, addMembersToGroup, getProcessLogs, hasTaskUser, hasNoTaskUser,
  conferenceGroupId, conferenceSubmissionInvitationId,
} from './utils/api-helper'

fixture`setup data`
  .before(async (ctx) => {
    ctx.superUserToken = await getToken('openreview.net', '1234')
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

  await new Promise(r => setTimeout(r, 2000))

  let logs = await getProcessLogs(requestForumId, superUserToken)
  await t.expect(logs[0].status).eql('ok')

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

  await new Promise(r => setTimeout(r, 2000))

  logs = await getProcessLogs(deployId, superUserToken)
  await t.expect(logs[0].status).eql('ok')

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

  await new Promise(r => setTimeout(r, 2000))

  logs = await getProcessLogs(postSubmissionId, superUserToken)
  await t.expect(logs[0].status).eql('ok')

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

  await new Promise(r => setTimeout(r, 2000))

  logs = await getProcessLogs(reviewStageId, superUserToken)
  await t.expect(logs[0].status).eql('ok')

  await addMembersToGroup('TestVenue/2020/Conference/Paper1/Reviewers', [hasTaskUserTildeId], superUserToken)
})
