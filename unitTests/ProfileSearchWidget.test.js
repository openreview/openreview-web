import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileSearchWidget from '../components/EditorComponents/ProfileSearchWidget'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'

import api from '../lib/api-client'

jest.mock('../hooks/useUser', () => () => ({
  user: { profile: { id: '~test_id1' } },
  accessToken: 'test token',
}))

global.$ = jest.fn(() => ({
  tooltip: jest.fn(),
}))
global.promptError = jest.fn()

describe('ProfileSearchWidget for authors+authorids field', () => {
  test('show search input and disabled search button', async () => {
    const apiPost = jest.fn(() => Promise.resolve([]))
    api.post = apiPost

    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget />, providerProps)

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('search profiles by email or name')
      ).toBeInTheDocument()
      expect(screen.getByText('Search')).toHaveAttribute('disabled')
    })
  })

  test('not to show search if there is no regex', async () => {
    const apiPost = jest.fn(() => Promise.resolve([]))
    api.post = apiPost

    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex: undefined,
              },
            },
          },
        },
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget />, providerProps)

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText('search profiles by email or name')
      ).not.toBeInTheDocument()
      expect(screen.queryByText('Search')).not.toBeInTheDocument()
    })
  })

  test('only allow authors to be reordered if there is no regex', async () => {
    const apiPost = jest.fn(() => Promise.resolve([]))
    api.post = apiPost

    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex: undefined,
              },
            },
          },
        },
        value: [
          { authorId: '~test_id1', authorName: 'First One Last One' },
          { authorId: '~test_id2', authorName: 'First Two Last Two' },
        ],
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText('search profiles by email or name')
      ).not.toBeInTheDocument()
      expect(screen.queryByText('Search')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'arrow-right' })).toBeInTheDocument()
    })
  })

  test('add current user to author list', async () => {
    const apiPost = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              preferredEmail: 'test@email.com',
            },
          },
        ],
      })
    )
    api.post = apiPost
    const onChange = jest.fn()
    const providerPropsNoValue = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
              },
            },
          },
        },
        onChange,
      },
    }

    const { rerender } = renderWithEditorComponentContext(
      <ProfileSearchWidget />,
      providerPropsNoValue
    )

    const providerPropsWithValue = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1' }],
        onChange: jest.fn(),
      },
    }

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        })
      )
      expect(apiPost).toHaveBeenCalledWith(
        '/profiles/search',
        expect.objectContaining({ ids: ['~test_id1'] }),
        expect.anything()
      )
    })

    reRenderWithEditorComponentContext(
      rerender,
      <ProfileSearchWidget />,
      providerPropsWithValue
    )

    await waitFor(() => {
      expect(screen.getByText('Test First Test Last')).toBeInTheDocument()
      expect(screen.getByText('Test First Test Last')).toHaveAttribute(
        'data-original-title',
        '~test_id1'
      )
    })
  })

  test('show tildeid or email in tooltip', async () => {
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'First One Last One', username: '~test_id1' }],
              emails: ['test1@email.com'],
            },
          },
        ],
      })
    )
    api.post = initialGetProfile
    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
              },
            },
          },
        },
        value: [
          { authorId: '~test_id1', authorName: 'First One Last One' },
          { authorId: 'test@email.com', authorName: 'First Two Last Two' },
        ],
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await waitFor(() => {
      expect(screen.getByText('First One Last One')).toHaveAttribute(
        'data-original-title',
        '~test_id1'
      )
      expect(screen.getByText('First Two Last Two')).toHaveAttribute(
        'data-original-title',
        'test@email.com'
      )
    })
  })

  test('show profile search results with emails', async () => {
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              emails: ['test@email.com', 'anothertest@email.com'],
            },
          },
        ],
      })
    )
    const searchProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~search_result1',
            content: {
              names: [
                { fullname: 'Result one Result one', username: '~search_result1' },
                {
                  fullname: 'Result one preferred Result one preferred',
                  username: '~search_result_preferred1',
                  preferred: true,
                },
              ],
              emails: ['test1@email.com', 'anothertest1@email.com'],
            },
            active: true,
          },
          {
            id: '~search_result2',
            content: {
              names: [
                { fullname: 'Result two Result two', username: '~search_result2' },
                {
                  fullname: 'Result two not preferred Result two not preferred',
                  username: '~search_result_notpreferred2',
                  preferred: false,
                },
              ],
              emails: ['test2@email.com', 'anothertest2@email.com'],
            },
            active: false,
          },
          {
            id: '~search_result3',
            content: {
              names: [{ fullname: 'Result three Result three', username: '~search_result3' }],
              emails: [],
            },
          },
        ],
        count: 2,
      })
    )
    api.post = initialGetProfile
    api.get = searchProfile

    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1' }],
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'name to search'
    )
    const searchButton = screen.getByText('Search')
    expect(searchButton).not.toHaveAttribute('disabled')

    await userEvent.click(searchButton)
    expect(screen.getAllByText('~', { exact: false })).toHaveLength(2)
    expect(screen.getAllByText('~', { exact: false })[0].parentElement.textContent).toEqual(
      '~search_result_preferred1'
    )
    expect(
      screen.getAllByText('~', { exact: false })[0].parentElement.nextSibling
    ).toHaveAttribute('class', expect.stringContaining('glyphicon-ok-sign'))
    expect(screen.getAllByText('~', { exact: false })[1].parentElement.textContent).toEqual(
      '~search_result2'
    )
    expect(
      screen.getAllByText('~', { exact: false })[1].parentElement.nextSibling
    ).toHaveAttribute('class', expect.stringContaining('glyphicon-remove-sign'))
  })

  test('search by trimmed lowercased email if user input is email', async () => {
    const getProfile = jest.fn(() => Promise.resolve([]))
    api.post = jest.fn(() => Promise.resolve([]))
    api.get = getProfile
    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1' }],
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      '   test@EMAIL.COM   '
    )
    await userEvent.click(screen.getByText('Search'))
    expect(getProfile).toHaveBeenCalledWith(
      '/profiles/search',
      { email: 'test@email.com', es: true, limit: 20, offset: 0 },
      expect.anything()
    )
  })

  test('search by id keyword if user input is tilde id', async () => {
    const getProfile = jest.fn(() => Promise.resolve([]))
    api.post = jest.fn(() => Promise.resolve([]))
    api.get = getProfile
    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1' }],
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      '   ~Test_User1   '
    )
    await userEvent.click(screen.getByText('Search'))
    expect(getProfile).toHaveBeenCalledWith(
      '/profiles/search',
      { id: '~Test_User1', es: true, limit: 20, offset: 0 },
      expect.anything()
    )
  })

  test('auto update author name if preferred name has changed since submission (invitation allows)', async () => {
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id_preferred1',
            content: {
              names: [
                { fullname: 'Test First Test Last', username: '~test_id1' },
                {
                  // user updated preferred name after submission
                  fullname: 'Test First Preferred Test Last Preferred',
                  username: '~test_id_preferred1',
                  preferred: true,
                },
              ],
              emails: ['test@email.com', 'anothertest@email.com'],
            },
          },
        ],
      })
    )

    api.post = initialGetProfile
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await waitFor(() => {
      expect(screen.queryByText('Test First Test Last')).not.toBeInTheDocument() // replaced by new preferred name
      expect(screen.getByText('Test First Preferred Test Last Preferred')).toBeInTheDocument()
      expect(screen.getByText('Test First Preferred Test Last Preferred')).toHaveAttribute(
        'data-original-title',
        '~test_id_preferred1'
      )
    })
  })

  test('not to auto update author name if preferred name has changed since submission (invitation is const)', async () => {
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id_preferred1',
            content: {
              names: [
                { fullname: 'Test First Test Last', username: '~test_id1' },
                {
                  // user updated preferred name after submission
                  fullname: 'Test First Preferred Test Last Preferred',
                  username: '~test_id_preferred1',
                  preferred: true,
                },
              ],
              emails: ['test@email.com', 'anothertest@email.com'],
            },
          },
        ],
      })
    )

    api.post = initialGetProfile
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          authorids: {
            value: ['~test_id1'], // revision invitation may only allow reorder
          },
        },
        value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await waitFor(() => {
      expect(screen.getByText('Test First Test Last')).toBeInTheDocument()
      expect(
        screen.queryByText('Test First Preferred Test Last Preferred')
      ).not.toBeInTheDocument()
    })
  })

  test('add button is disabled when search result has been added (same profile id )', async () => {
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              emails: ['test@email.com', 'anothertest@email.com'],
            },
          },
        ],
      })
    )
    const searchProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              emails: ['test1@email.com', 'anothertest1@email.com'],
            },
          },
        ],
        count: 1,
      })
    )
    api.post = initialGetProfile
    api.get = searchProfile
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'anothertest1@email.com'
    )
    await userEvent.click(screen.getByText('Search'))
    await expect(screen.getByRole('button', { name: 'plus' })).toHaveAttribute('disabled')
  })

  test('add button is disabled when search result has been added (different profile id because of preferred name update )', async () => {
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              emails: ['test@email.com', 'anothertest@email.com'],
            },
          },
        ],
      })
    )
    const searchProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id_preferred1',
            content: {
              names: [
                { fullname: 'Test First Test Last', username: '~test_id1' },
                // user updated preferred name after profile search modal is open
                {
                  fullname: 'Test First Preferred Test Last Preferred',
                  username: '~test_id_preferred1',
                  preferred: true,
                },
              ],
              emails: ['test1@email.com', 'anothertest1@email.com'],
            },
          },
        ],
        count: 1,
      })
    )
    api.post = initialGetProfile
    api.get = searchProfile
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'anothertest1@email.com'
    )
    await userEvent.click(screen.getByText('Search'))
    await expect(screen.getByRole('button', { name: 'plus' })).toHaveAttribute('disabled')
  })

  test('call update when an author is added', async () => {
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              emails: ['test@email.com', 'anothertest@email.com'],
            },
          },
        ],
      })
    )
    const searchProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~search_result1',
            content: {
              names: [
                { fullname: 'Result First Result Last', username: '~search_result1' },
                {
                  fullname: 'Result First Preferred Result Last Preferred',
                  username: '~search_result_preferred1',
                  preferred: true,
                },
              ],
              emails: ['test1@email.com', 'anothertest1@email.com'],
            },
          },
        ],
        count: 1,
      })
    )
    api.post = initialGetProfile
    api.get = searchProfile
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'anothertest1@email.com'
    )
    await userEvent.click(screen.getByText('Search'))
    await userEvent.click(screen.getByRole('button', { name: 'plus' }))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        value: [
          { authorId: '~test_id1', authorName: 'Test First Test Last' },
          {
            authorId: '~search_result_preferred1',
            authorName: 'Result First Preferred Result Last Preferred',
          },
        ],
      })
    )
    expect(clearError).toHaveBeenCalled()
  })

  test("call update when an author's position in author list is adjusted", async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'First One Last One', username: '~test_id1' }],
              emails: ['test1@email.com'],
            },
          },
          {
            id: '~test_id2',
            content: {
              names: [{ fullname: 'First Two Last Two', username: '~test_id2' }],
              emails: ['test2@email.com'],
            },
          },
        ],
      })
    )
    api.post = initialGetProfile
    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
              },
            },
          },
        },
        value: [
          { authorId: '~test_id1', authorName: 'First One Last One' },
          { authorId: '~test_id2', authorName: 'First Two Last Two' },
        ],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)
    await userEvent.click(screen.getByRole('button', { name: 'arrow-right' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        value: [
          { authorId: '~test_id2', authorName: 'First Two Last Two' },
          { authorId: '~test_id1', authorName: 'First One Last One' },
        ],
      })
    )
    expect(clearError).not.toHaveBeenCalled()
  })

  test('call update when an author is removed from author list', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'First One Last One', username: '~test_id1' }],
              emails: ['test1@email.com'],
            },
          },
          {
            id: '~test_id2',
            content: {
              names: [{ fullname: 'First Two Last Two', username: '~test_id2' }],
              emails: ['test2@email.com'],
            },
          },
        ],
      })
    )
    api.post = initialGetProfile
    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [
          { authorId: '~test_id1', authorName: 'First One Last One' },
          { authorId: '~test_id2', authorName: 'First Two Last Two' },
        ],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await userEvent.click(screen.getAllByRole('button', { name: 'remove' })[0])
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        value: [{ authorId: '~test_id2', authorName: 'First Two Last Two' }],
      })
    )

    await userEvent.click(screen.getAllByRole('button', { name: 'remove' })[0]) // ~test_id1 has been removed from internal state
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        value: undefined,
      })
    )
    expect(clearError).not.toHaveBeenCalled()
  })

  test('show pagination links when there are many search results', async () => {
    const profiles = Array.from(new Array(150), (_, p) => ({
      id: `~search_result${p}`,
      content: {
        names: [
          {
            fullname: `Result First ${p}`,
            username: `~search_result${p}`,
          },
        ],
        emails: [`test${p}@email.com`, `anothertest${p}@email.com`],
      },
    }))
    const searchProfile = jest.fn((_, { offset, limit }) =>
      Promise.resolve({
        profiles: profiles.slice(offset, offset + limit),
        count: 150,
      })
    )
    api.post = jest.fn(() => Promise.resolve([]))
    api.get = searchProfile
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        onChange,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'search text'
    )
    await userEvent.click(screen.getByText('Search'))
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.queryByText('Showing 1-20 of 150')).not.toBeInTheDocument() // not to show count
    expect(screen.getByRole('link', { name: '~ search _ result 2' })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: '~ search _ result 130' })
    ).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '7' }))
    expect(screen.queryByText('Showing 121-140 of 150')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '~ search _ result 130' })).toBeInTheDocument()
  })

  test('show error message when profile search end point is not working', async () => {
    api.post = jest.fn(() => Promise.reject({ message: 'post search is not working' }))
    api.get = jest.fn(() => Promise.reject({ message: 'get search is also not working' }))
    const promptError = jest.fn()
    global.promptError = promptError

    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget />, providerProps)
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/profiles/search',
        { ids: ['~test_id1'] },
        expect.anything()
      )
      expect(promptError).toHaveBeenCalledWith('post search is not working')
    })

    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'search text'
    )
    await userEvent.click(screen.getByText('Search'))
    expect(promptError).toHaveBeenNthCalledWith(2, 'get search is also not working')
  })

  test('show message and custom author form if search returned empty results', async () => {
    api.post = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))

    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)
    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'some search term'
    )
    await userEvent.click(screen.getByText('Search'))
    expect(
      screen.getByText('No results found for your search query.', { exact: false })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Manually Enter Author Info' })
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Manually Enter Author Info' }))
    expect(screen.getByPlaceholderText('Full name of the author to add')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email of the author to add')).toBeInTheDocument()
    expect(screen.getByText('Add')).toHaveAttribute('disabled')
  })

  test('show custom author form if regex has pipe', async () => {
    api.post = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))

    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)
    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'some search term'
    )
    await userEvent.click(screen.getByText('Search'))
    expect(
      screen.getByText('No results found for your search query.', { exact: false })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Manually Enter Author Info' })
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Manually Enter Author Info' }))
    expect(screen.getByPlaceholderText('Full name of the author to add')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email of the author to add')).toBeInTheDocument()
    expect(screen.getByText('Add')).toHaveAttribute('disabled')
  })

  test('not to show custom author form if regex has no pipe', async () => {
    api.post = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))

    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex: '^~\\S+$',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)
    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'some search term'
    )
    await userEvent.click(screen.getByText('Search'))
    expect(
      screen.getByText('No results found for your search query.', { exact: false })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Manually Enter Author Info' })
    ).not.toBeInTheDocument()
  })

  test('fill in the custom author form based on user input (only for email)', async () => {
    api.post = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))

    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)
    const searchInput = screen.getByPlaceholderText('search profiles by email or name')
    await userEvent.type(searchInput, '   some search term   ')
    await userEvent.click(screen.getByText('Search'))
    await userEvent.click(screen.getByRole('button', { name: 'Manually Enter Author Info' }))

    expect(screen.getByPlaceholderText('Full name of the author to add')).toHaveValue('') // not to fill for name incase it's not complete name

    await userEvent.clear(screen.getByPlaceholderText('search profiles by email or name'))
    await userEvent.type(searchInput, '   test@EMAIL.COM   ')
    await userEvent.click(screen.getByText('Search'))
    await userEvent.click(screen.getByRole('button', { name: 'Manually Enter Author Info' }))

    expect(screen.getByPlaceholderText('Email of the author to add')).toHaveValue(
      'test@email.com'
    )
  })

  test('call update when custom author is added (the custom email does not match any profile)', async () => {
    api.post = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))
    const onChange = jest.fn()
    const clearError = jest.fn()

    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)
    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'fullname of'
    )
    await userEvent.click(screen.getByText('Search'))
    await userEvent.click(screen.getByRole('button', { name: 'Manually Enter Author Info' }))
    expect(screen.getByText('Add')).toHaveAttribute('disabled')

    await userEvent.type(
      screen.getByPlaceholderText('Full name of the author to add'),
      'fullname of the author'
    )
    expect(screen.getByText('Add')).toHaveAttribute('disabled')

    await userEvent.type(
      screen.getByPlaceholderText('Email of the author to add'),
      'test@email.com'
    )
    expect(screen.getByText('Add')).not.toHaveAttribute('disabled')

    await userEvent.click(screen.getByText('Add'))
    expect(clearError).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        value: [
          { authorId: '~test_id1', authorName: 'Test First Test Last' },
          { authorId: 'test@email.com', authorName: 'fullname of the author' },
        ],
      })
    )
  })

  test('show search results when custom author is added (custom email has matching profile)', async () => {
    api.post = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~search_result1',
            content: {
              names: [{ fullname: 'profile name of author', username: '~search_result1' }],
              emails: ['test@email.com'],
            },
          },
        ],
        count: 1,
      })
    )
    const onChange = jest.fn()

    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        onChange,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)
    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'fullname of'
    )
    await userEvent.click(screen.getByText('Search'))

    await userEvent.click(screen.getByRole('button', { name: 'Manually Enter Author Info' }))
    expect(screen.getByText('Add')).toHaveAttribute('disabled')

    await userEvent.type(
      screen.getByPlaceholderText('Full name of the author to add'),
      'fullname of the author'
    )
    expect(screen.getByText('Add')).toHaveAttribute('disabled')

    await userEvent.type(
      screen.getByPlaceholderText('Email of the author to add'),
      'test@email.com'
    )
    expect(screen.getByText('Add')).not.toHaveAttribute('disabled')

    await userEvent.click(screen.getByText('Add'))

    // show search results found by custom email entered
    expect(screen.getAllByText('~', { exact: false })[0].parentElement.textContent).toEqual(
      '~search_result1'
    )
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(screen.getByText('Add').childElementCount).toEqual(0) // not to show loading icon

    await userEvent.click(screen.getByRole('button', { name: 'plus' }))
    expect(onChange).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        value: [
          { authorId: '~test_id1', authorName: 'Test First Test Last' },
          { authorId: '~search_result1', authorName: 'profile name of author' },
        ],
      })
    )
  })

  test('not to allow custom author to be duplicated', async () => {
    api.post = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))
    const onChange = jest.fn()
    const clearError = jest.fn()

    const providerProps = {
      value: {
        field: {
          authorids: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: [
          { authorId: '~test_id1', authorName: 'Test First Test Last' },
          { authorId: 'test@email.com', authorName: 'fullname of the author' },
        ],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)
    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'fullname of'
    )
    await userEvent.click(screen.getByText('Search'))
    await userEvent.click(screen.getByRole('button', { name: 'Manually Enter Author Info' }))
    expect(screen.getByText('Add')).toHaveAttribute('disabled')

    // add the same custom author test@email.com again
    await userEvent.type(
      screen.getByPlaceholderText('Full name of the author to add'),
      'a different name of the author'
    )
    expect(screen.getByText('Add')).toHaveAttribute('disabled')

    await userEvent.type(
      screen.getByPlaceholderText('Email of the author to add'),
      '   TEST@EMAIL.COM   ' // same as test@email.com
    )
    expect(screen.getByText('Add')).toHaveAttribute('disabled')
  })
})

