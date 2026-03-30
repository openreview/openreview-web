import { screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { renderWithWebFieldContext } from './util'
import { ReviewRatingStatsRow } from '../components/webfield/ProgramChairConsole/Overview'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('ReviewRatingStatsRow', () => {
  test('not to show anything when reviewRatingName is string', async () => {
    const providerProps = {
      value: {
        reviewRatingName: 'overall_rating',
        reviewerName: 'Reviewers',
        submissionName: 'Submission',
      },
    }
    const pcConsoleData = {
      notes: [],
    }
    const { container } = renderWithWebFieldContext(
      <ReviewRatingStatsRow pcConsoleData={pcConsoleData} />,
      providerProps
    )

    expect(container).toBeEmptyDOMElement()
  })

  test('not to show anything when reviewRatingName is single value array', async () => {
    const providerProps = {
      value: {
        reviewRatingName: ['overall_rating'],
        reviewerName: 'Reviewers',
        submissionName: 'Submission',
      },
    }
    const pcConsoleData = {
      notes: [],
    }
    const { container } = renderWithWebFieldContext(
      <ReviewRatingStatsRow pcConsoleData={pcConsoleData} />,
      providerProps
    )

    expect(container).toBeEmptyDOMElement()
  })

  test('not to show anything when reviewRatingName is object array', async () => {
    const providerProps = {
      value: {
        reviewRatingName: [
          'preliminary_rating',
          { name_overwrite: ['rating_one', 'rating_two'] },
        ],
        reviewerName: 'Reviewers',
        submissionName: 'Submission',
      },
    }
    const pcConsoleData = {
      notes: [],
    }
    const { container } = renderWithWebFieldContext(
      <ReviewRatingStatsRow pcConsoleData={pcConsoleData} />,
      providerProps
    )

    expect(container).toBeEmptyDOMElement()
  })

  test('show stats when reviewRatingName is multi value string array (not meeting threshold)', async () => {
    const providerProps = {
      value: {
        reviewRatingName: ['preliminary_rating', 'final_rating'],
        reviewerName: 'Reviewers',
        submissionName: 'Submission',
      },
    }
    // paper1 2/2 reviews all with preliminary and final
    // paper2 1/2 reivew with preliminary only, 1/2 review with preliminary and final
    // paper3 0/2 one review with no preliminary or final and missing the other one
    const pcConsoleData = {
      notes: [{ number: 1 }, { number: 2 }, { number: 3 }],
      officialReviewsByPaperNumberMap: new Map([
        [
          1,
          [
            {
              anonId: 'aaaa',
              content: {
                preliminary_rating: { value: '1: Poor' },
                final_rating: { value: '2: Fair' },
              },
              signatures: ['some_conference/Submission1/Reviewer_aaaa'],
            },
            {
              anonId: 'bbbb',
              content: {
                preliminary_rating: { value: '1: Poor' },
                final_rating: { value: '2: Fair' },
              },
              signatures: ['some_conference/Submission1/Reviewer_bbbb'],
            },
          ],
        ],
        [
          2,
          [
            {
              anonId: 'cccc',
              content: {
                preliminary_rating: { value: '1: Poor' },
                final_rating: { value: '2: Fair' },
              },
              signatures: ['some_conference/Submission2/Reviewer_cccc'],
            },
            {
              anonId: 'dddd',
              content: {
                preliminary_rating: { value: '1: Poor' },
              },
              signatures: ['some_conference/Submission2/Reviewer_dddd'],
            },
          ],
        ],
        [
          3,
          [
            {
              anonId: 'eeee',
              content: {},
              signatures: ['some_conference/Submission3/Reviewer_eeee'],
            },
            // review from ffff is missing
          ],
        ],
      ]),
      paperGroups: {
        reviewerGroups: [
          {
            noteNumber: 1,
            id: 'some_conference/Submission1/Reviewers',
            members: [
              {
                anonymizedGroup: 'some_conference/Submission1/Reviewer_aaaa',
                anonymousId: 'aaaa',
                reviewerProfileId: '~Some_Reviewer1',
              },
              {
                anonymizedGroup: 'some_conference/Submission1/Reviewer_bbbb',
                anonymousId: 'bbbb',
                reviewerProfileId: '~Some_Reviewer2',
              },
            ],
          },
          {
            noteNumber: 2,
            id: 'some_conference/Submission2/Reviewers',
            members: [
              {
                anonymizedGroup: 'some_conference/Submission2/Reviewer_cccc',
                anonymousId: 'cccc',
                reviewerProfileId: '~Some_Reviewer1',
              },
              {
                anonymizedGroup: 'some_conference/Submission2/Reviewer_dddd',
                anonymousId: 'dddd',
                reviewerProfileId: '~Some_Reviewer3',
              },
            ],
          },
          {
            noteNumber: 3,
            id: 'some_conference/Submission3/Reviewers',
            members: [
              {
                anonymizedGroup: 'some_conference/Submission3/Reviewer_eeee',
                anonymousId: 'eeee',
                reviewerProfileId: '~Some_Reviewer2',
              },
              {
                anonymizedGroup: 'some_conference/Submission3/Reviewer_ffff',
                anonymousId: 'ffff',
                reviewerProfileId: '~Some_Reviewer4',
              },
            ],
          },
        ],
      },
    }
    renderWithWebFieldContext(
      <ReviewRatingStatsRow pcConsoleData={pcConsoleData} />,
      providerProps
    )

    // preliminary rating
    expect(screen.getByText('Preliminary Rating Progress:')).toBeInTheDocument()
    expect(
      screen.getByText('Preliminary Rating Progress:').nextSibling.nextSibling
    ).toHaveTextContent('66.67% (4 / 6)')

    expect(screen.getByText('Preliminary Rating Reviewer Progress:')).toBeInTheDocument()
    expect(
      screen.getByText('Preliminary Rating Reviewer Progress:').nextSibling.nextSibling
    ).toHaveTextContent('50.00% (2 / 4)') // reviewer 1 completed fro paper 1 and 2; reviewer 3 completed for paper 2

    expect(screen.getByText('Preliminary Rating Reviewer Progress:')).toBeInTheDocument()
    expect(
      screen.getByText('Preliminary Rating Submission Progress:').nextSibling.nextSibling
    ).toHaveTextContent('0.00% (0 / 3)') // threshold is 3

    // final rating
    expect(screen.getByText('Final Rating Progress:')).toBeInTheDocument()
    expect(
      screen.getByText('Final Rating Progress:').nextSibling.nextSibling
    ).toHaveTextContent('50.00% (3 / 6)')

    expect(screen.getByText('Final Rating Reviewer Progress:')).toBeInTheDocument()
    expect(
      screen.getByText('Final Rating Reviewer Progress:').nextSibling.nextSibling
    ).toHaveTextContent('25.00% (1 / 4)') // reviewer 1 only

    expect(screen.getByText('Final Rating Reviewer Progress:')).toBeInTheDocument()
    expect(
      screen.getByText('Final Rating Submission Progress:').nextSibling.nextSibling
    ).toHaveTextContent('0.00% (0 / 3)')
  })

  test('show stats when reviewRatingName is multi value string array (meeting threshold)', async () => {
    const providerProps = {
      value: {
        reviewRatingName: ['preliminary_rating', 'final_rating'],
        reviewerName: 'Reviewers',
        submissionName: 'Submission',
      },
    }
    // paper1 2/3 reviews all with preliminary and final
    // paper2 1/2 reivew with preliminary only, 1/2 review with preliminary and final
    // paper3 0/2 one review with no preliminary or final and missing the other one
    const pcConsoleData = {
      notes: [{ number: 1 }, { number: 2 }, { number: 3 }],
      officialReviewsByPaperNumberMap: new Map([
        [
          1,
          [
            {
              anonId: 'aaaa',
              content: {
                preliminary_rating: { value: '1: Poor' },
                final_rating: { value: '2: Fair' },
              },
              signatures: ['some_conference/Submission1/Reviewer_aaaa'],
            },
            {
              anonId: 'bbbb',
              content: {
                preliminary_rating: { value: '1: Poor' },
                final_rating: { value: '2: Fair' },
              },
              signatures: ['some_conference/Submission1/Reviewer_bbbb'],
            },
            {
              anonId: 'xxxx',
              content: {
                preliminary_rating: { value: '1: Poor' },
              },
              signatures: ['some_conference/Submission1/Reviewer_xxxx'],
            },
          ],
        ],
        [
          2,
          [
            {
              anonId: 'cccc',
              content: {
                preliminary_rating: { value: '1: Poor' },
                final_rating: { value: '2: Fair' },
              },
              signatures: ['some_conference/Submission2/Reviewer_cccc'],
            },
            {
              anonId: 'dddd',
              content: {
                preliminary_rating: { value: '1: Poor' },
              },
              signatures: ['some_conference/Submission2/Reviewer_dddd'],
            },
          ],
        ],
        [
          3,
          [
            {
              anonId: 'eeee',
              content: {},
              signatures: ['some_conference/Submission3/Reviewer_eeee'],
            },
            // review from ffff is missing
          ],
        ],
      ]),
      paperGroups: {
        reviewerGroups: [
          {
            noteNumber: 1,
            id: 'some_conference/Submission1/Reviewers',
            members: [
              {
                anonymizedGroup: 'some_conference/Submission1/Reviewer_aaaa',
                anonymousId: 'aaaa',
                reviewerProfileId: '~Some_Reviewer1',
              },
              {
                anonymizedGroup: 'some_conference/Submission1/Reviewer_bbbb',
                anonymousId: 'bbbb',
                reviewerProfileId: '~Some_Reviewer2',
              },
              {
                anonymizedGroup: 'some_conference/Submission1/Reviewer_xxxx',
                anonymousId: 'xxxx',
                reviewerProfileId: '~Some_Reviewer3',
              },
            ],
          },
          {
            noteNumber: 2,
            id: 'some_conference/Submission2/Reviewers',
            members: [
              {
                anonymizedGroup: 'some_conference/Submission2/Reviewer_cccc',
                anonymousId: 'cccc',
                reviewerProfileId: '~Some_Reviewer1',
              },
              {
                anonymizedGroup: 'some_conference/Submission2/Reviewer_dddd',
                anonymousId: 'dddd',
                reviewerProfileId: '~Some_Reviewer3',
              },
            ],
          },
          {
            noteNumber: 3,
            id: 'some_conference/Submission3/Reviewers',
            members: [
              {
                anonymizedGroup: 'some_conference/Submission3/Reviewer_eeee',
                anonymousId: 'eeee',
                reviewerProfileId: '~Some_Reviewer2',
              },
              {
                anonymizedGroup: 'some_conference/Submission3/Reviewer_ffff',
                anonymousId: 'ffff',
                reviewerProfileId: '~Some_Reviewer4',
              },
            ],
          },
        ],
      },
    }
    renderWithWebFieldContext(
      <ReviewRatingStatsRow pcConsoleData={pcConsoleData} />,
      providerProps
    )

    // preliminary rating
    expect(screen.getByText('Preliminary Rating Progress:')).toBeInTheDocument()
    expect(
      screen.getByText('Preliminary Rating Progress:').nextSibling.nextSibling
    ).toHaveTextContent('71.43% (5 / 7)')

    expect(screen.getByText('Preliminary Rating Reviewer Progress:')).toBeInTheDocument()
    expect(
      screen.getByText('Preliminary Rating Reviewer Progress:').nextSibling.nextSibling
    ).toHaveTextContent('50.00% (2 / 4)') // reviewer 1 completed fro paper 1 and 2; reviewer 3 completed for paper 1 and 2

    expect(screen.getByText('Preliminary Rating Reviewer Progress:')).toBeInTheDocument()
    expect(
      screen.getByText('Preliminary Rating Submission Progress:').nextSibling.nextSibling
    ).toHaveTextContent('33.33% (1 / 3)') // threshold is 3

    // final rating
    expect(screen.getByText('Final Rating Progress:')).toBeInTheDocument()
    expect(
      screen.getByText('Final Rating Progress:').nextSibling.nextSibling
    ).toHaveTextContent('42.86% (3 / 7)')

    expect(screen.getByText('Final Rating Reviewer Progress:')).toBeInTheDocument()
    expect(
      screen.getByText('Final Rating Reviewer Progress:').nextSibling.nextSibling
    ).toHaveTextContent('25.00% (1 / 4)') // reviewer 1 only

    expect(screen.getByText('Final Rating Reviewer Progress:')).toBeInTheDocument()
    expect(
      screen.getByText('Final Rating Submission Progress:').nextSibling.nextSibling
    ).toHaveTextContent('0.00% (0 / 3)')
  })
})
