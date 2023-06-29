import { screen, waitFor } from '@testing-library/react'
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
      expect(screen.getByPlaceholderText('search profiles by email or name'))
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
      expect(screen.getByRole('button', { name: 'arrow-right' }))
    })
  })

  test('add current user to author list', async () => {
    const apiPost = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ first: 'Test First', last: 'Test Last', username: '~test_id1' }],
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
      expect(onChange).toBeCalledWith(
        expect.objectContaining({
          value: [{ authorId: '~test_id1', authorName: 'Test First Test Last' }],
        })
      )
      expect(apiPost).toBeCalledWith(
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
      expect(screen.getByText('Test First Test Last'))
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
              names: [{ first: 'First One', last: 'Last One', username: '~test_id1' }],
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

  test('show profile search results', async () => {
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ first: 'Test First', last: 'Test Last', username: '~test_id1' }],
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
                { first: 'Result one', last: 'Result one', username: '~search_result1' },
              ],
              emails: ['test1@email.com', 'anothertest1@email.com'],
            },
          },
          {
            id: '~search_result2',
            content: {
              names: [
                { first: 'Result two', last: 'Result two', username: '~search_result2' },
              ],
              emails: ['test2@email.com', 'anothertest2@email.com'],
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
      '~search_result1'
    )
    expect(screen.getAllByText('~', { exact: false })[1].parentElement.textContent).toEqual(
      '~search_result2'
    )
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
    expect(getProfile).toBeCalledWith(
      '/profiles/search',
      { email: 'test@email.com', es: true, limit: 15, offset: 0 },
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
    expect(getProfile).toBeCalledWith(
      '/profiles/search',
      { id: '~Test_User1', es: true, limit: 15, offset: 0 },
      expect.anything()
    )
  })

  test('call update when an author is added', async () => {
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ first: 'Test First', last: 'Test Last', username: '~test_id1' }],
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
                { first: 'Result First', last: 'Result Last', username: '~search_result1' },
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

    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: [
          { authorId: '~test_id1', authorName: 'Test First Test Last' },
          { authorId: '~search_result1', authorName: 'Result First Result Last' },
        ],
      })
    )
    expect(clearError).toBeCalled()
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
              names: [{ first: 'First One', last: 'Last One', username: '~test_id1' }],
              emails: ['test1@email.com'],
            },
          },
          {
            id: '~test_id2',
            content: {
              names: [{ first: 'First Two', last: 'Last Two', username: '~test_id2' }],
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
    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: [
          { authorId: '~test_id2', authorName: 'First Two Last Two' },
          { authorId: '~test_id1', authorName: 'First One Last One' },
        ],
      })
    )
    expect(clearError).not.toHaveBeenCalled()
  })

  test('call update when an author is removed from author list ', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ first: 'First One', last: 'Last One', username: '~test_id1' }],
              emails: ['test1@email.com'],
            },
          },
          {
            id: '~test_id2',
            content: {
              names: [{ first: 'First Two', last: 'Last Two', username: '~test_id2' }],
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
    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: [{ authorId: '~test_id2', authorName: 'First Two Last Two' }],
      })
    )

    await userEvent.click(screen.getAllByRole('button', { name: 'remove' })[0]) // ~test_id1 has been removed from internal state
    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: undefined,
      })
    )
    expect(clearError).not.toHaveBeenCalled()
  })

  test('show pagination links when there are many search results', async () => {
    const profiles = [...new Array(150).keys()].map((p) => ({
      id: `~search_result${p}`,
      content: {
        names: [
          {
            first: `Result First ${p}`,
            last: `Result Last${p}`,
            username: `~search_result${p}`,
          },
        ],
        emails: [`test${p}@email.com`, `anothertest${p}@email.com`],
      },
    }))
    const searchProfile = jest.fn(() =>
      Promise.resolve({
        profiles,
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
    expect(screen.getByRole('navigation'))
    expect(screen.getByText('Showing 1-15 of 150'))
    expect(screen.getByRole('link', { name: '~ search _ result 2' }))

    await userEvent.click(screen.getByRole('button', { name: '7' }))
    expect(screen.getByText('Showing 91-105 of 150'))
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
      expect(promptError).toBeCalledWith('post search is not working')
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
    expect(screen.getByText('No results found for your search query.', { exact: false }))
    expect(screen.getByRole('button', { name: 'Manually Enter Author Info' }))

    await userEvent.click(screen.getByRole('button', { name: 'Manually Enter Author Info' }))
    expect(screen.getByPlaceholderText('full name of the author to add'))
    expect(screen.getByPlaceholderText('email of the author to add'))
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
    expect(screen.getByText('No results found for your search query.', { exact: false }))
    expect(screen.getByRole('button', { name: 'Manually Enter Author Info' }))

    await userEvent.click(screen.getByRole('button', { name: 'Manually Enter Author Info' }))
    expect(screen.getByPlaceholderText('full name of the author to add'))
    expect(screen.getByPlaceholderText('email of the author to add'))
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
    expect(screen.getByText('No results found for your search query.', { exact: false }))
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

    expect(screen.getByPlaceholderText('full name of the author to add')).toHaveValue('') // not to fill for name incase it's not complete name

    await userEvent.clear(screen.getByPlaceholderText('search profiles by email or name'))
    await userEvent.type(searchInput, '   test@EMAIL.COM   ')
    await userEvent.click(screen.getByText('Search'))
    await userEvent.click(screen.getByRole('button', { name: 'Manually Enter Author Info' }))

    expect(screen.getByPlaceholderText('email of the author to add')).toHaveValue(
      'test@email.com'
    )
  })

  test('call update when custom author is added', async () => {
    api.post = jest.fn(() => Promise.resolve([]))
    api.get = jest.fn(() => Promise.resolve({ profiles: [] }))
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
      screen.getByPlaceholderText('full name of the author to add'),
      'fullname of the author'
    )
    expect(screen.getByText('Add')).toHaveAttribute('disabled')

    await userEvent.type(
      screen.getByPlaceholderText('email of the author to add'),
      'test@email.com'
    )
    expect(screen.getByText('Add')).not.toHaveAttribute('disabled')

    await userEvent.click(screen.getByText('Add'))
    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: [
          { authorId: '~test_id1', authorName: 'Test First Test Last' },
          { authorId: 'test@email.com', authorName: 'fullname of the author' },
        ],
      })
    )
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
    expect(screen.getByText('No results found for your search query.', { exact: false }))
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
                { first: 'Result First', last: 'Result Last', username: '~search_result1' },
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

    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: ['~search_result1'],
      })
    )
    expect(clearError).toBeCalled()
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
              names: [{ first: 'First One', last: 'Last One', username: '~test_id1' }],
              emails: ['test1@email.com'],
            },
          },
          {
            id: '~test_id2',
            content: {
              names: [{ first: 'First Two', last: 'Last Two', username: '~test_id2' }],
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
    screen.debug()
    await userEvent.click(screen.getByRole('button', { name: 'arrow-right' }))
    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: ['~test_id2', '~test_id1'],
      })
    )
    expect(clearError).not.toHaveBeenCalled()
  })

  test('call update when an author is removed from author list ', async () => {
    const onChange = jest.fn()
    const clearError = jest.fn()
    const initialGetProfile = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ first: 'First One', last: 'Last One', username: '~test_id1' }],
              emails: ['test1@email.com'],
            },
          },
          {
            id: '~test_id2',
            content: {
              names: [{ first: 'First Two', last: 'Last Two', username: '~test_id2' }],
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
    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        value: ['~test_id2'],
      })
    )

    await userEvent.click(screen.getAllByRole('button', { name: 'remove' })[0]) // ~test_id1 has been removed from internal state
    expect(onChange).toBeCalledWith(
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
              names: [
                { first: 'Result First', last: 'Result Last', username: '~search_result1' },
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
    expect(onChange).toBeCalledWith(expect.objectContaining({ value: '~search_result1' })) // group is string instead of array

    expect(
      screen.queryByPlaceholderText('search profiles by email or name')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Search')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: undefined }))
    expect(screen.getByPlaceholderText('search profiles by email or name')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
  })
})
