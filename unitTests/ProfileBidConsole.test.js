import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import ProfileBidConsole from '../components/webfield/ProfileBidConsole'
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
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => jest.fn(),
  }),
  useRouter: jest.fn(),
}))
jest.mock('../app/CustomBanner', () => () => <span>Custom Banner</span>)
jest.mock('../components/ProfileListWithBidWidget', () => (props) => {
  profileListProps(props)
  return <span>profile list</span>
})

let bidInvitation
let profileListProps

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
  profileListProps = jest.fn()
})

global.promptError = jest.fn()
global.MathJax = jest.fn()
global.marked = jest.fn()
global.DOMPurify = {
  sanitize: jest.fn(),
}
global.$ = jest.fn(() => ({ on: jest.fn(), off: jest.fn(), modal: jest.fn() }))

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
    expect(
      screen.getByText('Bidding Console is missing required properties: profileGroupId')
    ).toBeInTheDocument()
  })

  test('allow conflictInvitationId to be optional', async () => {
    const getAll = jest.fn(() => Promise.resolve([]))
    api.getAll = getAll
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
        profileGroupId: 'NeurIPS.cc/2023/Conference/Area_Chairs',
      },
    }

    renderWithWebFieldContext(
      <ProfileBidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )
    await waitFor(() => {
      expect(
        screen.queryByText('missing required properties', { exact: false })
      ).not.toBeInTheDocument()
      expect(getAll).toHaveBeenCalledTimes(1)
      expect(getAll).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ invitation: bidInvitation.id }),
        expect.anything()
      )
    })
  })

  test('show page title, instruction, bid count, tabs and profilelist', async () => {
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
      expect(marked).toHaveBeenCalledWith('** some instructions **')
      expect(screen.getByText('rendered title')).toBeInTheDocument()
      expect(screen.getByText('You have completed 0 bids')).toBeInTheDocument()
      expect(screen.getByText('All Area Chairs')).toBeInTheDocument()
      expect(screen.getByText('Very High')).toBeInTheDocument()
      expect(screen.getByText('High')).toBeInTheDocument()
      expect(screen.getByText('Neutral')).toBeInTheDocument()
      expect(screen.getByText('Low')).toBeInTheDocument()
      expect(screen.getByText('Very Low')).toBeInTheDocument()
      expect(screen.getByText('profile list')).toBeInTheDocument()
      expect(profileListProps).toHaveBeenCalledWith(expect.objectContaining({ profiles: [] }))
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
      expect(screen.getByText('All Some PROFILE id')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search Some PROFILE id')).toBeInTheDocument()
      expect(profileListProps).toHaveBeenCalledWith(
        expect.objectContaining({ emptyMessage: 'No Some PROFILE id to display at this time' })
      )
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
      expect(screen.getByText('You have completed 3 bids')).toBeInTheDocument()
    })
  })

  test('show profiles in ac group if fits in one page(25)', async () => {
    const getBidConlictEdges = jest.fn(() => Promise.resolve([]))
    const ACProfiles = Array.from(new Array(25), (_, index) => ({
      id: `~test_id${index}`,
      content: {
        names: [
          {
            fullname: `first last${index}`,
            username: `~first_last${index}`,
          },
        ],
      },
    }))
    const getACProfiles = jest.fn(() =>
      Promise.resolve({
        profiles: ACProfiles,
      })
    )
    api.getAll = getBidConlictEdges
    api.get = getACProfiles

    const providerProps = {
      value: {
        venueId: 'NeurIPS.cc/2023/Conference',
        header: {
          title: 'bidding console',
          instructions: '',
        },
        entity: bidInvitation,
        scoreIds: [],
        profileGroupId: 'NeurIPS.cc/2023/Conference/Area_Chairs',
      },
    }

    renderWithWebFieldContext(
      <ProfileBidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(profileListProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          profiles: expect.arrayContaining([
            expect.objectContaining({ id: '~test_id0' }),
            expect.objectContaining({ id: '~test_id24' }),
          ]),
        })
      )
    })
  })

  test('show paginated profiles if does not fit one page(25)', async () => {
    const getBidConlictEdges = jest.fn(() => Promise.resolve([]))
    const ACProfiles = Array.from(new Array(125), (_, index) => ({
      id: `~test_id${index}`,
      content: {
        names: [
          {
            fullname: `first last${index}`,
            username: `~first_last${index}`,
          },
        ],
      },
    }))
    const getACProfiles = jest.fn(() =>
      Promise.resolve({
        profiles: ACProfiles,
      })
    )
    api.getAll = getBidConlictEdges
    api.get = getACProfiles

    const providerProps = {
      value: {
        venueId: 'NeurIPS.cc/2023/Conference',
        header: {
          title: 'bidding console',
          instructions: '',
        },
        entity: bidInvitation,
        scoreIds: [],
        profileGroupId: 'NeurIPS.cc/2023/Conference/Area_Chairs',
      },
    }

    renderWithWebFieldContext(
      <ProfileBidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(profileListProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          profiles: expect.arrayContaining([
            expect.objectContaining({ id: '~test_id0' }),
            expect.objectContaining({ id: '~test_id24' }),
            expect.not.objectContaining({ id: '~test_id25' }),
          ]),
        })
      )
    })

    await userEvent.click(screen.getByRole('button', { name: '2' }))
    expect(profileListProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        profiles: expect.arrayContaining([
          expect.objectContaining({ id: '~test_id25' }),
          expect.objectContaining({ id: '~test_id49' }),
        ]),
      })
    )

    await userEvent.click(screen.getByRole('button', { name: '»' }))
    expect(profileListProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        profiles: expect.arrayContaining([expect.objectContaining({ id: '~test_id124' })]),
      })
    )
  })

  test('filter results when user search by profile username,history and expertise', async () => {
    const getBidConlictEdges = jest.fn(() => Promise.resolve([]))
    const getACProfiles = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~Goo_Gle1',
            content: {
              names: [{ fullname: 'Goo Gle', username: '~Goo_Gle1' }],
              history: [
                {
                  position: 'student',
                  institution: {
                    domain: 'google.com',
                    name: 'Google',
                  },
                },
              ],
              expertise: [{ keywords: ['nlp', 'machine learning'] }],
            },
          },
          {
            id: '~Inter_Business1',
            content: {
              names: [{ fullname: 'Inter Business', username: '~Inter_Business1' }],
              history: [
                {
                  position: 'phd',
                  institution: {
                    domain: 'ibm.com',
                    name: 'IBM',
                  },
                },
              ],
              expertise: [{ keywords: ['knowledge base'] }],
            },
          },
        ],
      })
    )
    api.getAll = getBidConlictEdges
    api.get = getACProfiles

    const providerProps = {
      value: {
        venueId: 'NeurIPS.cc/2023/Conference',
        header: {
          title: 'bidding console',
          instructions: '',
        },
        entity: bidInvitation,
        scoreIds: [],
        profileGroupId: 'NeurIPS.cc/2023/Conference/Area_Chairs',
      },
    }

    renderWithWebFieldContext(
      <ProfileBidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(profileListProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          profiles: expect.arrayContaining([
            expect.objectContaining({ id: '~Goo_Gle1' }),
            expect.objectContaining({ id: '~Inter_Business1' }),
          ]),
        })
      )
    })

    // search by name
    await userEvent.type(screen.getByRole('textbox'), '   INTER   ')
    await waitFor(() => {
      expect(profileListProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          profiles: expect.arrayContaining([
            expect.not.objectContaining({ id: '~Goo_Gle1' }),
            expect.objectContaining({ id: '~Inter_Business1' }),
          ]),
        })
      )
    })

    // search by history
    await waitFor(() => userEvent.clear(screen.getByRole('textbox'))) // temp solution for bug
    await waitFor(() => {
      expect(profileListProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          profiles: expect.arrayContaining([
            expect.objectContaining({ id: '~Goo_Gle1' }),
            expect.objectContaining({ id: '~Inter_Business1' }),
          ]),
        })
      )
    })
    await userEvent.type(screen.getByRole('textbox'), 'student')
    await waitFor(() => {
      expect(profileListProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          profiles: expect.arrayContaining([
            expect.objectContaining({ id: '~Goo_Gle1' }),
            expect.not.objectContaining({ id: '~Inter_Business1' }),
          ]),
        })
      )
    })

    // search by expertise
    await waitFor(() => userEvent.clear(screen.getByRole('textbox'))) // temp solution for bug
    await userEvent.type(screen.getByRole('textbox'), 'knowledge base')
    await waitFor(() => {
      expect(profileListProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          profiles: expect.arrayContaining([
            expect.not.objectContaining({ id: '~Goo_Gle1' }),
            expect.objectContaining({ id: '~Inter_Business1' }),
          ]),
        })
      )
    })
  })

  test('show profiles of ac group if there is no affinity score edges', async () => {
    api.getAll = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn((path, query, option) => {
      if (path === '/edges') return Promise.resolve({ count: 0 })
      return Promise.resolve({ profiles: [{ id: '~test_id1', content: {} }] })
    })

    const providerProps = {
      value: {
        venueId: 'NeurIPS.cc/2023/Conference',
        header: {
          title: 'bidding console',
          instructions: '',
        },
        entity: bidInvitation,
        scoreIds: ['NeurIPS.cc/2023/Conference/Senior_Area_Chairs/-/Affinity_Score'],
        conflictInvitationId: 'NeurIPS.cc/2023/Conference/Senior_Area_Chairs/-/Conflict',
        profileGroupId: 'NeurIPS.cc/2023/Conference/Area_Chairs',
      },
    }

    renderWithWebFieldContext(
      <ProfileBidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(profileListProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          profiles: expect.arrayContaining([expect.objectContaining({ id: '~test_id1' })]),
        })
      )
    })
  })

  test('show only profiles from affinity score edges if exist', async () => {
    api.getAll = jest.fn(() => Promise.resolve([]))
    const getACProfiles = jest.fn(() =>
      Promise.resolve({
        edges: [{ head: '~test_id1' }, { head: '~test_id2' }],
        count: 2,
      })
    )
    const profileSearch = jest.fn(() =>
      Promise.resolve({
        profiles: [
          { id: '~test_id1', content: {} },
          { id: '~test_id2', content: {} },
        ],
      })
    )
    api.get = getACProfiles
    api.post = profileSearch

    const providerProps = {
      value: {
        venueId: 'NeurIPS.cc/2023/Conference',
        header: {
          title: 'bidding console',
          instructions: '',
        },
        entity: bidInvitation,
        scoreIds: ['NeurIPS.cc/2023/Conference/Senior_Area_Chairs/-/Affinity_Score'],
        conflictInvitationId: 'NeurIPS.cc/2023/Conference/Senior_Area_Chairs/-/Conflict',
        profileGroupId: 'NeurIPS.cc/2023/Conference/Area_Chairs',
      },
    }

    renderWithWebFieldContext(
      <ProfileBidConsole appContext={{ setBannerContent: jest.fn() }} />,
      providerProps
    )

    await waitFor(() => {
      expect(profileSearch).toHaveBeenCalledWith(
        expect.anything(),
        { ids: ['~test_id1', '~test_id2'] },
        expect.anything()
      )
      expect(profileListProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          profiles: expect.arrayContaining([
            expect.objectContaining({ id: '~test_id1' }),
            expect.objectContaining({ id: '~test_id2' }),
          ]),
        })
      )
    })
  })

  test('show profiles with bid edge in bid option tab', async () => {
    api.getAll = jest.fn((path, query, option) => {
      if (query.invitation === bidInvitation.id)
        return Promise.resolve([
          { head: '~test_id1', label: 'Very High' },
          { head: '~test_id2', label: 'Neutral' },
        ])
      return Promise.resolve([])
    })
    api.get = jest.fn(() => Promise.resolve([]))
    const getProfileWithBidEdge = jest.fn((path, query, option) => {
      if (query.ids[0] === '~test_id1') {
        // very high tab
        return Promise.resolve({
          profiles: [{ id: '~test_id1', content: {} }],
        })
      }
      // neutral tab
      return Promise.resolve({
        profiles: [{ id: '~test_id2', content: {} }],
      })
    })
    api.post = getProfileWithBidEdge

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

    await waitFor(() => userEvent.click(screen.getByText('Very High')))
    await waitFor(() => {
      expect(getProfileWithBidEdge).toHaveBeenCalledWith(
        expect.anything(),
        { ids: ['~test_id1'] },
        expect.anything()
      )
      expect(profileListProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          profiles: [{ id: '~test_id1', content: {} }],
        })
      )
    })

    await waitFor(() => userEvent.click(screen.getByText('Neutral')))
    await waitFor(() => {
      expect(getProfileWithBidEdge).toHaveBeenCalledWith(
        expect.anything(),
        { ids: ['~test_id2'] },
        expect.anything()
      )
      expect(profileListProps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          profiles: [{ id: '~test_id2', content: {} }],
        })
      )
    })
  })
})
