import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AcPcConsoleNoteReviewStatus } from '../components/webfield/NoteReviewStatus'
import { renderWithWebFieldContext } from './util'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => () => ({
  user: { profile: { id: '~Test_User1' } },
  accessToken: 'some token',
}))

global.$ = jest.fn(() => ({
  on: jest.fn(),
  off: jest.fn(),
  modal: jest.fn(),
  collapse: jest.fn(),
  hasClass: jest.fn(() => false),
}))

describe('AcPcConsoleNoteReviewStatus', () => {
  const note = { id: 'note1Id', forum: 'note1Id', number: 1 }
  const buildRowData = () => ({
    note,
    officialReviews: [
      {
        id: 'review1Id',
        anonymousId: 'abcd',
        rating: 5,
        confidence: 5,
        reviewLength: 20,
        signatures: ['AAAI.org/2025/Conference/Submission1/Program_Committee_abcd'],
      },
      {
        id: 'review2Id',
        anonymousId: 'efgh',
        rating: 10,
        confidence: 10,
        reviewLength: 25,
        signatures: ['AAAI.org/2025/Conference/Submission1/Program_Committee_efgh'],
      },
    ],
    reviewers: [
      {
        anonymousId: 'abcd',
        reviewerProfileId: '~PaperOne_Reviewer1',
        preferredName: 'PaperOne Reviewer1',
        hasReview: true,
      },
      {
        anonymousId: 'efgh',
        reviewerProfileId: '~PaperOne_Reviewer2',
        preferredName: 'PaperOne Reviewer2',
        hasReview: true,
      },
    ],
    reviewProgressData: {
      numReviewsDone: 2,
      numReviewersAssigned: 2,
      replyCount: 5,
      ratings: { rating: { ratingAvg: '7.50', ratingMin: 5, ratingMax: 10 } },
      confidenceAvg: '7.50',
      confidenceMin: 5,
      confidenceMax: 10,
    },
  })
  const providerProps = {
    value: {
      reviewRatingName: 'rating',
      reviewerName: 'Program_Committee',
      preferredEmailInvitationId: undefined,
    },
  }
  const customStageReviewReplies = [
    {
      id: 'detection1Id',
      replyto: 'review1Id',
      forum: 'note1Id',
      name: 'AI Review Detection',
      value: 'AI',
      displayField: 'Label',
      extraDisplayFields: [
        { field: 'Score', value: 0.9 },
        { field: 'Link', value: 'https://dashboard.example.com/review-detection/1' },
      ],
    },
    {
      id: 'detection2Id',
      replyto: 'review2Id',
      forum: 'note1Id',
      name: 'AI Review Detection',
      value: 'Human',
      displayField: 'Label',
      extraDisplayFields: [{ field: 'Score', value: 0.1 }],
    },
  ]

  test('show custom stage replies under the review they reply to', async () => {
    renderWithWebFieldContext(
      <AcPcConsoleNoteReviewStatus
        rowData={buildRowData()}
        venueId="AAAI.org/2025/Conference"
        officialReviewName="First_Round_Review"
        referrerUrl="referrerUrl"
        shortPhrase="AAAI 2025"
        submissionName="Submission"
        customStageReviewReplies={customStageReviewReplies}
      />,
      providerProps
    )

    // reviewer rows are collapsed by default
    await userEvent.click(screen.getByText('Show Program Committee'))

    const reviewerRows = document.querySelectorAll('.assigned-reviewer-row')
    expect(reviewerRows.length).toEqual(2)

    // reply to review1 is rendered in reviewer1 row and reply to review2 in reviewer2 row
    expect(reviewerRows[0].textContent).toContain('AI Review Detection:')
    expect(reviewerRows[0].textContent).toContain('Label: AI')
    expect(reviewerRows[0].textContent).toContain('Score: 0.9')
    expect(reviewerRows[0].textContent).not.toContain('Label: Human')
    expect(reviewerRows[1].textContent).toContain('Label: Human')
    expect(reviewerRows[1].textContent).toContain('Score: 0.1')
    expect(reviewerRows[1].textContent).not.toContain('Label: AI')

    // values starting with https are rendered as links
    const dashboardLink = screen.getByRole('link', {
      name: 'https://dashboard.example.com/review-detection/1',
    })
    expect(dashboardLink).toHaveAttribute(
      'href',
      'https://dashboard.example.com/review-detection/1'
    )

    // link to read the custom stage reply in the forum
    const readLinks = screen.getAllByRole('link', { name: 'Read AI Review Detection' })
    expect(readLinks.length).toEqual(2)
    expect(readLinks[0]).toHaveAttribute(
      'href',
      '/forum?id=note1Id&noteId=detection1Id&referrer=referrerUrl'
    )
  })

  test('render reviewer rows unchanged when there are no custom stage replies', async () => {
    renderWithWebFieldContext(
      <AcPcConsoleNoteReviewStatus
        rowData={buildRowData()}
        venueId="AAAI.org/2025/Conference"
        officialReviewName="First_Round_Review"
        referrerUrl="referrerUrl"
        shortPhrase="AAAI 2025"
        submissionName="Submission"
      />,
      providerProps
    )

    await userEvent.click(screen.getByText('Show Program Committee'))

    const reviewerRows = document.querySelectorAll('.assigned-reviewer-row')
    expect(reviewerRows.length).toEqual(2)
    expect(screen.getAllByRole('link', { name: 'Read First Round Review' }).length).toEqual(2)
    expect(document.querySelectorAll('.custom-stage-reply').length).toEqual(0)
  })
})
