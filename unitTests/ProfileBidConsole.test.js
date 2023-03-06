import ProfileBidConsole from '../components/webfield/ProfileBidConsole'
import { renderWithWebFieldContext } from './util'
import { screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => {
  return () => ({
    user: {
      profile: {
        id: 'some id',
      },
    },
    accessToken: 'some token',
  })
})
jest.mock('../hooks/useQuery', () => {
  return () => ({})
})
import api from '../lib/api-client'
global.promptError = jest.fn()
global.MathJax = jest.fn()
global.marked = jest.fn()
global.DOMPurify = {
  sanitize: jest.fn(),
}

let bidInvitation

beforeEach(() => {
  bidInvitation = {
    id: 'NeurIPS.cc/2023/Conference/Senior_Area_Chairs/-/Bid',
    edge: {
      label: {
        param: {
          enum: ['Very High', 'High', 'Neutral', 'Low', 'Very Low'],
        },
      },
    },
  }
})

describe('ProfileBidConsole', () => {
  test('show error page if config is not complete', () => {
    const providerProps = {
      value: {
        venueId: 'NeurIPS.cc/2023/Conference',
        header: {
          title: 'bidding console',
          instructions: '** some instructions **',
        },
        entity: bidInvitation,
        scoreIds: [],
        conflictInvitationId: 'NeurIPS.cc/2023/Conference/Senior_Area_Chairs/-/Conflict',
      },
    }

    renderWithWebFieldContext(
      <ProfileBidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    expect(screen.getByText('Bidding Console is missing required properties: profileGroupId'))
  })

  test('show page title, instruction, bid count, tabs and empty message', async () => {
    const marked = jest.fn()
    global.marked = marked
    global.DOMPurify.sanitize = jest.fn(() => '<span>rendered title</span>')
    api.getAll = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))

    const providerProps = {
      value: {
        venueId: 'NeurIPS.cc/2023/Conference',
        header: {
          title: 'bidding console',
          instructions: '** some instructions **',
        },
        entity: bidInvitation,
        scoreIds: [],
        conflictInvitationId: 'NeurIPS.cc/2023/Conference/Senior_Area_Chairs/-/Conflict',
        profileGroupId: 'NeurIPS.cc/2023/Conference/Area_Chairs',
      },
    }

    renderWithWebFieldContext(
      <ProfileBidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(marked).toBeCalledWith('** some instructions **')
      expect(screen.getByText('rendered title'))
      expect(screen.getByText('You have completed 0 bids'))
      expect(screen.getByText('All Area Chairs'))
      expect(screen.getByText('Very High'))
      expect(screen.getByText('High'))
      expect(screen.getByText('Neutral'))
      expect(screen.getByText('Low'))
      expect(screen.getByText('Very Low'))
      expect(screen.getByText('No Area Chairs to display at this time'))
      expect(screen.queryByRole('dropdown')).not.toBeInTheDocument()
    })
  })

  test('show dynamic tab title,search placeholder and empty message based on profileGroupId', async () => {
    api.getAll = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))

    const providerProps = {
      value: {
        venueId: 'NeurIPS.cc/2023/Conference',
        header: {
          title: 'bidding console',
          instructions: '',
        },
        entity: bidInvitation,
        scoreIds: [],
        conflictInvitationId: 'NeurIPS.cc/2023/Conference/Senior_Area_Chairs/-/Conflict',
        profileGroupId: 'NeurIPS.cc/2023/Conference/Some_PROFILE_id',
      },
    }

    renderWithWebFieldContext(
      <ProfileBidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(screen.getByText('All Some PROFILE id'))
      expect(screen.getByPlaceholderText('Search Some PROFILE id'))
      expect(screen.getByText('No Some PROFILE id to display at this time'))
    })
  })

  test('show number of existing bids', async () => {
    const getAll = jest.fn((path, query, option) => {
      if (query.invitation === bidInvitation.id)
        return Promise.resolve([{ id: 'bidEdge1' }, { id: 'bidEdge2' }, { id: 'bidEdge3' }])
      return Promise.resolve([])
    })
    api.getAll = getAll
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))

    const providerProps = {
      value: {
        venueId: 'NeurIPS.cc/2023/Conference',
        header: {
          title: 'bidding console',
          instructions: '',
        },
        entity: bidInvitation,
        scoreIds: [],
        conflictInvitationId: 'NeurIPS.cc/2023/Conference/Senior_Area_Chairs/-/Conflict',
        profileGroupId: 'NeurIPS.cc/2023/Conference/Area_Chairs',
      },
    }

    renderWithWebFieldContext(
      <ProfileBidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(screen.getByText('You have completed 3 bids'))
    })
  })
})
