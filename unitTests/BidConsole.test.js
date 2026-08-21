import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setBannerContent } from '../bannerSlice'
import BidConsole from '../components/webfield/BidConsole'
import api from '../lib/api-client'
import { renderWithWebFieldContext } from './util'
import '@testing-library/jest-dom'

let dispatch
let useTurnstileTokenProps
let mockTurnstileToken
jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useTurnstileToken', () => (key, renderWidget) => {
  useTurnstileTokenProps(key, renderWidget)
  return {
    // the token only exists once the user has solved the challenge
    turnstileToken: renderWidget ? mockTurnstileToken : null,
    turnstileContainerRef: { current: null },
  }
})
jest.mock('../hooks/useUser', () => () => ({
  user: {
    profile: {
      id: 'some id',
    },
  },
  accessToken: 'some token',
}))
jest.mock('../app/CustomBanner', () => () => <span>Custom Banner</span>)
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => jest.fn(),
  }),
  useRouter: jest.fn(),
}))

jest.mock('react-redux', () => ({
  useDispatch: () => dispatch,
}))

let bidInvitation

global.promptError = jest.fn()
global.typesetMathJax = jest.fn()
global.marked = jest.fn()
global.DOMPurify = {
  sanitize: jest.fn(),
}
global.$ = jest.fn(() => ({ on: jest.fn(), off: jest.fn(), modal: jest.fn() }))

beforeEach(() => {
  bidInvitation = {
    id: 'AAAI.org/2025/Conference/Program_Committee/-/Bid',
    edge: {
      label: {
        param: {
          enum: ['Very High', 'High', 'Neutral', 'Low', 'Very Low'],
          input: 'radio',
        },
      },
    },
  }
  dispatch = jest.fn()
  useTurnstileTokenProps = jest.fn()
  mockTurnstileToken = null
})

// Console with a single note loaded, so that a bid can be clicked
const bidProviderProps = () => {
  api.getAll = jest.fn(() => Promise.resolve([]))
  api.get = jest.fn((path) => {
    switch (path) {
      case '/edges':
        return Promise.resolve({ edges: [] })
      case '/notes':
      case '/notes/search':
        return Promise.resolve({
          notes: [
            {
              id: 'noteId1',
              content: { title: { value: 'Note one' } },
              invitations: ['AAAI.org/2025/Conference/-/Submission'],
              readers: [
                'AAAI.org/2025/Conference',
                'AAAI.org/2025/Conference/Program_Committee',
              ],
            },
          ],
          count: 1,
        })
      default:
        return null
    }
  })

  return {
    value: {
      header: {
        title: 'Program Committee Bidding Console',
        instructions: '** some instructions **',
      },
      venueId: 'AAAI.org/2025/Conference',
      submissionVenueId: 'AAAI.org/2025/Conference/Submission',
      entity: bidInvitation,
      scoreIds: [],
      conflictInvitationId: 'AAAI.org/2025/Conference/Program_Committee/-/Conflict',
    },
  }
}