describe('ProfileSearchWidget for non authorids field', () => {
  // data is array of tilde ids instead of array of id + name objects
  // no custom authors
  test('not to show custom author form', async () => {
    api.post = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))

    const providerProps = {
      value: {
        field: {
          corresponding_author: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: ['~test_id1'],
        onChange: jest.fn(),
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)
    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'some search term'
    )
    await userEvent.click(screen.getByText('Search'))
    expect(
      screen.getByText('No results found for your search query.', { exact: false })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Manually Enter Author Info' })
    ).not.toBeInTheDocument()
  })

  test('call update when an author is added', async () => {
    const searchProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~search_result1',
            content: {
              names: [
                { fullname: 'Result First Result Last', username: '~search_result1' },
                {
                  fullname: 'Result First Preferred Result Last Preferred',
                  username: '~search_result_preferred1',
                  preferred: true,
                },
              ],
              emails: ['test1@email.com', 'anothertest1@email.com'],
            },
          },
        ],
        count: 1,
      })
    )
    api.get = searchProfile
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          corresponding_author: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'anothertest1@email.com'
    )
    await userEvent.click(screen.getByText('Search'))
    await userEvent.click(screen.getByRole('button', { name: 'plus' }))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        value: ['~search_result_preferred1'],
      })
    )
    expect(clearError).toHaveBeenCalled()
  })

  test("call update when an author's position in author list is adjusted", async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'First One Last One', username: '~test_id1' }],
              emails: ['test1@email.com'],
            },
          },
          {
            id: '~test_id2',
            content: {
              names: [{ fullname: 'First Two Last Two', username: '~test_id2' }],
              emails: ['test2@email.com'],
            },
          },
        ],
      })
    )
    api.post = initialGetProfile
    const providerProps = {
      value: {
        field: {
          corresponding_author: {
            value: {
              param: {
                type: 'group[]',
              },
            },
          },
        },
        value: ['~test_id1', '~test_id2'],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)
    await userEvent.click(screen.getByRole('button', { name: 'arrow-right' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        value: ['~test_id2', '~test_id1'],
      })
    )
    expect(clearError).not.toHaveBeenCalled()
  })

  test('call update when an author is removed from author list', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'First One Last One', username: '~test_id1' }],
              emails: ['test1@email.com'],
            },
          },
          {
            id: '~test_id2',
            content: {
              names: [{ fullname: 'First Two Last Two', username: '~test_id2' }],
              emails: ['test2@email.com'],
            },
          },
        ],
      })
    )
    api.post = initialGetProfile
    const providerProps = {
      value: {
        field: {
          corresponding_author: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: ['~test_id1', '~test_id2'],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await userEvent.click(screen.getAllByRole('button', { name: 'remove' })[0])
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        value: ['~test_id2'],
      })
    )

    await userEvent.click(screen.getAllByRole('button', { name: 'remove' })[0]) // ~test_id1 has been removed from internal state
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        value: undefined,
      })
    )
    expect(clearError).not.toHaveBeenCalled()
  })

  test('allow only 1 profile to be added when multiple is false', async () => {
    const searchProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~search_result1',
            content: {
              names: [{ fullname: 'Result First Result Last', username: '~search_result1' }],
              emails: ['test1@email.com', 'anothertest1@email.com'],
            },
          },
        ],
        count: 1,
      })
    )
    api.get = searchProfile
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          corresponding_author: {
            value: {
              param: {
                type: 'group', // invitation type group instead of group[] will cause multiple to be false
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={false} />, providerProps)

    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'anothertest1@email.com'
    )
    await userEvent.click(screen.getByText('Search'))
    await userEvent.click(screen.getByRole('button', { name: 'plus' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: '~search_result1' })
    ) // group is string instead of array

    expect(
      screen.queryByPlaceholderText('search profiles by email or name')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Search')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: undefined }))
    expect(screen.getByPlaceholderText('search profiles by email or name')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  test('add button is disabled when search result has been added', async () => {
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              emails: ['test@email.com', 'anothertest@email.com'],
            },
          },
        ],
      })
    )
    const searchProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              emails: ['test1@email.com', 'anothertest1@email.com'],
            },
          },
        ],
        count: 1,
      })
    )
    api.post = initialGetProfile
    api.get = searchProfile
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          corresponding_author: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: ['~test_id1'],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await userEvent.type(
      screen.getByPlaceholderText('search profiles by email or name'),
      'anothertest1@email.com'
    )
    await userEvent.click(screen.getByText('Search'))
    await expect(screen.getByRole('button', { name: 'plus' })).toHaveAttribute('disabled')
    expect(
      screen.getAllByText('~', { exact: false })[0].parentElement.nextSibling
    ).toHaveAttribute('class', expect.stringContaining('glyphicon-remove-sign'))
  })

  test('display updated author name (no update of actual value) if preferred name has changed since submission', async () => {
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id_preferred1',
            content: {
              names: [
                { fullname: 'Test First Test Last', username: '~test_id1' },
                {
                  // user updated preferred name after submission
                  fullname: 'Test First Preferred Test Last Preferred',
                  username: '~test_id_preferred1',
                  preferred: true,
                },
              ],
              emails: ['test@email.com', 'anothertest@email.com'],
            },
          },
        ],
      })
    )

    api.post = initialGetProfile
    const onChange = jest.fn()
    const clearError = jest.fn()
    const providerProps = {
      value: {
        field: {
          corresponding_author: {
            value: {
              param: {
                type: 'group[]',
                regex:
                  '^~\\S+$|([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{1,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
              },
            },
          },
        },
        value: ['~test_id1'],
        onChange,
        clearError,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWidget multiple={true} />, providerProps)

    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.queryByText('Test First Test Last')).not.toBeInTheDocument() // replaced by new preferred name
      expect(screen.getByText('Test First Preferred Test Last Preferred')).toBeInTheDocument()
      expect(screen.getByText('Test First Preferred Test Last Preferred')).toHaveAttribute(
        'data-original-title',
        '~test_id_preferred1'
      )
    })
  })
})

