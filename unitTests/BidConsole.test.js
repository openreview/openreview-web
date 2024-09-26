import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import BidConsole from '../components/webfield/BidConsole'
import { renderWithWebFieldContext } from './util'
import '@testing-library/jest-dom'
import api from '../lib/api-client'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => () => ({
  user: {
    profile: {
      id: 'some id',
    },
  },
  accessToken: 'some token',
}))
jest.mock('../hooks/useQuery', () => () => ({}))
let bidInvitation

global.promptError = jest.fn()
global.typesetMathJax = jest.fn()
global.marked = jest.fn()
global.DOMPurify = {
  sanitize: jest.fn(),
}

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
})

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

    api.getAll = jest.fn((path) => {
      switch (path) {
        case '/edges': // bid and conflict edges
          return Promise.resolve([])
        case '/notes': // all notes for subject areas dropdown filtering
          return Promise.resolve([
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
          ])
        default:
          return null
      }
    })

    api.get = jest.fn((path) => {
      switch (path) {
        case '/notes':
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
})
