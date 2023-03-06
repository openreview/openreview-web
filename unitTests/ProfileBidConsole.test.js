import ProfileBidConsole from '../components/webfield/ProfileBidConsole'
import { renderWithWebFieldContext } from './util'
import { screen, waitFor } from '@testing-library/react'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => {
  return () => ({ user: {}, accessToken: 'some token' })
})
jest.mock('../hooks/useQuery', () => {
  return () => ({})
})
global.promptError = jest.fn()
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
        venueId: 'NeurIPS.cc/2021/Conference',
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

  test('show page title, instruction, bid count and tabs', async () => {
    const providerProps = {
      value: {
        venueId: 'NeurIPS.cc/2021/Conference',
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
      screen.debug()
    })
  })
})
