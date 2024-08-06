import { screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import api from '../lib/api-client'
import { reRenderWithWebFieldContext, renderWithWebFieldContext } from './util'
import ReviewerConsole from '../components/webfield/ReviewerConsole'

let useUserReturnValue
let routerParams
let noteSummaryProps
let noteReviewStatusProps

jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: (params) => {
      routerParams = params
      return jest.fn()
    },
  }),
}))
jest.mock('../hooks/useUser', () => () => useUserReturnValue)
jest.mock('../hooks/useQuery', () => () => ({}))
jest.mock('../components/webfield/NoteSummary', () => (props) => {
  noteSummaryProps(props)
  return <span>note summary</span>
})
jest.mock('../components/webfield/NoteReviewStatus', () => ({
  ReviewerConsoleNoteReviewStatus: (props) => {
    noteReviewStatusProps(props)
    return <span>note review status</span>
  },
}))

global.promptError = jest.fn()
global.typesetMathJax = jest.fn()
global.DOMPurify = {
  sanitize: jest.fn(),
}
global.marked = jest.fn()

beforeEach(() => {
  useUserReturnValue = { user: {}, accessToken: 'some token' }
  routerParams = null
  noteSummaryProps = jest.fn()
  noteReviewStatusProps = jest.fn()
})

