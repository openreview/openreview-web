import ProfileSearchWidget from '../components/EditorComponents/ProfileSearchWidget'
import { screen, waitFor } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

jest.mock('../hooks/useUser', () => {
  return () => ({ user: { profile: { id: '~test_id1' } }, accessToken: 'test token' })
})

global.$ = jest.fn(() => ({
  tooltip: jest.fn(),
}))

import api from '../lib/api-client'

describe('ProfileSearchWidget', () => {
  test('render search input and disabled search button', async () => {
    const apiPost = jest.fn(() => Promise.resolve([]))
    api.post = apiPost

    const providerProps = {
      value: {
        field: {
          ['authorid']: {
            value: {
              param: {
                type: 'group[]',
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
          ['authorid']: {
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
          ['authorid']: {
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
        expect.objectContaining({ value: [{ authorId: '~test_id1' }] })
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
        'title',
        'test@email.com'
      )
    })
  })

  test('show profile search results', async () => {
    const getProfile = jest.fn(() =>
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
      })
    )
    api.post = getProfile
    api.get = searchProfile

    const providerProps = {
      value: {
        field: {
          ['authorid']: {
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

    renderWithEditorComponentContext(<ProfileSearchWidget />, providerProps)

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
})