describe('ProfileSearchWidget to be used by itself', () => {
  // for example to be used in profile relation
  // properties will be passed directly instead of through context
  test('show search input and search button', async () => {
    const props = {
      isEditor: false,
      searchInputPlaceHolder: 'Search relation by name or email',
      className: 'test-class-name',
    }
    const { container } = render(<ProfileSearchWidget {...props} />)

    expect(container.firstChild).toHaveAttribute(
      'class',
      expect.stringContaining(props.className)
    )
    const searchInput = screen.getByPlaceholderText(props.searchInputPlaceHolder)
    expect(searchInput).toBeInTheDocument()
    expect(screen.getByText('Search')).toHaveAttribute('disabled')

    await userEvent.type(searchInput, 'some text')
    expect(screen.getByText('Search')).not.toHaveAttribute('disabled')
  })

  test('not to get profile of current user', () => {
    const initialGetProfile = jest.fn()
    api.post = initialGetProfile

    const props = {
      isEditor: false,
      searchInputPlaceHolder: 'Search relation by name or email',
    }
    render(<ProfileSearchWidget {...props} />)

    expect(initialGetProfile).not.toHaveBeenCalled()
  })

  // how many results per page
  test('paginate results based on pageSize prop', async () => {
    const profiles = Array.from(new Array(150), (_, p) => ({
      id: `~search_result${p}`,
      content: {
        names: [
          {
            fullname: `Result First ${p}`,
            username: `~search_result${p}`,
          },
        ],
        emails: [`test${p}@email.com`, `anothertest${p}@email.com`],
      },
    }))
    const searchProfile = jest.fn((_, { offset, limit }) =>
      Promise.resolve({
        profiles: profiles.slice(offset, offset + limit),
        count: 150,
      })
    )
    api.get = searchProfile
    const props = {
      isEditor: false,
      searchInputPlaceHolder: 'Search relation by name or email',
      pageSize: 2,
    }

    render(<ProfileSearchWidget {...props} />)

    await userEvent.type(
      screen.getByPlaceholderText(props.searchInputPlaceHolder),
      'search text'
    )
    await userEvent.click(screen.getByText('Search'))

    expect(searchProfile).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ limit: props.pageSize, fullname: 'search text' }),
      expect.anything()
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '~ search _ result 0' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '~ search _ result 1' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '~ search _ result 2' })).not.toBeInTheDocument()
  })

  // how many pagination link to show
  test('paginate results based on pageListLength prop', async () => {
    const profiles = Array.from(new Array(150), (_, p) => ({
      id: `~search_result${p}`,
      content: {
        names: [
          {
            fullname: `Result First ${p}`,
            username: `~search_result${p}`,
          },
        ],
        emails: [`test${p}@email.com`, `anothertest${p}@email.com`],
      },
    }))
    const searchProfile = jest.fn((_, { offset, limit }) =>
      Promise.resolve({
        profiles: profiles.slice(offset, offset + limit),
        count: 150,
      })
    )
    api.get = searchProfile
    const props = {
      isEditor: false,
      searchInputPlaceHolder: 'Search relation by name or email',
      pageSize: 2,
      pageListLength: 12,
    }

    render(<ProfileSearchWidget {...props} />)

    await userEvent.type(
      screen.getByPlaceholderText(props.searchInputPlaceHolder),
      'search text'
    )
    await userEvent.click(screen.getByText('Search'))

    expect(searchProfile).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ limit: props.pageSize, fullname: 'search text' }),
      expect.anything()
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '8' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '9' })).not.toBeInTheDocument()
  })

  test('show text based on fieldName', async () => {
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))
    const props = {
      isEditor: false,
      searchInputPlaceHolder: 'Search relation by name or email',
      pageSize: 2,
      field: { 'some dummy name': '' },
    }

    render(<ProfileSearchWidget {...props} />)

    await userEvent.type(
      screen.getByPlaceholderText(props.searchInputPlaceHolder),
      'search text'
    )
    await userEvent.click(screen.getByText('Search'))

    const manualEnterButton = screen.getByText('Manually Enter Some dummy name Info')
    expect(manualEnterButton).toBeInTheDocument()

    await userEvent.click(manualEnterButton)
    expect(
      screen.getByPlaceholderText('Full name of the some dummy name to add')
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Email of the some dummy name to add')
    ).toBeInTheDocument()
  })

  test('call onChange passing info of select profile', async () => {
    const profile = {
      id: '~search_result1',
      content: {
        names: [
          { fullname: 'Result First Result Last', username: '~search_result1' },
          {
            fullname: 'preferred name',
            username: '~preferred_name1',
            preferred: true,
          },
        ],
        emails: ['test1@email.com', 'anothertest1@email.com'],
      },
    }
    const searchProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [profile],
        count: 1,
      })
    )
    api.get = searchProfile
    const onChange = jest.fn()

    const props = {
      isEditor: false,
      searchInputPlaceHolder: 'Search relation by name or email',
      pageSize: 2,
      field: { relation: '' },
      onChange,
    }

    render(<ProfileSearchWidget {...props} />)

    await userEvent.type(
      screen.getByPlaceholderText(props.searchInputPlaceHolder),
      'some name/email/tildeid to search'
    )
    await userEvent.click(screen.getByText('Search'))
    await userEvent.click(screen.getByRole('button', { name: 'plus' }))

    // use username and name
    expect(onChange).toHaveBeenCalledWith(
      '~preferred_name1',
      'preferred name',
      undefined, // this profile has no preferred email
      profile
    )
  })

  test('show search results when profile is manually entered (has matching profile)', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~search_result1',
            content: {
              names: [{ fullname: 'profile name of author', username: '~search_result1' }],
              emails: ['test@email.com'],
            },
          },
        ],
        count: 1,
      })
    )
    const onChange = jest.fn()

    const props = {
      isEditor: false,
      searchInputPlaceHolder: 'Search relation by name or email',
      pageSize: 2,
      field: { relation: '' },
      onChange,
    }

    render(<ProfileSearchWidget {...props} />)

    await userEvent.type(
      screen.getByPlaceholderText(props.searchInputPlaceHolder),
      'some name/email/tildeid to search'
    )
    await userEvent.click(screen.getByText('Search'))
    await userEvent.click(screen.getByRole('button', { name: 'Manually Enter Relation Info' }))

    await userEvent.type(
      screen.getByPlaceholderText('Full name of the relation to add'),
      'fullname'
    )

    await userEvent.type(
      screen.getByPlaceholderText('Email of the relation to add'),
      'test@email.com'
    )

    await userEvent.click(screen.getByText('Add'))

    // show search results found by custom email entered
    expect(screen.getAllByText('~', { exact: false })[0].parentElement.textContent).toEqual(
      '~search_result1'
    )
    expect(onChange).not.toHaveBeenCalled()
  })

  test('call onChange passing name and email when profile is manually entered (no matching profile)', async () => {
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))
    const onChange = jest.fn()

    const props = {
      isEditor: false,
      searchInputPlaceHolder: 'Search relation by name or email',
      pageSize: 2,
      field: { relation: '' },
      onChange,
    }

    render(<ProfileSearchWidget {...props} />)

    await userEvent.type(
      screen.getByPlaceholderText(props.searchInputPlaceHolder),
      'some name/email/tildeid to search'
    )
    await userEvent.click(screen.getByText('Search'))
    await userEvent.click(screen.getByRole('button', { name: 'Manually Enter Relation Info' }))

    await userEvent.type(
      screen.getByPlaceholderText('Full name of the relation to add'),
      'fullname'
    )

    await userEvent.type(
      screen.getByPlaceholderText('Email of the relation to add'),
      'test@email.nomatch' // does not match search result
    )

    await userEvent.click(screen.getByText('Add'))
    // a user may have this email but not confirmed
    // seach by confiemedEmail (not returning any profile) allow user to add the custom relation
    expect(api.get).toHaveBeenCalledWith(
      '/profiles/search',
      expect.objectContaining({
        confirmedEmail: 'test@email.nomatch',
      }),
      expect.anything()
    )
    expect(onChange).toHaveBeenCalledWith(
      undefined,
      'fullname',
      'test@email.nomatch',
      undefined
    )
  })

  test('allow consumer to provide a custom search form', () => {
    const props = {
      isEditor: false,
      searchInputPlaceHolder: 'Search relation by name or email',
      pageSize: 2,
      field: { relation: '' },
      CustomProfileSearchForm: () => <div>custom search form</div>,
    }

    render(<ProfileSearchWidget {...props} />)
    expect(screen.getByText('custom search form')).toBeInTheDocument()
    expect(screen.queryByText(props.searchInputPlaceHolder)).not.toBeInTheDocument() // default form not shown
  })
})