describe('ReviewerConsole', () => {
  test('redirect to home page when user has not logged in', () => {
    useUserReturnValue = { user: null, accessToken: null }
    const providerProps = { value: { reviewerName: undefined } }
    renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(routerParams).toBe(null)
  })

  test('show missing config error when config does not have reviewerName', () => {
    const providerProps = { value: { reviewerName: undefined } }
    renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(screen.getByText('Console is missing', { exact: false })).toBeInTheDocument()
  })

  test('show error with console name when config is empty', () => {
    const providerProps = {
      value: {
        reviewerName: 'Program_Committee',
      },
    }
    renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(
      screen.getByText('Program Committee Console is missing', { exact: false })
    ).toBeInTheDocument()
  })

  test('not to call API when there is no submission invitation, submission name, venue id or reviewer name config', () => {
    api.getAll = jest.fn()
    api.getInvitationById = jest.fn()
    api.get = jest.fn()

    const submissionInvitationId = 'AAAI.org/2025/Conference/-/Submission'
    const submissionName = 'Submission'
    const venueId = 'AAAI.org/2025/Conference'
    const reviewerName = 'Program_Committee'

    const providerProps = {
      value: {
        header: {
          title: 'Program Committee Console',
          instructions: 'some instructions',
        },
        entity: { id: 'AAAI.org/2025/Conference/Program_Committee' },
        venueId,
        reviewerName,
        officialReviewName: 'Official_Review',
        reviewRatingName: 'rating',
        areaChairName: 'Senior_Program_Committee',
        submissionName,
        submissionInvitationId,
        recruitmentInvitationId: 'AAAI.org/2025/Conference/Program_Committee/-/Recruitment',
        customMaxPapersInvitationId:
          'AAAI.org/2025/Conference/Program_Committee/-/Custom_Max_Papers',
        reviewLoad: '',
        hasPaperRanking: false,
        reviewDisplayFields: undefined,
      },
    }

    // no submission invitation
    providerProps.value.submissionInvitationId = undefined
    const { rerender } = renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.getAll).not.toHaveBeenCalled()
    expect(api.getInvitationById).not.toHaveBeenCalled()
    expect(api.get).not.toHaveBeenCalled()
    expect(
      screen.getByText(
        'Program Committee Console is missing required properties: submissionInvitationId'
      )
    ).toBeInTheDocument()

    // no submission name
    providerProps.value.submissionInvitationId = submissionInvitationId
    providerProps.value.submissionName = undefined
    reRenderWithWebFieldContext(
      rerender,
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.getAll).not.toHaveBeenCalled()
    expect(api.getInvitationById).not.toHaveBeenCalled()
    expect(api.get).not.toHaveBeenCalled()
    expect(
      screen.getByText(
        'Program Committee Console is missing required properties: submissionName'
      )
    ).toBeInTheDocument()

    // no venue id
    providerProps.value.submissionName = submissionName
    providerProps.value.venueId = undefined
    reRenderWithWebFieldContext(
      rerender,
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.getAll).not.toHaveBeenCalled()
    expect(api.getInvitationById).not.toHaveBeenCalled()
    expect(api.get).not.toHaveBeenCalled()
    expect(
      screen.getByText('Program Committee Console is missing required properties: venueId')
    ).toBeInTheDocument()

    // no reviewer name
    providerProps.value.venueId = venueId
    providerProps.value.reviewerName = undefined
    reRenderWithWebFieldContext(
      rerender,
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(api.getAll).not.toHaveBeenCalled()
    expect(api.getInvitationById).not.toHaveBeenCalled()
    expect(api.get).not.toHaveBeenCalled()
    expect(
      screen.getByText('Console is missing required properties: reviewerName')
    ).toBeInTheDocument()
  })

  test('show assigned papers tab and tasks tab with correct name (basedo n submission name and reviewer name)', async () => {
    api.getAll = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn((path) => {
      switch (path) {
        case '/edges':
          return Promise.resolve({ edges: [] })
        case '/notes':
          return Promise.resolve({ notes: [] })
        case '/groups':
          return Promise.resolve({ groups: [] })
        case '/invitations':
          return Promise.resolve({ invitations: [] })
        default:
          return null
      }
    })

    const providerProps = {
      value: {
        header: {
          title: 'Program Committee Console',
          instructions: 'some instructions',
        },
        entity: { id: 'AAAI.org/2025/Conference/Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerName: 'Program_Committee',
        officialReviewName: 'Official_Review',
        reviewRatingName: 'rating',
        areaChairName: 'Senior_Program_Committee',
        submissionName: 'Submission',
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        recruitmentInvitationId: 'AAAI.org/2025/Conference/Program_Committee/-/Recruitment',
        customMaxPapersInvitationId:
          'AAAI.org/2025/Conference/Program_Committee/-/Custom_Max_Papers',
        reviewLoad: '',
        hasPaperRanking: false,
        reviewDisplayFields: undefined,
      },
    }

    renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    expect(api.getAll).toHaveBeenCalledTimes(1) // get member groups
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Assigned Submissions' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Program Committee Tasks' })).toBeInTheDocument()
      // default to assigned papers tab
      expect(
        screen.getByText(
          'You have no assigned papers. Please check again after the paper assignment process is complete.'
        )
      ).toBeInTheDocument()
    })
  })

  test('show note info and note review info (no review))', async () => {
    const reviewerAnonId = Math.random().toString(36).substring(2, 6)
    const acAnonId = Math.random().toString(36).substring(2, 6)
    api.getAll = jest.fn(() =>
      Promise.resolve([
        // anon groups
        {
          id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewerAnonId}`,
          members: ['~Test_Program_Committee1'],
        },
        // per paper reviewers group
        {
          id: `AAAI.org/2025/Conference/Submission1/Program_Committee`,
          members: ['~Test_Program_Committee1'],
        },
      ])
    )
    api.get = jest.fn((path) => {
      switch (path) {
        case '/edges':
          return Promise.resolve({ edges: [] })
        case '/notes': // assigned notes
          return Promise.resolve({
            notes: [
              { id: 'paper1Id', forum: 'paper1Id', number: 1, details: { directReplies: [] } },
            ],
          })
        case '/groups': // anon AC and per paper ACs group
          return Promise.resolve({
            groups: [
              // anon AC group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                members: ['~Test_Senior_Program_Committee1'],
              },
              // per paper ACs group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee`,
                members: ['~Test_Senior_Program_Committee1'],
              },
            ],
          })
        case '/invitations':
          return Promise.resolve({
            invitations: [
              {
                id: `AAAI.org/2025/Conference/Submission1/-/Official_Review`,
              },
            ],
          })
        default:
          return null
      }
    })

    const providerProps = {
      value: {
        header: {
          title: 'Program Committee Console',
          instructions: 'some instructions',
        },
        entity: { id: 'AAAI.org/2025/Conference/Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerName: 'Program_Committee',
        officialReviewName: 'Official_Review',
        reviewRatingName: 'rating',
        areaChairName: 'Senior_Program_Committee',
        submissionName: 'Submission',
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        recruitmentInvitationId: 'AAAI.org/2025/Conference/Program_Committee/-/Recruitment',
        customMaxPapersInvitationId:
          'AAAI.org/2025/Conference/Program_Committee/-/Custom_Max_Papers',
        reviewLoad: '',
        hasPaperRanking: false,
        reviewDisplayFields: undefined,
      },
    }

    renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(2) // header + 1 note
      expect(screen.getByText('note summary')).toBeInTheDocument()
      expect(screen.getByText('note review status')).toBeInTheDocument()
      expect(
        screen.getByRole('link', { value: 'Test Senior Program Committee' })
      ).toHaveAttribute('href', '/profile?id=~Test_Senior_Program_Committee1')

      expect(noteSummaryProps).toHaveBeenCalledWith(
        expect.objectContaining({ note: expect.objectContaining({ id: 'paper1Id' }) })
      )
      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          invitationUrl: expect.stringContaining(
            '&invitationId=AAAI.org/2025/Conference/Submission1/-/Official_Review'
          ),
        })
      )
      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          invitationUrl: expect.stringContaining(
            encodeURIComponent(
              '[Program Committee Console](/group?id=AAAI.org/2025/Conference/Program_Committee#assigned-submissions)'
            )
          ),
        })
      )
    })
  })

  test('show note info and note review info (with reviews))', async () => {
    const reviewer1AnonId = Math.random().toString(36).substring(2, 6)
    const reviewer2AnonId = Math.random().toString(36).substring(2, 6)
    const acAnonId = Math.random().toString(36).substring(2, 6)
    api.getAll = jest.fn(() =>
      Promise.resolve([
        // anon groups
        {
          id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer1AnonId}`,
          members: ['~Test_Program_Committee1'],
        },
        // per paper reviewers group
        {
          id: `AAAI.org/2025/Conference/Submission1/Program_Committee`,
          members: ['~Test_Program_Committee1', '~Test_Program_Committee1'],
        },
      ])
    )
    api.get = jest.fn((path) => {
      switch (path) {
        case '/edges':
          return Promise.resolve({ edges: [] })
        case '/notes': // assigned notes
          return Promise.resolve({
            notes: [
              {
                id: 'paper1Id',
                forum: 'paper1Id',
                number: 1,
                details: {
                  directReplies: [
                    {
                      id: 'review1Id',
                      invitations: ['AAAI.org/2025/Conference/Submission1/-/Official_Review'],
                      content: { rating: { value: 1 } },
                      signatures: [
                        `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer1AnonId}`,
                      ],
                    },
                    {
                      id: 'review2Id',
                      invitations: ['AAAI.org/2025/Conference/Submission1/-/Official_Review'],
                      content: { rating: { value: 5 } },
                      signatures: [
                        `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer2AnonId}`,
                      ],
                    },
                  ],
                },
              },
            ],
          })
        case '/groups': // anon AC and per paper ACs group
          return Promise.resolve({
            groups: [
              // anon AC group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                members: ['~Test_Senior_Program_Committee1'],
              },
              // per paper ACs group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee`,
                members: ['~Test_Senior_Program_Committee1'],
              },
            ],
          })
        case '/invitations':
          return Promise.resolve({
            invitations: [
              {
                id: `AAAI.org/2025/Conference/Submission1/-/Official_Review`,
              },
            ],
          })
        default:
          return null
      }
    })

    const providerProps = {
      value: {
        header: {
          title: 'Program Committee Console',
          instructions: 'some instructions',
        },
        entity: { id: 'AAAI.org/2025/Conference/Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerName: 'Program_Committee',
        officialReviewName: 'Official_Review',
        reviewRatingName: 'rating',
        areaChairName: 'Senior_Program_Committee',
        submissionName: 'Submission',
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        recruitmentInvitationId: 'AAAI.org/2025/Conference/Program_Committee/-/Recruitment',
        customMaxPapersInvitationId:
          'AAAI.org/2025/Conference/Program_Committee/-/Custom_Max_Papers',
        reviewLoad: '',
        hasPaperRanking: false,
        reviewDisplayFields: undefined,
      },
    }

    renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(screen.getByText('note summary')).toBeInTheDocument()
      expect(screen.getByText('note review status')).toBeInTheDocument()

      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          editUrl: expect.stringContaining('id=paper1Id&noteId=review1Id'),
          officialReview: expect.objectContaining({ id: 'review1Id' }),
          paperRatings: [{ rating: 1 }],
        })
      )
    })
  })

  test('show note info and note review info (anon id in group)', async () => {
    const reviewer1AnonId = Math.random().toString(36).substring(2, 6)
    const reviewer2AnonId = Math.random().toString(36).substring(2, 6)
    const acAnonId = Math.random().toString(36).substring(2, 6)
    api.getAll = jest.fn(() =>
      Promise.resolve([
        // anon groups
        {
          id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer1AnonId}`,
          members: ['~Test_Program_Committee1'],
        },
        // per paper reviewers group
        {
          id: `AAAI.org/2025/Conference/Submission1/Program_Committee`,
          members: [
            `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer1AnonId}`,
            `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer2AnonId}`,
          ],
        },
      ])
    )
    api.get = jest.fn((path) => {
      switch (path) {
        case '/edges':
          return Promise.resolve({ edges: [] })
        case '/notes': // assigned notes
          return Promise.resolve({
            notes: [
              {
                id: 'paper1Id',
                forum: 'paper1Id',
                number: 1,
                details: {
                  directReplies: [
                    {
                      id: 'review1Id',
                      invitations: ['AAAI.org/2025/Conference/Submission1/-/Official_Review'],
                      content: { rating: { value: 1 } },
                      signatures: [
                        `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer1AnonId}`,
                      ],
                    },
                    {
                      id: 'review2Id',
                      invitations: ['AAAI.org/2025/Conference/Submission1/-/Official_Review'],
                      content: { rating: { value: 5 } },
                      signatures: [
                        `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer2AnonId}`,
                      ],
                    },
                  ],
                },
              },
            ],
          })
        case '/groups': // anon AC and per paper ACs group
          return Promise.resolve({
            groups: [
              // anon AC group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                members: ['~Test_Senior_Program_Committee1'],
              },
              // per paper ACs group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee`,
                members: [
                  `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                ],
              },
            ],
          })
        case '/invitations':
          return Promise.resolve({
            invitations: [
              {
                id: `AAAI.org/2025/Conference/Submission1/-/Official_Review`,
              },
            ],
          })
        default:
          return null
      }
    })

    const providerProps = {
      value: {
        header: {
          title: 'Program Committee Console',
          instructions: 'some instructions',
        },
        entity: { id: 'AAAI.org/2025/Conference/Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerName: 'Program_Committee',
        officialReviewName: 'Official_Review',
        reviewRatingName: 'rating',
        areaChairName: 'Senior_Program_Committee',
        submissionName: 'Submission',
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        recruitmentInvitationId: 'AAAI.org/2025/Conference/Program_Committee/-/Recruitment',
        customMaxPapersInvitationId:
          'AAAI.org/2025/Conference/Program_Committee/-/Custom_Max_Papers',
        reviewLoad: '',
        hasPaperRanking: false,
        reviewDisplayFields: undefined,
      },
    }

    renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(screen.getByText('note summary')).toBeInTheDocument()
      expect(screen.getByText('note review status')).toBeInTheDocument()

      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          editUrl: expect.stringContaining('id=paper1Id&noteId=review1Id'),
          officialReview: expect.objectContaining({ id: 'review1Id' }),
          paperRatings: [{ rating: 1 }],
        })
      )
    })
  })

  test('show note info and note review info (array rating names)', async () => {
    const reviewer1AnonId = Math.random().toString(36).substring(2, 6)
    const reviewer2AnonId = Math.random().toString(36).substring(2, 6)
    const acAnonId = Math.random().toString(36).substring(2, 6)
    api.getAll = jest.fn(() =>
      Promise.resolve([
        // anon groups
        {
          id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer1AnonId}`,
          members: ['~Test_Program_Committee1'],
        },
        // per paper reviewers group
        {
          id: `AAAI.org/2025/Conference/Submission1/Program_Committee`,
          members: [
            `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer1AnonId}`,
            `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer2AnonId}`,
          ],
        },
      ])
    )
    api.get = jest.fn((path) => {
      switch (path) {
        case '/edges':
          return Promise.resolve({ edges: [] })
        case '/notes': // assigned notes
          return Promise.resolve({
            notes: [
              {
                id: 'paper1Id',
                forum: 'paper1Id',
                number: 1,
                details: {
                  directReplies: [
                    {
                      id: 'review1Id',
                      invitations: ['AAAI.org/2025/Conference/Submission1/-/Official_Review'],
                      content: {
                        first_rating: { value: 1 },
                        second_rating: { value: 2 },
                        third_rating: { value: 3 },
                      },
                      signatures: [
                        `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer1AnonId}`,
                      ],
                    },
                    {
                      id: 'review2Id',
                      invitations: ['AAAI.org/2025/Conference/Submission1/-/Official_Review'],
                      content: {
                        first_rating: { value: 5 },
                        second_rating: { value: 6 },
                        third_rating: { value: 7 },
                      },
                      signatures: [
                        `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer2AnonId}`,
                      ],
                    },
                  ],
                },
              },
            ],
          })
        case '/groups': // anon AC and per paper ACs group
          return Promise.resolve({
            groups: [
              // anon AC group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                members: ['~Test_Senior_Program_Committee1'],
              },
              // per paper ACs group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee`,
                members: [
                  `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                ],
              },
            ],
          })
        case '/invitations':
          return Promise.resolve({
            invitations: [
              {
                id: `AAAI.org/2025/Conference/Submission1/-/Official_Review`,
              },
            ],
          })
        default:
          return null
      }
    })

    const providerProps = {
      value: {
        header: {
          title: 'Program Committee Console',
          instructions: 'some instructions',
        },
        entity: { id: 'AAAI.org/2025/Conference/Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerName: 'Program_Committee',
        officialReviewName: 'Official_Review',
        reviewRatingName: 'rating',
        areaChairName: 'Senior_Program_Committee',
        submissionName: 'Submission',
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        recruitmentInvitationId: 'AAAI.org/2025/Conference/Program_Committee/-/Recruitment',
        customMaxPapersInvitationId:
          'AAAI.org/2025/Conference/Program_Committee/-/Custom_Max_Papers',
        reviewLoad: '',
        hasPaperRanking: false,
        reviewDisplayFields: undefined,
      },
    }

    // array rating
    providerProps.value.reviewRatingName = ['second_rating', 'third_rating']
    renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    await waitFor(() => {
      expect(screen.getByText('note summary')).toBeInTheDocument()
      expect(screen.getByText('note review status')).toBeInTheDocument()

      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          paperRatings: [{ second_rating: 2 }, { third_rating: 3 }],
        })
      )
    })
  })

  test('show note info and note review info (array object rating names with fallback', async () => {
    const reviewer1AnonId = Math.random().toString(36).substring(2, 6)
    const reviewer2AnonId = Math.random().toString(36).substring(2, 6)
    const acAnonId = Math.random().toString(36).substring(2, 6)
    api.getAll = jest.fn(() =>
      Promise.resolve([
        // anon groups
        {
          id: `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer1AnonId}`,
          members: ['~Test_Program_Committee1'],
        },
        // per paper reviewers group
        {
          id: `AAAI.org/2025/Conference/Submission1/Program_Committee`,
          members: [
            `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer1AnonId}`,
            `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer2AnonId}`,
          ],
        },
      ])
    )
    api.get = jest.fn((path) => {
      switch (path) {
        case '/edges':
          return Promise.resolve({ edges: [] })
        case '/notes': // assigned notes
          return Promise.resolve({
            notes: [
              {
                id: 'paper1Id',
                forum: 'paper1Id',
                number: 1,
                details: {
                  directReplies: [
                    {
                      id: 'review1Id',
                      invitations: ['AAAI.org/2025/Conference/Submission1/-/Official_Review'],
                      content: {
                        first_rating: { value: 1 },
                        second_rating: { value: 2 },
                        third_rating: { value: 3 },
                      },
                      signatures: [
                        `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer1AnonId}`,
                      ],
                    },
                    {
                      id: 'review2Id',
                      invitations: ['AAAI.org/2025/Conference/Submission1/-/Official_Review'],
                      content: {
                        first_rating: { value: 5 },
                        second_rating: { value: 6 },
                        third_rating: { value: 7 },
                      },
                      signatures: [
                        `AAAI.org/2025/Conference/Submission1/Program_Committee_${reviewer2AnonId}`,
                      ],
                    },
                  ],
                },
              },
            ],
          })
        case '/groups': // anon AC and per paper ACs group
          return Promise.resolve({
            groups: [
              // anon AC group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                members: ['~Test_Senior_Program_Committee1'],
              },
              // per paper ACs group
              {
                id: `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee`,
                members: [
                  `AAAI.org/2025/Conference/Submission1/Senior_Program_Committee_${acAnonId}`,
                ],
              },
            ],
          })
        case '/invitations':
          return Promise.resolve({
            invitations: [
              {
                id: `AAAI.org/2025/Conference/Submission1/-/Official_Review`,
              },
            ],
          })
        default:
          return null
      }
    })

    const providerProps = {
      value: {
        header: {
          title: 'Program Committee Console',
          instructions: 'some instructions',
        },
        entity: { id: 'AAAI.org/2025/Conference/Program_Committee' },
        venueId: 'AAAI.org/2025/Conference',
        reviewerName: 'Program_Committee',
        officialReviewName: 'Official_Review',
        reviewRatingName: 'rating',
        areaChairName: 'Senior_Program_Committee',
        submissionName: 'Submission',
        submissionInvitationId: 'AAAI.org/2025/Conference/-/Submission',
        recruitmentInvitationId: 'AAAI.org/2025/Conference/Program_Committee/-/Recruitment',
        customMaxPapersInvitationId:
          'AAAI.org/2025/Conference/Program_Committee/-/Custom_Max_Papers',
        reviewLoad: '',
        hasPaperRanking: false,
        reviewDisplayFields: undefined,
      },
    }

    // array object rating with fallback
    providerProps.value.reviewRatingName = [
      {
        user_defined_rating_name: ['non_existing_rating', 'first_rating'],
      },
      {
        fancy_rating_name: ['second_rating', 'third_rating'],
      },
      'third_rating',
      'another_non_existing_rating',
    ]
    renderWithWebFieldContext(
      <ReviewerConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    await waitFor(() => {
      expect(screen.getByText('note summary')).toBeInTheDocument()
      expect(screen.getByText('note review status')).toBeInTheDocument()

      expect(noteReviewStatusProps).toHaveBeenCalledWith(
        expect.objectContaining({
          paperRatings: [
            { user_defined_rating_name: 1 }, // fall back to first_rating
            { fancy_rating_name: 2 }, // second_rating exist so take second rating
            { third_rating: 3 }, // third_rating
            { another_non_existing_rating: undefined }, // non existing rating so undefined
          ],
        })
      )
    })
  })
})