describe('BidConsole', () => {
  test('show error page if config is not complete', () => {
    bidInvitation.edge.label.param.enum = undefined
    const providerProps = {
      value: {
        header: {
          title: 'Program Committee Bidding Console',
          instructions: '** some instructions **',
        },
        venueId: 'AAAI.org/2025/Conference',
        submissionVenueId: 'AAAI.org/2025/Conference/Submission',
        entity: bidInvitation,
        scoreIds: [],
        conflictInvitationId: 'AAAI.org/2025/Conference/Program_Committee/-/Conflict',
      },
    }

    renderWithWebFieldContext(
      <BidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(
      screen.getByText('Bidding Console is missing required properties: bidOptions')
    ).toBeInTheDocument()
  })

  test('support subjectAreasName', async () => {
    const providerProps = {
      value: {
        header: {
          title: 'Program Committee Bidding Console',
          instructions: '** some instructions **',
        },
        venueId: 'AAAI.org/2025/Conference',
        submissionVenueId: 'AAAI.org/2025/Conference/Submission',
        entity: bidInvitation,
        scoreIds: [],
        conflictInvitationId: 'AAAI.org/2025/Conference/Program_Committee/-/Conflict',
        subjectAreasName: 'primary_keyword',
        subjectAreas: [
          // subjectAreas is an array of objects when subjectAreasName is specified
          { value: 'subject_area_1', description: 'Subject Area One' },
          { value: 'subject_area_2', description: 'Subject Area Two' },
        ],
      },
    }

    api.get = jest.fn((path, queryParam) => {
      switch (path) {
        case '/edges': // bid and conflict edges
          return Promise.resolve({ edges: [] })
        case '/notes':
          if (queryParam.stream)
            // all notes for subject areas dropdown filtering
            return Promise.resolve({
              notes: [
                {
                  id: 'noteId1',
                  content: {
                    title: {
                      value: 'Note one',
                    },
                    primary_keyword: {
                      value: 'subject_area_1',
                    },
                  },
                  invitations: ['AAAI.org/2025/Conference/-/Submission'],
                  readers: [
                    'AAAI.org/2025/Conference',
                    'AAAI.org/2025/Conference/Program_Committee',
                  ],
                },
                {
                  id: 'noteId2',
                  content: {
                    title: {
                      value: 'Note two',
                    },
                    primary_keyword: {
                      value: 'subject_area_2',
                    },
                  },
                  invitations: ['AAAI.org/2025/Conference/-/Submission'],
                  readers: [
                    'AAAI.org/2025/Conference',
                    'AAAI.org/2025/Conference/Program_Committee',
                  ],
                },
              ],
            })
          else
            return Promise.resolve({
              notes: [
                {
                  id: 'noteId1',
                  content: {
                    title: {
                      value: 'Note one',
                    },
                    primary_keyword: {
                      value: 'subject_area_1',
                    },
                  },
                  invitations: ['AAAI.org/2025/Conference/-/Submission'],
                  readers: [
                    'AAAI.org/2025/Conference',
                    'AAAI.org/2025/Conference/Program_Committee',
                  ],
                },
                {
                  id: 'noteId2',
                  content: {
                    title: {
                      value: 'Note two',
                    },
                    primary_keyword: {
                      value: 'subject_area_2',
                    },
                  },
                  invitations: ['AAAI.org/2025/Conference/-/Submission'],
                  readers: [
                    'AAAI.org/2025/Conference',
                    'AAAI.org/2025/Conference/Program_Committee',
                  ],
                },
              ],
              count: 2,
            })
        default:
          return null
      }
    })

    renderWithWebFieldContext(
      <BidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(screen.getAllByText('Primary Keyword', { exact: false })[0].textContent).toEqual(
        // label is using custom name
        'Primary Keyword:'
      )
      expect(
        screen.queryByPlaceholderText('Search by paper title and metadata')
      ).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Subject Area One' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Subject Area Two' })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('option', { name: 'Subject Area One' })) // select subject area one should filter out note 2
    await waitFor(() => {
      expect(screen.getByText('Note one')).toBeInTheDocument()
      expect(screen.queryByText('Note two')).not.toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('combobox')) // select subject area two should filter out note 1
    await userEvent.click(screen.getByRole('option', { name: 'Subject Area Two' }))
    await waitFor(() => {
      expect(screen.queryByText('Note one')).not.toBeInTheDocument()
      expect(screen.getByText('Note two')).toBeInTheDocument()
    })
  })

  test('not to show search input when enableSearch is set to false', async () => {
    const providerProps = {
      value: {
        header: {
          title: 'Program Committee Bidding Console',
          instructions: '** some instructions **',
        },
        venueId: 'AAAI.org/2025/Conference',
        submissionVenueId: 'AAAI.org/2025/Conference/Submission',
        entity: bidInvitation,
        scoreIds: [],
        enableSearch: false,
      },
    }

    api.getAll = jest.fn((path) => {
      switch (path) {
        case '/edges':
          return Promise.resolve([])
        case '/notes':
          return Promise.resolve([])
        default:
          return null
      }
    })

    api.get = jest.fn((path) => {
      switch (path) {
        case '/notes':
          return Promise.resolve({
            notes: [],
            count: 0,
          })
        default:
          return null
      }
    })

    renderWithWebFieldContext(
      <BidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText('Search by paper title and metadata')
      ).not.toBeInTheDocument()
    })
  })

  test('show es down banner when es fail', async () => {
    const providerProps = {
      value: {
        header: {
          title: 'Program Committee Bidding Console',
          instructions: '** some instructions **',
        },
        venueId: 'AAAI.org/2025/Conference',
        submissionVenueId: 'AAAI.org/2025/Conference/Submission',
        entity: bidInvitation,
        scoreIds: [],
        conflictInvitationId: 'AAAI.org/2025/Conference/Program_Committee/-/Conflict',
        subjectAreasName: undefined,
        subjectAreas: ['Subject Area One', 'Subject Area Two'],
      },
    }

    api.get = jest.fn((path) => {
      switch (path) {
        case '/edges':
          return Promise.resolve({ edges: [] })
        case '/notes':
          return Promise.resolve({
            notes: [],
            count: 0,
          })
        case '/notes/search':
          return Promise.resolve({
            notes: [],
            count: 0,
            searchUnavailable: true,
          })
        default:
          return null
      }
    })

    renderWithWebFieldContext(
      <BidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      userEvent.click(screen.getByRole('combobox'))
      userEvent.click(screen.getByRole('option', { name: 'Subject Area One' }))
      expect(dispatch).toHaveBeenCalledWith(
        setBannerContent({
          type: 'error',
          value:
            'OpenReview is experiencing degraded performance in search functionality. Please try again later.',
        })
      )
    })
  })

  test('show turnstile challenge when bid post returns human verification error', async () => {
    const humanVerificationError = new Error('Human verification required')
    humanVerificationError.name = 'HumanVerificationRequiredError'
    api.post = jest.fn(() => Promise.reject(humanVerificationError))

    renderWithWebFieldContext(
      <BidConsole appContext={{ setBannerContent: jest.fn() }} />,
      bidProviderProps()
    )

    await waitFor(() => expect(screen.getByText('Note one')).toBeInTheDocument())
    const veryHighButton = screen.getByText('Very High', { selector: 'label.radio-toggle' })
    await userEvent.click(within(veryHighButton).getByRole('radio'))

    await waitFor(() => {
      expect(useTurnstileTokenProps).toHaveBeenCalledWith('bidConsole', true)
      expect(
        screen.getByText('To confirm you are not a robot', { exact: false })
      ).toBeInTheDocument()
    })
  })

  test('retry bid after HumanVerificationRequiredError and turnstile token obtained', async () => {
    const humanVerificationError = new Error('Human verification required')
    humanVerificationError.name = 'HumanVerificationRequiredError'
    api.post = jest
      .fn()
      .mockRejectedValueOnce(humanVerificationError)
      .mockResolvedValue({ id: 'bidEdgeId', head: 'noteId1', label: 'Very High' })
    mockTurnstileToken = 'some token'

    renderWithWebFieldContext(
      <BidConsole appContext={{ setBannerContent: jest.fn() }} />,
      bidProviderProps()
    )

    await waitFor(() => expect(screen.getByText('Note one')).toBeInTheDocument())
    const veryHighButton = screen.getByText('Very High', { selector: 'label.radio-toggle' })
    await userEvent.click(within(veryHighButton).getByRole('radio'))

    // initial failure + retry with token
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2)
      expect(api.post).toHaveBeenNthCalledWith(
        1,
        '/edges',
        expect.objectContaining({ head: 'noteId1', label: 'Very High' }),
        {}
      )
      expect(api.post).toHaveBeenNthCalledWith(
        2,
        '/edges',
        expect.objectContaining({ head: 'noteId1', label: 'Very High' }),
        expect.objectContaining({ 'cf-turnstile-token': 'some token' })
      )
    })
  })
})
